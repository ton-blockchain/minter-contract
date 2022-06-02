import BN from "bn.js";
import { Address, beginCell, Cell, toNano, TonClient } from "ton";
import { TransactionSender } from "./transaction-sender";
import { ContractDeployer } from "./contract-deployer";

// TODO temporary
import axios from "axios";
import axiosThrottle from "axios-request-throttle";
import { FileUploader } from "./file-uploader";
import { parseGetMethodCall, waitForContractDeploy } from "./utils";
import { initData, mintBody, JETTON_MINTER_CODE } from "../contracts/jetton-minter";
import { JettonMinterContract, JettonWalletContract, TonClientExecutor } from "../ton-helpers/my-executor";
axiosThrottle.use(axios, { requestsPerSecond: 0.9 }); // required since toncenter jsonRPC limits to 1 req/sec without API key

export const JETTON_DEPLOY_GAS = toNano(0.25);

export enum JettonDeployState {
  NOT_STARTED,
  BALANCE_CHECK,
  UPLOAD_IMAGE,
  UPLOAD_METADATA,
  AWAITING_MINTER_DEPLOY,
  AWAITING_JWALLET_DEPLOY,
  VERIFY_MINT,
  ALREADY_DEPLOYED,
  DONE,
}

export interface JettonDeployParams {
  jettonName: string;
  jettonSymbol: string;
  jettonIconImageData: File | Buffer;
  jettonDescripton?: string;
  owner: Address;
  mintToOwner: boolean;
  amountToMint: BN;
  onProgress?: (state: JettonDeployState, error?: Error, msg?: string) => void;
}

export class JettonDeployController {
  #client: TonClient;

  constructor(client: TonClient) {
    this.#client = client;
  }

  async createJetton(params: JettonDeployParams, contractDeployer: ContractDeployer, transactionSender: TransactionSender, fileUploader: FileUploader) {
    params.onProgress?.(JettonDeployState.BALANCE_CHECK);
    const balance = await this.#client.getBalance(params.owner);
    if (balance.lt(JETTON_DEPLOY_GAS)) throw new Error("Not enough balance in deployer wallet");

    const ipfsImageLink = await fileUploader.upload(params.jettonIconImageData);
    const ipfsJsonLink = await fileUploader.upload(
      JSON.stringify({
        name: params.jettonName,
        symbol: params.jettonSymbol,
        description: params.jettonDescripton,
        image: ipfsImageLink,
      })
    );

    const deployParams = {
      code: JETTON_MINTER_CODE,
      data: initData(params.owner, ipfsJsonLink),
      deployer: params.owner,
      value: JETTON_DEPLOY_GAS,
      message: mintBody(params.owner, params.amountToMint),
    };

    const contractAddr = contractDeployer.addressForContract(deployParams);

    const jettonMinterContract = new JettonMinterContract(new TonClientExecutor(this.#client, contractAddr));

    // TODO: consider moving to Contract class?
    if (await this.#client.isContractDeployed(contractAddr)) {
      params.onProgress?.(JettonDeployState.ALREADY_DEPLOYED);
    } else {
      await contractDeployer.deployContract(deployParams, transactionSender);
      params.onProgress?.(JettonDeployState.AWAITING_MINTER_DEPLOY);
      await waitForContractDeploy(contractAddr, this.#client);
    }

    const { address: deployedOwnerAddress } = await jettonMinterContract.getJettonDetails();
    if (deployedOwnerAddress.toFriendly() !== params.owner.toFriendly()) throw new Error("Contract deployed incorrectly");
    
    const ownerJWalletAddr = await jettonMinterContract.getJWalletAddress(params.owner);
    await waitForContractDeploy(ownerJWalletAddr, this.#client);
    
    params.onProgress?.(JettonDeployState.VERIFY_MINT, undefined, contractAddr.toFriendly()); // TODO better way of emitting the contract?
    
    const jwalletContract = new JettonWalletContract(new TonClientExecutor(this.#client, ownerJWalletAddr));
    const { balance: jettonBalance } = await jwalletContract.getWalletData();

    if (!jettonBalance.eq(params.amountToMint)) throw new Error("Mint fail");
    params.onProgress?.(JettonDeployState.DONE);
  }

  async getJettonDetails(contractAddr: Address, owner: Address) {
    const jettonMinterContract = new JettonMinterContract(new TonClientExecutor(this.#client, contractAddr));
    const { contentUri } = await jettonMinterContract.getJettonDetails();
    const jsonData = (await axios.get(contentUri)).data; // TODO support onchain
    const ownerJWalletAddr = await jettonMinterContract.getJWalletAddress(owner);
    const jwalletContract = new JettonWalletContract(new TonClientExecutor(this.#client, ownerJWalletAddr));
    const { balance } = await jwalletContract.getWalletData();

    return {
      jetton: { ...jsonData, contractAddress: contractAddr.toFriendly() },
      wallet: {
        jettonAmount: balance,
        ownerJWallet: ownerJWalletAddr.toFriendly(),
        owner: owner.toFriendly(),
      },
    };
  }
}
