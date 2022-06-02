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

const stubNumVal = (num: BN) => ["num", num.toString()];
const cellToB64GetCall = (cell: Cell) => ["cell", { bytes: cell.toBoc().toString("base64") }];

// TODO move
export const addressToCell = (address: Address) => beginCell().storeAddress(address).endCell();

function getMethodRetValToStack(args) {
  return args.map((a) => {
    if (a instanceof BN) {
      return stubNumVal(a);
    } else if (a instanceof Cell) {
      return cellToB64GetCall(a);
    } else {
        throw "Unknown type";
    }
  });
}

describe("Deploy Controller", () => {
  let transactionSenderStub: sinon.StubbedInstance<TransactionSender>;
  let fileUploaderStub: sinon.StubbedInstance<FileUploader>;
  let tonClient: sinon.StubbedInstance<TonClient>;
  let contractDeployer: sinon.StubbedInstance<ContractDeployer>;
  let deployController: JettonDeployController;

  const retVal = { gas_used: 0, stack: [] };

  function stubTonClientGet(tonClient, spec) {
    tonClient.callGetMethod.callsFake(async (address: Address, name: string, params?: any[]) => {
      retVal.stack = getMethodRetValToStack(spec[name]);
      return retVal;
    });
  }

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
    contractDeployer.addressForContract.returns(randomAddress("minterAddr"));
    contractDeployer.deployContract.resolves(randomAddress("minterAddr"));
    deployController = new JettonDeployController(tonClient);
  });

  it("Deploys a jetton wallet", async () => {
    tonClient.isContractDeployed.onFirstCall().resolves(false).onSecondCall().resolves(true).onThirdCall().resolves(true);
    tonClient.getBalance.resolves(toNano(1));
    stubTonClientGet(tonClient, {
      get_jetton_data: [new BN(0), new BN(0), addressToCell(randomAddress("owner"))],
      get_wallet_address: [addressToCell(randomAddress("jwalletaddr"))],
      get_wallet_data: [new BN(0)],
    });

    // await deployController.createJetton(deployPayload, contractDeployer, transactionSenderStub, fileUploaderStub);
    await expect(deployController.createJetton(deployPayload, contractDeployer, transactionSenderStub, fileUploaderStub)).to.be.fulfilled;
    expect(fileUploaderStub.upload).to.have.been.calledTwice;
    expect(contractDeployer.deployContract).to.have.been.calledOnce;
  });

  it("Fails if amount was not minted to owner as provided", async () => {
    tonClient.isContractDeployed.onFirstCall().resolves(false).onSecondCall().resolves(true).onThirdCall().resolves(true);
    tonClient.getBalance.resolves(toNano(1));
    stubTonClientGet(tonClient, {
      get_jetton_data: [new BN(0), new BN(0), addressToCell(randomAddress("owner"))],
      get_wallet_address: [addressToCell(randomAddress("jwalletaddr"))],
      get_wallet_data: [new BN(0)],
    });

    await expect(deployController.createJetton({ ...deployPayload, amountToMint: toNano(1) }, contractDeployer, transactionSenderStub, fileUploaderStub)).to.be.rejected;
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
    stubTonClientGet(tonClient, {
      get_jetton_data: [new BN(0), new BN(0), addressToCell(randomAddress("owner"))],
      get_wallet_address: [addressToCell(randomAddress("jwalletaddr"))],
      get_wallet_data: [new BN(0)],
    });

    await expect(deployController.createJetton(deployPayload, contractDeployer, transactionSenderStub, fileUploaderStub)).to.be.fulfilled;
    expect(fileUploaderStub.upload).to.have.been.calledTwice;
    expect(contractDeployer.deployContract).to.not.have.been.called;
  });

  it("Retrieves jwallet details", async () => {
    const STUB_URI = "STUB";

    stubTonClientGet(tonClient, {
      get_jetton_data: [new BN(0), new BN(0), addressToCell(randomAddress("owner")), beginCell().storeInt(1, 8).storeBuffer(Buffer.from(STUB_URI, "ascii")).endCell()],
      get_wallet_address: [addressToCell(randomAddress("jwalletaddr"))],
      get_wallet_data: [new BN(0)],
    });

    sinon.default.stub(axios, "get").withArgs(STUB_URI).resolves("STUB DATA");
    await expect(deployController.getJettonDetails(randomAddress("minteraddr"), randomAddress("jwalletowneraddr"))).to.be.fulfilled;
  });
});
