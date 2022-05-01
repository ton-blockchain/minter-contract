import chai, { expect } from "chai";
import chaiBN from "chai-bn";
import BN from "bn.js";
chai.use(chaiBN(BN));

import * as fs from "fs";
import { Cell, toNano } from "ton";
import { SmartContract } from "ton-contract-executor";
import * as main from "../contracts/main";
import { internalMessage, randomAddress, setBalance } from "./helpers";

describe("Deposit and withdraw tests", () => {
  let contract: SmartContract;

  beforeEach(async () => {
    contract = await SmartContract.fromCell(
      Cell.fromBoc(fs.readFileSync("build/main.cell"))[0], // code cell from build output
      main.data({
        ownerAddress: randomAddress("owner"),
        counter: 17,
      })
    );
  });

  it("should get balance", async () => {
    setBalance(contract, toNano(37));
    const call = await contract.invokeGetMethod("balance", []);
    expect(call.result[0]).to.be.bignumber.equal(toNano(37));
  });

  it("should allow the owner to withdraw when balance is high", async () => {
    setBalance(contract, toNano(37));
    const send = await contract.sendInternalMessage(
      internalMessage({
        from: randomAddress("owner"),
        body: main.withdraw({ withdrawAmount: toNano(20) }),
      })
    );
    expect(send.type).to.equal("success");
    expect(send.actionList).to.have.lengthOf(1);
    const resultMessage = (send.actionList[0] as any)?.message?.info;
    expect(resultMessage?.dest?.equals(randomAddress("owner"))).to.equal(true);
    expect(resultMessage?.value?.coins).to.be.bignumber.equal(toNano(20));
  });

  it("should prevent others from withdrawing when balance is high", async () => {
    setBalance(contract, toNano(37));
    const send = await contract.sendInternalMessage(
      internalMessage({
        from: randomAddress("notowner"),
        body: main.withdraw({ withdrawAmount: toNano(20) }),
      })
    );
    expect(send.type).to.equal("failed");
    expect(send.exit_code).to.equal(102); // access_denied in contracts/imports/constants.fc
  });

  it("should prevent the owner to withdraw when balance is low", async () => {
    setBalance(contract, toNano(10));
    const send = await contract.sendInternalMessage(
      internalMessage({
        from: randomAddress("owner"),
        body: main.withdraw({ withdrawAmount: toNano(20) }),
      })
    );
    expect(send.type).to.equal("failed");
    expect(send.exit_code).to.equal(103); // insufficient_balance in contracts/imports/constants.fc
  });

  it("should leave enough balance for rent", async () => {
    setBalance(contract, toNano(20));
    const send = await contract.sendInternalMessage(
      internalMessage({
        from: randomAddress("owner"),
        body: main.withdraw({ withdrawAmount: toNano(20) }),
      })
    );
    expect(send.type).to.equal("success");
    expect(send.actionList).to.have.lengthOf(1);
    const resultMessage = (send.actionList[0] as any)?.message?.info;
    expect(resultMessage?.dest?.equals(randomAddress("owner"))).to.equal(true);
    expect(resultMessage?.value?.coins).to.be.bignumber.equal(toNano(20).sub(toNano(0.01))); // min_tons_for_storage in contracts/imports/constants.fc
  });
});
