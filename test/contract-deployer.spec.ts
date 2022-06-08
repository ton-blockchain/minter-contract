import { ContractDeployer } from "../lib/contract-deployer";
import { Cell, toNano } from "ton";
import { randomAddress } from "./helpers";
import chai, { expect } from "chai";
import * as sinon from "ts-sinon";
import sinonChai from "sinon-chai";
import { Adapters } from "../lib/wallets/types";
import { WalletService } from "../lib/wallets/WalletService";

chai.use(sinonChai);

describe("Contract Deployer", () => {
  it("invokes the transaction sender", async () => {
    const walletServiceStub = sinon.stubInterface<WalletService>();
    const contractAddr = await new ContractDeployer().deployContract(
      {
        deployer: randomAddress("owner"),
        value: toNano(0.25),
        code: new Cell(),
        data: new Cell(),
      },
      Adapters.TON_HUB,
      "NULL",
      walletServiceStub
    );
    expect(walletServiceStub.requestTransaction).to.have.been.calledOnce;
    expect(contractAddr.toFriendly()).to.equal("EQCtMet2LmiPwbohV11DWbD5xIc4r2U-FmojMwC9xrKa6fCK");
  });
});
