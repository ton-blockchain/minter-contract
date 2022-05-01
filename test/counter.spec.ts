import chai, { expect } from "chai";
import chaiBN from "chai-bn";
import BN from "bn.js";
chai.use(chaiBN(BN));

import * as fs from "fs";
import { Cell } from "ton";
import { SmartContract } from "ton-contract-executor";
import * as main from "../contracts/main";
import { internalMessage, randomAddress } from "./helpers";

describe("Counter tests", () => {
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

  it("should get the meaning of life", async () => {
    const call = await contract.invokeGetMethod("meaning_of_life", []);
    expect(call.result[0]).to.be.bignumber.equal(new BN(42));
  });

  it("should get counter value and increment it", async () => {
    const call = await contract.invokeGetMethod("counter", []);
    expect(call.result[0]).to.be.bignumber.equal(new BN(17));

    const send = await contract.sendInternalMessage(
      internalMessage({
        from: randomAddress("notowner"),
        body: main.increment(),
      })
    );
    expect(send.type).to.equal("success");

    const call2 = await contract.invokeGetMethod("counter", []);
    expect(call2.result[0]).to.be.bignumber.equal(new BN(18));
  });
});
