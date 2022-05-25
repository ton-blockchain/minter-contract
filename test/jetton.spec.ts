import chai, { expect } from "chai";
import chaiBN from "chai-bn";
import BN from "bn.js";
chai.use(chaiBN(BN));

import * as fs from "fs";
import { Cell, Slice } from "ton";
import { SmartContract } from "ton-contract-executor";
import * as jetton_minter from "../contracts/jetton-minter";
import { internalMessage, randomAddress } from "./helpers";

describe("JETTON tests", () => {
  let contract: SmartContract;

  beforeEach(async () => {
    contract = await SmartContract.fromCell(
      Cell.fromBoc(fs.readFileSync("build/jetton-minter.cell"))[0], // code cell from build output
      jetton_minter.data({
        adminAddress: randomAddress("owner"),
        totalSupply: new BN("13"),
        offchainUri: 'https://api.jsonbin.io/b/628ced3405f31f68b3a53622'
      })
    );
  });

  it("should get the meaning of life", async () => {
    const call = await contract.invokeGetMethod("get_jetton_data", []);
    const totalSupply = call.result[0];
    const address = (call.result[2] as Slice).readAddress()!;
    const theContent = (call.result[3] as Cell)

    let i=1

    const c = theContent.beginParse()
    const myArr = [];

    while (c.remaining) {
      myArr.push(c.readUintNumber(8))
    }

    const contentUri = new TextDecoder().decode(Buffer.from(myArr).slice(1,));

    expect(totalSupply).to.be.bignumber.equal(new BN(13));
    expect(address.toFriendly()).to.equal(randomAddress("owner").toFriendly());
    expect(contentUri).to.equal('https://api.jsonbin.io/b/628ced3405f31f68b3a53622');
  });


});
