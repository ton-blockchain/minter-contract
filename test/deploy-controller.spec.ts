import { ContractDeployer } from "../lib/contract-deployer";
import { Address, Cell, toNano, TonClient, beginCell } from "ton";
import { randomAddress } from "./helpers";
import { TransactionDetails, TransactionSender } from "../lib/transaction-sender";
import chai, { expect } from "chai";
import * as sinon from "ts-sinon";
import sinonChai from "sinon-chai";
import { JettonDeployController, JETTON_DEPLOY_GAS } from "../lib/deploy-controller";
import BN from "bn.js";
import { FileUploader } from "../lib/file-uploader";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe("Deploy Controller", () => {
  const transactionSenderStub = sinon.stubInterface<TransactionSender>();
  const fileUploaderStub = sinon.stubInterface<FileUploader>();
  const tonClient = sinon.stubConstructor(TonClient, { endpoint: "" });
  const contractDeployer = sinon.stubConstructor(ContractDeployer);
  const deployController = new JettonDeployController(tonClient);

  const retVal = { gas_used: 0, stack: [] };
  const stubNumVal = ["num", "0"];
  const cellWithAddrB64 = (addr: Address) => ["cell", { bytes: beginCell().storeAddress(addr).endCell().toBoc().toString("base64") }];

  const deployPayload = {
    amountToMint: toNano(0),
    jettonName: "",
    jettonSymbol: "",
    owner: randomAddress("owner"),
    mintToOwner: false,
    jettonIconImageData: Buffer.from(""),
  };

  before(() => {
    fileUploaderStub.upload.resolves("");
  });

  it("Deploys a jetton wallet", async () => {
    tonClient.isContractDeployed.resolves(true);
    tonClient.getBalance.resolves(toNano(1));

    tonClient.callGetMethod.callsFake(async (address: Address, name: string, params?: any[]) => {
      if (name === "get_jetton_data") {
        retVal.stack = [stubNumVal, stubNumVal, cellWithAddrB64(randomAddress("owner"))];
      } else if (name === "get_wallet_address") {
        retVal.stack = [cellWithAddrB64(randomAddress("jwalletaddr"))];
      } else if (name === "get_wallet_data") {
        retVal.stack = [stubNumVal];
      }

      return retVal;
    });

    const deployController = new JettonDeployController(tonClient);

    await deployController.createJetton(deployPayload, contractDeployer, transactionSenderStub, fileUploaderStub);
  });

  it("Fails if balance is less than minimum", async () => {
    tonClient.isContractDeployed.resolves(true);
    tonClient.getBalance.resolves(JETTON_DEPLOY_GAS.sub(new BN(1)));

    await expect(deployController.createJetton(deployPayload, contractDeployer, transactionSenderStub, fileUploaderStub)).to.be.rejectedWith(
      "Not enough balance in deployer wallet"
    );
  });
});
