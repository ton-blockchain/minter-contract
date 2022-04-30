import chai, { expect } from "chai";
import chaiBN from "chai-bn";
import BN from "bn.js";
chai.use(chaiBN(BN));

import { SmartContract } from "ton-contract-executor";
import { createCode, createData, op_increment } from "../contracts/main";
import { internalMessage, randomAddress } from "./utils";

describe("Counter tests", () => {
  let contract: SmartContract;

  beforeEach(async () => {
    contract = await SmartContract.fromCell(
      createCode(),
      createData({
        ownerAddress: randomAddress(0, "owner"),
        counter: 17,
      })
    );
  });

  it("should get the meaning of life", async () => {
    const call = await contract.invokeGetMethod("meaning_of_life", []);
    expect(call.result[0]).to.be.bignumber.equal(new BN(42));
  });

  it("should get counter value and increment it", async () => {
    const call = await contract.invokeGetMethod("counter", []);
    expect(call.result[0]).to.be.bignumber.equal(new BN(17));

    const send = await contract.sendInternalMessage(
      internalMessage({
        from: randomAddress(0, "notowner"),
        body: op_increment(),
      })
    );
    expect(send.type).to.equal("success");

    const call2 = await contract.invokeGetMethod("counter", []);
    expect(call2.result[0]).to.be.bignumber.equal(new BN(18));
  });
});
