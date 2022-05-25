import chai, { expect } from "chai";
import chaiBN from "chai-bn";
import BN from "bn.js";
chai.use(chaiBN(BN));

import * as fs from "fs";
import { beginCell, Cell, InternalMessage, Slice } from "ton";
import { SmartContract } from "ton-contract-executor";
import * as jetton_minter from "../contracts/jetton-minter";
import { internalMessage, randomAddress } from "./helpers";
import { getWalletAddress, parseJettonDetails } from "../jetton-utils";

const OWNER_ADDRESS = randomAddress("owner");
const PARTICIPANT_ADDRESS = randomAddress("participant");


describe("JETTON tests", () => {
  let contract: SmartContract;

  beforeEach(async () => {
    contract = await SmartContract.fromCell(
      Cell.fromBoc(fs.readFileSync("build/jetton-minter.cell"))[0], // code cell from build output
      jetton_minter.data({
        adminAddress: OWNER_ADDRESS,
        totalSupply: new BN("13"),
        offchainUri: 'https://api.jsonbin.io/b/628ced3405f31f68b3a53622'
      })
    );
  });

  it("should get initialization data correctly", async () => {
    const call = await contract.invokeGetMethod("get_jetton_data", []);
    const { totalSupply, address, contentUri } = parseJettonDetails(call);

    expect(totalSupply).to.be.bignumber.equal(new BN(13));
    expect(address.toFriendly()).to.equal(OWNER_ADDRESS.toFriendly());
    expect(contentUri).to.equal('https://api.jsonbin.io/b/628ced3405f31f68b3a53622');
  });

  it("should get a jetton wallet address", async () => {
    const cell = new Cell();
    cell.bits.writeAddress(OWNER_ADDRESS);
    const cellBoc = (cell.toBoc({ idx: false })).toString('base64');

    const res = await contract.invokeGetMethod(
      "get_wallet_address",
      [
        // TODO(sy) this is also a less desired API. ['tvm.Slice', cellBoc]
        {
          type: 'cell_slice',
          value: cellBoc
        }
      ]
    )

    const address = (res.result[0] as Slice).readAddress()!

    // TODO(sy): the difference between the client and test object is interesting => const address = getWalletAddress(res.stack)
    expect(address.toFriendly()).to.equal("EQB_5zY93Y002MVhYRnCwfRka280R7d9DcCUPbmcbxYeP4sT")
  });

  it("should mint jettons and transfer to owner", async () => {
    const cell = new Cell();
    cell.bits.writeAddress(OWNER_ADDRESS);
    const cellBoc = (cell.toBoc({ idx: false })).toString('base64');

    await contract.sendInternalMessage(
      internalMessage({
        from: OWNER_ADDRESS,
        body: beginCell()
          .storeUint(21, 32) // opcode (reference TODO)
          .storeUint(0, 64) // queryid
          .storeAddress(PARTICIPANT_ADDRESS)
          .storeCoins(1000) // TODO
          .endCell();
      })
    )

    const res = await contract.invokeGetMethod(
      "get_wallet_address",
      [
        // TODO(sy) this is also a less desired API. ['tvm.Slice', cellBoc]
        {
          type: 'cell_slice',
          value: cellBoc
        }
      ]
    )

    const address = (res.result[0] as Slice).readAddress()!

    // TODO(sy): the difference between the client and test object is interesting => const address = getWalletAddress(res.stack)
    expect(address.toFriendly()).to.equal("EQB_5zY93Y002MVhYRnCwfRka280R7d9DcCUPbmcbxYeP4sT")
  });


  /*
  Further tests:
  - burn
  - mint
  - transfer from wallet
  - change owner
  - change content / immutable vs nonimmutable
  */


});
