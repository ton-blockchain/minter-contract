import chai, { expect } from "chai";
import chaiBN from "chai-bn";
import BN from "bn.js";
chai.use(chaiBN(BN));

import * as fs from "fs";
import { Cell, Slice } from "ton";
import { SmartContract } from "ton-contract-executor";
import * as main from "../contracts/main";
import { internalMessage, randomAddress } from "./helpers";

describe("Transfer ownership tests", () => {
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

  it("should allow the owner to change owners", async () => {
    const send = await contract.sendInternalMessage(
      internalMessage({
        from: randomAddress("owner"),
        body: main.transferOwnership({ newOwnerAddress: randomAddress("newowner") }),
      })
    );
    expect(send.type).to.equal("success");

    const call = await contract.invokeGetMethod("owner_address", []);
    const address = (call.result[0] as Slice).readAddress();
    expect(address?.equals(randomAddress("newowner"))).to.equal(true);
  });

  it("should prevent others from changing owners", async () => {
    const send = await contract.sendInternalMessage(
      internalMessage({
        from: randomAddress("notowner"),
        body: main.transferOwnership({ newOwnerAddress: randomAddress("newowner") }),
      })
    );
    expect(send.type).to.equal("failed");
    expect(send.exit_code).to.equal(102); // access_denied in contracts/imports/constants.fc

    const call = await contract.invokeGetMethod("owner_address", []);
    const address = (call.result[0] as Slice).readAddress();
    expect(address?.equals(randomAddress("owner"))).to.equal(true);
  });
});
