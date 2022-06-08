import { ContractDeployer } from "../lib/contract-deployer";
import { Address, Cell, toNano, TonClient, beginCell } from "ton";
import { randomAddress } from "./helpers";
import { TransactionSender } from "../lib/transaction-sender";
import chai, { expect } from "chai";
import * as sinon from "ts-sinon";
import sinonChai from "sinon-chai";
import { JettonDeployController, JettonDeployParams, JETTON_DEPLOY_GAS } from "../lib/deploy-controller";
import BN from "bn.js";
import chaiAsPromised from "chai-as-promised";
import { buildOnChainData } from "../contracts/jetton-minter";
import { WalletService } from "../lib/wallets";
import { Adapters } from "../lib/wallets/types";

chai.use(chaiAsPromised);
chai.use(sinonChai);

const stubNumVal = (num: BN) => ["num", num.toString()];
const cellToB64GetCall = (cell: Cell) => ["cell", { bytes: cell.toBoc().toString("base64") }];
const addressToCell = (address: Address) => beginCell().storeAddress(address).endCell();

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
  let walletServiceStub: sinon.StubbedInstance<WalletService>;
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

  const deployPayload: JettonDeployParams = {
    amountToMint: toNano(0),
    jettonName: "",
    jettonSymbol: "",
    owner: randomAddress("owner"),
    imageUri: "",
    onProgress: () => {
      /* do nothing */
    },
  };

  beforeEach(() => {
    walletServiceStub = sinon.stubInterface<WalletService>();
    tonClient = sinon.stubConstructor(TonClient, { endpoint: "" });
    contractDeployer = sinon.stubConstructor(ContractDeployer);
    contractDeployer.addressForContract.returns(randomAddress("minterAddr"));
    contractDeployer.deployContract.resolves(randomAddress("minterAddr"));
    deployController = new JettonDeployController(tonClient);
  });

  it("Deploys a jetton wallet", async () => {
    tonClient.isContractDeployed
      .onFirstCall()
      .resolves(false)
      .onSecondCall()
      .resolves(true)
      .onThirdCall()
      .resolves(true);

    tonClient.getBalance.resolves(toNano(1));

    stubTonClientGet(tonClient, {
      get_jetton_data: [new BN(0), new BN(0), addressToCell(randomAddress("owner"))],
      get_wallet_address: [addressToCell(randomAddress("jwalletaddr"))],
      get_wallet_data: [new BN(0)],
    });

    const contractAddr = await deployController.createJetton(
      deployPayload,
      contractDeployer,
      Adapters.TON_HUB,
      "",
      walletServiceStub
    );

    expect(contractAddr.toFriendly()).to.equal("EQCFjhVMFTPLZFfd6iPNh7-eZ_kZH_CPnsHua1J6dI_nSYmC");
    expect(contractDeployer.deployContract).to.have.been.calledOnce;
  });

  it("Fails if amount was not minted to owner as provided", async () => {
    tonClient.isContractDeployed
      .onFirstCall()
      .resolves(false)
      .onSecondCall()
      .resolves(true)
      .onThirdCall()
      .resolves(true);
    tonClient.getBalance.resolves(toNano(1));
    stubTonClientGet(tonClient, {
      get_jetton_data: [new BN(0), new BN(0), addressToCell(randomAddress("owner"))],
      get_wallet_address: [addressToCell(randomAddress("jwalletaddr"))],
      get_wallet_data: [new BN(0)],
    });

    await expect(
      deployController.createJetton(
        { ...deployPayload, amountToMint: toNano(1) },
        contractDeployer,
        Adapters.TON_HUB,
        "",
        walletServiceStub
      )
    ).to.be.rejected;
    expect(contractDeployer.deployContract).to.have.been.calledOnce;
  });

  it("Fails if balance is less than minimum", async () => {
    tonClient.isContractDeployed.resolves(true);
    tonClient.getBalance.resolves(JETTON_DEPLOY_GAS.sub(new BN(1)));

    await expect(
      deployController.createJetton(
        deployPayload,
        contractDeployer,
        Adapters.TON_HUB,
        "",
        walletServiceStub
      )
    ).to.be.rejectedWith("Not enough balance in deployer wallet");
  });

  it("Skips deployment if contract is already deployed", async () => {
    tonClient.isContractDeployed.resolves(true);
    tonClient.getBalance.resolves(toNano(1));
    stubTonClientGet(tonClient, {
      get_jetton_data: [new BN(0), new BN(0), addressToCell(randomAddress("owner"))],
      get_wallet_address: [addressToCell(randomAddress("jwalletaddr"))],
      get_wallet_data: [new BN(0)],
    });

    await expect(
      deployController.createJetton(
        deployPayload,
        contractDeployer,
        Adapters.TON_HUB,
        "",
        walletServiceStub
      )
    ).to.be.fulfilled;
    expect(contractDeployer.deployContract).to.not.have.been.called;
  });

  it("Retrieves jwallet details", async () => {
    stubTonClientGet(tonClient, {
      get_jetton_data: [
        new BN(0),
        new BN(0),
        addressToCell(randomAddress("owner")),
        buildOnChainData({ name: "SOME_NAME" }),
      ],
      get_wallet_address: [addressToCell(randomAddress("jwalletaddr"))],
      get_wallet_data: [new BN(0)],
    });

    const x = await deployController.getJettonDetails(
      randomAddress("minteraddr"),
      randomAddress("jwalletowneraddr")
    );

    expect(x.jetton.name).to.equal("SOME_NAME");

    await expect(
      deployController.getJettonDetails(
        randomAddress("minteraddr"),
        randomAddress("jwalletowneraddr")
      )
    ).to.be.fulfilled;
  });
});
