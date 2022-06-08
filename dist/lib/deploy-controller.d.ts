/// <reference types="node" />
import BN from "bn.js";
import { Address, TonClient } from "ton";
import { TransactionSender } from "./transaction-sender";
import { ContractDeployer } from "./contract-deployer";
export declare const JETTON_DEPLOY_GAS: BN;
export declare enum JettonDeployState {
    NOT_STARTED = 0,
    BALANCE_CHECK = 1,
    UPLOAD_IMAGE = 2,
    UPLOAD_METADATA = 3,
    AWAITING_MINTER_DEPLOY = 4,
    AWAITING_JWALLET_DEPLOY = 5,
    VERIFY_MINT = 6,
    ALREADY_DEPLOYED = 7,
    DONE = 8
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
export declare class JettonDeployController {
    #private;
    constructor(client: TonClient);
    createJetton(params: JettonDeployParams, contractDeployer: ContractDeployer, transactionSender: TransactionSender): Promise<void>;
    getJettonDetails(contractAddr: Address, owner: Address): Promise<{
        jetton: {
            contractAddress: string;
            symbol?: string | undefined;
            name?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
        };
        wallet: {
            jettonAmount: string;
            ownerJWallet: string;
            owner: string;
        };
    }>;
}
