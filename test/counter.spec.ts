import { expect } from "chai";
import { SmartContract } from "ton-contract-executor";
import { createCode, createData } from "../contracts/main";
import { randomAddress } from "./utils";

describe("Counter tests", () => {
  let contract: SmartContract;

  beforeEach(async () => {
    contract = await SmartContract.fromCell(
      createCode(),
      createData({
        ownerAddress: randomAddress(0, "seed1"),
        counter: 17,
      })
    );
  });

  it("should run getter counter() and get counter value", async () => {
    const call = await contract.invokeGetMethod("counter", []);
    expect(call.result[0].toNumber()).to.equal(17);
  });

  it("should run getter meaning_of_life()", async () => {
    const call = await contract.invokeGetMethod("meaning_of_life", []);
    expect(call.result[0].toNumber()).to.equal(42);
  });
});
