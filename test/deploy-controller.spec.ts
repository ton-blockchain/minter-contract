import { ContractDeployer } from "../lib/contract-deployer";
import { Address, Cell, toNano, TonClient, beginCell } from "ton";
import { randomAddress } from "./helpers";
import chai, { expect } from "chai";
import * as sinon from "ts-sinon";
import sinonChai from "sinon-chai";
import {
  JettonDeployController,
  JettonDeployParams,
  JETTON_DEPLOY_GAS,
} from "../lib/deploy-controller";
import BN from "bn.js";
import chaiAsPromised from "chai-as-promised";
import { buildOnChainData } from "../contracts/jetton-minter";
import { TonConnection } from "@ton-defi.org/ton-connection";

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
  let tonConnectionStub: sinon.StubbedInstance<TonConnection>;
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
    tonConnectionStub = sinon.stubInterface<TonConnection>();
    tonClient = sinon.stubConstructor(TonClient, { endpoint: "" });
    tonConnectionStub._tonClient = tonClient;

    contractDeployer = sinon.stubConstructor(ContractDeployer);
    contractDeployer.addressForContract.returns(randomAddress("minterAddr"));
    contractDeployer.deployContract.resolves(randomAddress("minterAddr"));
    deployController = new JettonDeployController();
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

    const contractAddr = await deployController.createJetton(deployPayload, tonConnectionStub);

    expect(contractAddr.toFriendly()).to.equal("EQCbLe2dnSjeIxzDR50wHDs1NUFKRwawaldpoEfk29dulMQ5");
    expect(tonConnectionStub.requestTransaction).to.have.been.calledOnce;
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
        tonConnectionStub
      )
    ).to.be.rejected;
    expect(tonConnectionStub.requestTransaction).to.have.been.calledOnce;
  });

  it("Fails if balance is less than minimum", async () => {
    tonClient.isContractDeployed.resolves(true);
    tonClient.getBalance.resolves(JETTON_DEPLOY_GAS.sub(new BN(1)));

    await expect(
      deployController.createJetton(deployPayload, tonConnectionStub)
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

    await expect(deployController.createJetton(deployPayload, tonConnectionStub)).to.be.fulfilled;
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
      randomAddress("jwalletowneraddr"),
      tonConnectionStub
    );

    expect(x.jetton.name).to.equal("SOME_NAME");

    await expect(
      deployController.getJettonDetails(
        randomAddress("minteraddr"),
        randomAddress("jwalletowneraddr"),
        tonConnectionStub
      )
    ).to.be.fulfilled;
  });
});
