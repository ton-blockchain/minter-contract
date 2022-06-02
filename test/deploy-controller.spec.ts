import { ContractDeployer } from "../lib/contract-deployer";
import { Address, Cell, toNano, TonClient, beginCell } from "ton";
import { randomAddress } from "./helpers";
import { TransactionDetails, TransactionSender } from "../lib/transaction-sender";
import chai, { assert, expect } from "chai";
import * as sinon from "ts-sinon";
import sinonChai from "sinon-chai";
import { JettonDeployController, JETTON_DEPLOY_GAS } from "../lib/deploy-controller";
import BN from "bn.js";
import { FileUploader } from "../lib/file-uploader";
import chaiAsPromised from "chai-as-promised";
import axios from "axios";

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe("Deploy Controller", () => {
  let transactionSenderStub: sinon.StubbedInstance<TransactionSender>;
  let fileUploaderStub: sinon.StubbedInstance<FileUploader>;
  let tonClient: sinon.StubbedInstance<TonClient>;
  let contractDeployer: sinon.StubbedInstance<ContractDeployer>;
  let deployController: JettonDeployController;

  const retVal = { gas_used: 0, stack: [] };
  const stubNumVal = (num: BN) => ["num", num.toString()];
  const cellToB64GetCall = (cell: Cell) => ["cell", { bytes: cell.toBoc().toString("base64") }];
  const addressToB64GetCell = (address: Address) => cellToB64GetCall(beginCell().storeAddress(address).endCell());


  const deployPayload = {
    amountToMint: toNano(0),
    jettonName: "",
    jettonSymbol: "",
    owner: randomAddress("owner"),
    mintToOwner: false,
    jettonIconImageData: Buffer.from(""),
    onProgress: () => {
      /* do nothing */
    },
  };

  beforeEach(() => {
    transactionSenderStub = sinon.stubInterface<TransactionSender>();
    fileUploaderStub = sinon.stubInterface<FileUploader>();
    fileUploaderStub.upload.resolves("");
    tonClient = sinon.stubConstructor(TonClient, { endpoint: "" });
    contractDeployer = sinon.stubConstructor(ContractDeployer);
    contractDeployer.addressForContract.returns(randomAddress("randAddr"));
    contractDeployer.deployContract.resolves(randomAddress("randAddrs"));
    deployController = new JettonDeployController(tonClient);
  });

  it("Deploys a jetton wallet", async () => {
    tonClient.isContractDeployed.onFirstCall().resolves(false).onSecondCall().resolves(true).onThirdCall().resolves(true);
    tonClient.getBalance.resolves(toNano(1));

    const stubGetJettonDataResponse = (stub: sinon.StubbedInstance<TonClient>, initialSupply: BN, ownerAddress: Address) => {
        stub.callGetMethod.withArgs(randomAddress("minterAddr"), "get_jetton_data").resolves({...retVal, stack: [
            stubNumVal(initialSupply), 
            stubNumVal(new BN(0)), 
            addressToB64GetCell(ownerAddress)
        ]});
    };

    stubGetJettonDataResponse(tonClient, new BN(0),randomAddress("owner"));
    tonClient.callGetMethod.callsFake(async (address: Address, name: string, params?: any[]) => {
      if (name === "get_wallet_address") {
        retVal.stack = [cellToB64GetCall(beginCell().storeAddress(randomAddress("jwalletaddr")).endCell())];
      } else if (name === "get_wallet_data") {
        retVal.stack = [stubNumVal(new BN(0))];
      }

      return retVal;
    });

    await deployController.createJetton(deployPayload, contractDeployer, transactionSenderStub, fileUploaderStub);
    await expect(deployController.createJetton(deployPayload, contractDeployer, transactionSenderStub, fileUploaderStub)).to.be.fulfilled;
    expect(fileUploaderStub.upload).to.have.been.calledTwice;
    expect(contractDeployer.deployContract).to.have.been.calledOnce;
  });

  it("Fails if amount was not minted to owner as provided", async () => {
    tonClient.isContractDeployed.onFirstCall().resolves(false).onSecondCall().resolves(true).onThirdCall().resolves(true);
    tonClient.getBalance.resolves(toNano(1));

    tonClient.callGetMethod.callsFake(async (address: Address, name: string, params?: any[]) => {
      if (name === "get_jetton_data") {
        retVal.stack = [stubNumVal(new BN(0)), stubNumVal(new BN(0)), cellToB64GetCall(beginCell().storeAddress(randomAddress("owner")).endCell())];
      } else if (name === "get_wallet_address") {
        retVal.stack = [cellToB64GetCall(beginCell().storeAddress(randomAddress("jwalletaddr")).endCell())];
      } else if (name === "get_wallet_data") {
        retVal.stack = [stubNumVal(new BN(0))];
      }

      return retVal;
    });

    // await deployController.createJetton(deployPayload, contractDeployer, transactionSenderStub, fileUploaderStub);
    await expect(deployController.createJetton({...deployPayload, amountToMint: toNano(1)}, contractDeployer, transactionSenderStub, fileUploaderStub)).to.be.rejected;
    expect(fileUploaderStub.upload).to.have.been.calledTwice;
    expect(contractDeployer.deployContract).to.have.been.calledOnce;
  });

  it("Fails if balance is less than minimum", async () => {
    tonClient.isContractDeployed.resolves(true);
    tonClient.getBalance.resolves(JETTON_DEPLOY_GAS.sub(new BN(1)));

    await expect(deployController.createJetton(deployPayload, contractDeployer, transactionSenderStub, fileUploaderStub)).to.be.rejectedWith(
      "Not enough balance in deployer wallet"
    );
  });

  it("Skips deployment if contract is already deployed", async () => {
    tonClient.isContractDeployed.resolves(true);
    tonClient.getBalance.resolves(toNano(1));

    tonClient.callGetMethod.callsFake(async (address: Address, name: string, params?: any[]) => {
      if (name === "get_jetton_data") {
        retVal.stack = [stubNumVal(new BN(0)), stubNumVal(new BN(0)), cellToB64GetCall(beginCell().storeAddress(randomAddress("owner")).endCell())];
      } else if (name === "get_wallet_address") {
        retVal.stack = [cellToB64GetCall(beginCell().storeAddress(randomAddress("jwalletaddr")).endCell())];
      } else if (name === "get_wallet_data") {
        retVal.stack = [stubNumVal(new BN(0))];
      }

      return retVal;
    });

    await expect(deployController.createJetton(deployPayload, contractDeployer, transactionSenderStub, fileUploaderStub)).to.be.fulfilled;
    expect(fileUploaderStub.upload).to.have.been.calledTwice;
    expect(contractDeployer.deployContract).to.not.have.been.called;
  });

  it("Retrieves jwallet details", async () => {
    const STUB_URI = "STUB";

    tonClient.callGetMethod.callsFake(async (address: Address, name: string, params?: any[]) => {
      if (name === "get_jetton_data") {
        retVal.stack = [
          stubNumVal(new BN(0)),
          stubNumVal(new BN(0)),
          cellToB64GetCall(beginCell().storeAddress(randomAddress("jwalletaddr")).endCell()),
          cellToB64GetCall(beginCell().storeInt(1, 8).storeBuffer(Buffer.from(STUB_URI, "ascii")).endCell()),
        ];
      } else if (name === "get_wallet_address") {
        retVal.stack = [cellToB64GetCall(beginCell().storeAddress(randomAddress("jwalletaddr")).endCell())];
      } else if (name === "get_wallet_data") {
        retVal.stack = [stubNumVal(new BN(0))];
      }

      return retVal;
    });

    sinon.default.stub(axios, "get").withArgs(STUB_URI).resolves("STUB DATA");
    await expect(deployController.getJettonDetails(randomAddress("minteraddr"), randomAddress("jwalletowneraddr"))).to.be.fulfilled;
  });
});

