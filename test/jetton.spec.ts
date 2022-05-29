import chai, { expect } from "chai";
import chaiBN from "chai-bn";
import BN from "bn.js";
chai.use(chaiBN(BN));

import * as fs from "fs";
import { Address, beginCell, Cell, InternalMessage, Slice, toNano, contractAddress, CommonMessageInfo, CellMessage } from "ton";
import { OutAction, SmartContract } from "ton-contract-executor";
import * as jetton_minter from "../contracts/jetton-minter";
import * as jetton_wallet from "../contracts/jetton-wallet";
import { internalMessage, randomAddress } from "./helpers";
import { getWalletAddress, parseJettonDetails, parseJettonWalletDetails } from "../jetton-utils";
import { WrappedSmartContract } from "./lib/contract-deployer";
import { JettonMinter } from "./lib/jetton-minter";
import { actionToMessage } from "./lib/utils";
import { JettonWallet } from "./lib/jetton-wallet";


const OWNER_ADDRESS = randomAddress("owner");
const PARTICIPANT_ADDRESS_1 = randomAddress("participant_1");
const PARTICIPANT_ADDRESS_2 = randomAddress("participant_2");

export const JETTON_WALLET_CODE = Cell.fromBoc(fs.readFileSync("build/jetton-wallet.cell"))[0];

describe("Jetton", () => {
  let minterContract: JettonMinter;

  const getJWalletContract = async (walletOwnerAddress: Address, jettonMasterAddress: Address): Promise<JettonWallet> => await JettonWallet.create(
    JETTON_WALLET_CODE, // code cell from build output
    jetton_wallet.data({
      walletOwnerAddress,
      jettonMasterAddress,
      jettonWalletCode: JETTON_WALLET_CODE
    })
  );

  beforeEach(async () => {
    const codeCell = Cell.fromBoc(fs.readFileSync("build/jetton-minter.cell"))[0]; // code cell from build output
    const dataCell = jetton_minter.data({
      adminAddress: OWNER_ADDRESS,
      totalSupply: new BN(0),
      offchainUri: 'https://api.jsonbin.io/b/628ced3405f31f68b3a53622',
      jettonWalletCode: JETTON_WALLET_CODE
    });

    minterContract = await JettonMinter.create(codeCell, dataCell) as JettonMinter // TODO: 🤮;
  });

  it("should get minter initialization data correctly", async () => {
    const call = await minterContract.contract.invokeGetMethod("get_jetton_data", []);
    const { totalSupply, address, contentUri } = parseJettonDetails(call);

    expect(totalSupply).to.be.bignumber.equal(new BN(0));
    expect(address.toFriendly()).to.equal(OWNER_ADDRESS.toFriendly());
    expect(contentUri).to.equal('https://api.jsonbin.io/b/628ced3405f31f68b3a53622');
  });

  it("offchain and onchain jwallet should return the same address", async () => {
    const jwallet = await getJWalletContract(PARTICIPANT_ADDRESS_1, minterContract.address);
    const participantJwalletAddress = await minterContract.getWalletAddress(PARTICIPANT_ADDRESS_1);
    expect(jwallet.address.toFriendly()).to.equal(participantJwalletAddress.toFriendly());

  });

  it("should get jwallet initialization data correctly", async () => {
    const jwallet = await getJWalletContract(PARTICIPANT_ADDRESS_1, minterContract.address);
    const jwalletDetails = parseJettonWalletDetails((await jwallet.contract.invokeGetMethod("get_wallet_data", [])));

    expect(jwalletDetails.balance).to.bignumber.equal(new BN(0));
    expect(jwalletDetails.owner.toFriendly()).to.equal(PARTICIPANT_ADDRESS_1.toFriendly());
    expect(jwalletDetails.jettonMasterContract.toFriendly()).to.equal(minterContract.address.toFriendly());
  });

  it("should mint jettons and transfer to 2 new wallets", async () => {
    // Produce mint message
    const {actionList: actionList1} = await minterContract.contract.sendInternalMessage(
      internalMessage({
        from: OWNER_ADDRESS,
        body: JettonMinter.mintBody(PARTICIPANT_ADDRESS_1, toNano(0.01))
      })
    );

    const jwallet1 = await getJWalletContract(PARTICIPANT_ADDRESS_1, minterContract.address);

    const {balance: balanceInitial} = parseJettonWalletDetails((await jwallet1.contract.invokeGetMethod("get_wallet_data", [])));
    expect(balanceInitial).to.bignumber.equal(new BN(0));

    // Send mint message to jwallet1
    await jwallet1.contract.sendInternalMessage(actionToMessage(minterContract.address, actionList1[0]));

    const {balance: balanceAfter} = parseJettonWalletDetails((await jwallet1.contract.invokeGetMethod("get_wallet_data", [])));
    expect(balanceAfter).to.bignumber.equal(toNano(0.01));
    
    let {totalSupply} = parseJettonDetails((await minterContract.contract.invokeGetMethod("get_jetton_data", [])))
    expect(totalSupply).to.bignumber.equal(toNano(0.01));

    // Mint and transfer to jwallet2
    const {actionList: actionList2} = await minterContract.contract.sendInternalMessage(
      internalMessage({
        from: OWNER_ADDRESS,
        body: JettonMinter.mintBody(PARTICIPANT_ADDRESS_2, toNano(0.02))
      })
    );

    const jwallet2 = await getJWalletContract(PARTICIPANT_ADDRESS_2, minterContract.address);
    await jwallet2.contract.sendInternalMessage(actionToMessage(minterContract.address, actionList2[0]));

    const {balance: balanceAfter2} = parseJettonWalletDetails((await jwallet2.contract.invokeGetMethod("get_wallet_data", [])));
    expect(balanceAfter2).to.bignumber.equal(toNano(0.02));
    
    totalSupply = parseJettonDetails((await minterContract.contract.invokeGetMethod("get_jetton_data", []))).totalSupply;
    expect(totalSupply).to.bignumber.equal(toNano(0.03));
  });
  
  it("should mint jettons and transfer from wallet1 to wallet2", async () => {
    // Produce mint message
    const {actionList: actionList1} = await minterContract.contract.sendInternalMessage(
      internalMessage({
        from: OWNER_ADDRESS,
        body: JettonMinter.mintBody(PARTICIPANT_ADDRESS_1, toNano(0.01))
      })
    );

    const jwallet1 = await getJWalletContract(PARTICIPANT_ADDRESS_1, minterContract.address);

    // Send mint message to jwallet1
    await jwallet1.contract.sendInternalMessage(actionToMessage(minterContract.address, actionList1[0]));

    // Mint and transfer to jwallet2
    const {actionList: actionList2} = await minterContract.contract.sendInternalMessage(
      internalMessage({
        from: PARTICIPANT_ADDRESS_1, // TODO what is this from..? Prolly should be jwallet p1 address
        body: JettonWallet.transferBody(PARTICIPANT_ADDRESS_2, toNano(0.04))
      })
    );

    const jwallet2 = await getJWalletContract(PARTICIPANT_ADDRESS_2, minterContract.address);
    await jwallet2.contract.sendInternalMessage(actionToMessage(jwallet1.address, actionList2[0]));

    const {balance: balanceAfter2} = parseJettonWalletDetails((await jwallet2.contract.invokeGetMethod("get_wallet_data", [])));
    expect(balanceAfter2).to.bignumber.equal(toNano(0.02));
    
    const totalSupply = parseJettonDetails((await minterContract.contract.invokeGetMethod("get_jetton_data", []))).totalSupply;
    expect(totalSupply).to.bignumber.equal(toNano(0.01));
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
