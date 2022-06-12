import { ContractDeployer } from "../lib/contract-deployer";
import { Cell, toNano } from "ton";
import { randomAddress } from "./helpers";
import chai, { expect } from "chai";
import * as sinon from "ts-sinon";
import sinonChai from "sinon-chai";
import { TonConnection } from "@ton-defi.org/ton-connection";

chai.use(sinonChai);

describe("Contract Deployer", () => {
  it("invokes the transaction sender", async () => {
    const tonConnectionStub = sinon.stubInterface<TonConnection>();
    const contractAddr = await new ContractDeployer().deployContract(
      {
        deployer: randomAddress("owner"),
        value: toNano(0.25),
        code: new Cell(),
        data: new Cell(),
      },
      tonConnectionStub
    );
    expect(tonConnectionStub.requestTransaction).to.have.been.calledOnce;
    expect(contractAddr.toFriendly()).to.equal("EQCtMet2LmiPwbohV11DWbD5xIc4r2U-FmojMwC9xrKa6fCK");
  });
});
