import chai, { expect } from "chai";
import chaiBN from "chai-bn";
import BN from "bn.js";
chai.use(chaiBN(BN));

import { Address, beginCell, toNano } from "ton";
import { internalMessage, randomAddress } from "./helpers";
import { parseJettonDetails, parseJettonWalletDetails } from "./lib/jetton-utils";
import { JettonMinter } from "./lib/jetton-minter";
import { actionToMessage } from "./lib/utils";
import { JettonWallet } from "./lib/jetton-wallet";
import {
  JETTON_WALLET_CODE,
  JETTON_MINTER_CODE,
  jettonMinterInitData,
} from "../build/jetton-minter.deploy";

const OWNER_ADDRESS = randomAddress("owner");
const PARTICIPANT_ADDRESS_1 = randomAddress("participant_1");
const PARTICIPANT_ADDRESS_2 = randomAddress("participant_2");

describe("Jetton", () => {
  let minterContract: JettonMinter;

  const getJWalletContract = async (
    walletOwnerAddress: Address,
    jettonMasterAddress: Address
  ): Promise<JettonWallet> =>
    await JettonWallet.create(
      JETTON_WALLET_CODE,
      beginCell()
        .storeCoins(0)
        .storeAddress(walletOwnerAddress)
        .storeAddress(jettonMasterAddress)
        .storeRef(JETTON_WALLET_CODE)
        .endCell()
    );

  beforeEach(async () => {
    const dataCell = jettonMinterInitData(OWNER_ADDRESS, {
      name: "MY_JETTON",
      symbol: "MJT",
      description: "My Long Description".repeat(100)
    });
    minterContract = (await JettonMinter.create(JETTON_MINTER_CODE, dataCell)) as JettonMinter; // TODO: 🤮;
  });

  it("should get minter initialization data correctly", async () => {
    const call = await minterContract.contract.invokeGetMethod("get_jetton_data", []);
    const { totalSupply, address, metadata } = parseJettonDetails(call);

    expect(totalSupply).to.be.bignumber.equal(new BN(0));
    expect(address.toFriendly()).to.equal(OWNER_ADDRESS.toFriendly());
    expect(metadata.name).to.equal("MY_JETTON");
    expect(metadata.symbol).to.equal("MJT");
    expect(metadata.description).to.equal("My Long Description".repeat(100));
  });

  it("offchain and onchain jwallet should return the same address", async () => {
    const jwallet = await getJWalletContract(PARTICIPANT_ADDRESS_1, minterContract.address);
    const participantJwalletAddress = await minterContract.getWalletAddress(PARTICIPANT_ADDRESS_1);
    expect(jwallet.address.toFriendly()).to.equal(participantJwalletAddress.toFriendly());
  });

  it("should get jwallet initialization data correctly", async () => {
    const jwallet = await getJWalletContract(PARTICIPANT_ADDRESS_1, minterContract.address);
    const jwalletDetails = parseJettonWalletDetails(
      await jwallet.contract.invokeGetMethod("get_wallet_data", [])
    );

    expect(jwalletDetails.balance).to.bignumber.equal(new BN(0));
    expect(jwalletDetails.owner.toFriendly()).to.equal(PARTICIPANT_ADDRESS_1.toFriendly());
    expect(jwalletDetails.jettonMasterContract.toFriendly()).to.equal(
      minterContract.address.toFriendly()
    );
  });

  it("should mint jettons and transfer to 2 new wallets", async () => {
    // Produce mint message
    const { actionList: actionList1 } = await minterContract.contract.sendInternalMessage(
      internalMessage({
        from: OWNER_ADDRESS,
        body: JettonMinter.mintBody(PARTICIPANT_ADDRESS_1, toNano(0.01)),
      })
    );

    const jwallet1 = await getJWalletContract(PARTICIPANT_ADDRESS_1, minterContract.address);

    const { balance: balanceInitial } = parseJettonWalletDetails(
      await jwallet1.contract.invokeGetMethod("get_wallet_data", [])
    );
    expect(balanceInitial).to.bignumber.equal(new BN(0), "jwallet1 initial balance should be 0");

    // Send mint message to jwallet1
    await jwallet1.contract.sendInternalMessage(
      actionToMessage(minterContract.address, actionList1[0])
    );

    const { balance: balanceAfter } = parseJettonWalletDetails(
      await jwallet1.contract.invokeGetMethod("get_wallet_data", [])
    );
    expect(balanceAfter).to.bignumber.equal(
      toNano(0.01),
      "jwallet1 should reflact its balance after mint"
    );

    let { totalSupply } = parseJettonDetails(
      await minterContract.contract.invokeGetMethod("get_jetton_data", [])
    );
    expect(totalSupply).to.bignumber.equal(
      toNano(0.01),
      "total supply should increase after first mint"
    );

    // Mint and transfer to jwallet2
    const { actionList: actionList2 } = await minterContract.contract.sendInternalMessage(
      internalMessage({
        from: OWNER_ADDRESS,
        body: JettonMinter.mintBody(PARTICIPANT_ADDRESS_2, toNano(0.02)),
      })
    );

    const jwallet2 = await getJWalletContract(PARTICIPANT_ADDRESS_2, minterContract.address);
    await jwallet2.contract.sendInternalMessage(
      actionToMessage(minterContract.address, actionList2[0])
    );

    const { balance: balanceAfter2 } = parseJettonWalletDetails(
      await jwallet2.contract.invokeGetMethod("get_wallet_data", [])
    );
    expect(balanceAfter2).to.bignumber.equal(
      toNano(0.02),
      "jwallet2 should reflact its balance after mint"
    );

    totalSupply = parseJettonDetails(
      await minterContract.contract.invokeGetMethod("get_jetton_data", [])
    ).totalSupply;
    expect(totalSupply).to.bignumber.equal(
      toNano(0.03),
      "total supply should amount to both mints"
    );
  });

  it("should mint jettons and transfer from wallet1 to wallet2", async () => {
    // Produce mint message
    const { actionList: actionList1 } = await minterContract.contract.sendInternalMessage(
      internalMessage({
        from: OWNER_ADDRESS,
        body: JettonMinter.mintBody(PARTICIPANT_ADDRESS_1, toNano(0.01)),
      })
    );

    const jwallet1 = await getJWalletContract(PARTICIPANT_ADDRESS_1, minterContract.address);

    // Send mint message to jwallet1
    await jwallet1.contract.sendInternalMessage(
      actionToMessage(minterContract.address, actionList1[0])
    );

    // Transfer jwallet1-->jwallet2
    const res = await jwallet1.contract.sendInternalMessage(
      internalMessage({
        from: PARTICIPANT_ADDRESS_1, // TODO what is this from..? Prolly should be jwallet p1 address. is this a testutil that signs the msg?
        body: JettonWallet.transferBody(PARTICIPANT_ADDRESS_2, toNano(0.004)),
        value: toNano(0.031),
      })
    );

    const jwallet2 = await getJWalletContract(PARTICIPANT_ADDRESS_2, minterContract.address);
    await jwallet2.contract.sendInternalMessage(
      actionToMessage(jwallet1.address, res.actionList[0])
    );

    const { balance: balanceAfter2 } = parseJettonWalletDetails(
      await jwallet2.contract.invokeGetMethod("get_wallet_data", [])
    );
    expect(balanceAfter2).to.bignumber.equal(
      toNano(0.004),
      "jwallet2 balance should reflect amount sent from jwallet1"
    );

    const { balance: balanceAfter1 } = parseJettonWalletDetails(
      await jwallet1.contract.invokeGetMethod("get_wallet_data", [])
    );
    expect(balanceAfter1).to.bignumber.equal(
      toNano(0.01).sub(toNano(0.004)),
      "jwallet1 balance should subtract amount sent to jwallet2"
    );

    const totalSupply = parseJettonDetails(
      await minterContract.contract.invokeGetMethod("get_jetton_data", [])
    ).totalSupply;
    expect(totalSupply).to.bignumber.equal(toNano(0.01), "total supply should not change");
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
