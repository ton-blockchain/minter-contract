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
import { getWalletAddress, parseJettonDetails } from "../jetton-utils";
import { WrappedSmartContract } from "./lib/contract-deployer";
import { JettonMinter } from "./lib/jetton-minter";


const OWNER_ADDRESS = randomAddress("owner");
const PARTICIPANT_ADDRESS = randomAddress("participant");

export const JETTON_WALLET_CODE = Cell.fromBoc(fs.readFileSync("build/jetton-wallet.cell"))[0];

function actionToInternalMessage(to: Address, from: Address, messageBody: Cell, messageValue = new BN(1000000000), bounce = false) {
  // TODO CommonMessageInfo? CellMessage?
  let msg = new CommonMessageInfo({ body: new CellMessage(messageBody) });
  return new InternalMessage({
    to,
    from,
    value: messageValue,
    bounce,
    body: msg,
  });
}

describe("Jetton", () => {
  let minterContract: JettonMinter;

  // TODO should be same as getter on contract?
  const getJWalletContract = async (walletOwnerAddress: Address, jettonMasterAddress: Address): Promise<WrappedSmartContract> => await WrappedSmartContract.create(
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

  it("should get initialization data correctly", async () => {
    const call = await minterContract.contract.invokeGetMethod("get_jetton_data", []);
    const { totalSupply, address, contentUri } = parseJettonDetails(call);

    expect(totalSupply).to.be.bignumber.equal(new BN(0));
    expect(address.toFriendly()).to.equal(OWNER_ADDRESS.toFriendly());
    expect(contentUri).to.equal('https://api.jsonbin.io/b/628ced3405f31f68b3a53622');
  });

  it("should get a jetton wallet address", async () => {
    const jwalletAddress = await minterContract.getWalletAddress(OWNER_ADDRESS);

    // TODO(sy): the difference between the client and test object is interesting => const address = getWalletAddress(res.stack)
    // expect(jwalletAddress.toFriendly()).to.equal("EQACfZheb-dYZJ37WQeYUZTdRKc6YaIBVot7BCCgdQ8X49fN")
  });

  it("offchain and onchain jwallet should return the same address", async () => {
    const jwallet = await getJWalletContract(PARTICIPANT_ADDRESS, minterContract.address);
    const participantJwalletAddress = await minterContract.getWalletAddress(PARTICIPANT_ADDRESS);
    expect(jwallet.address.toFriendly()).to.equal(participantJwalletAddress.toFriendly());
  });

  it("should mint jettons and transfer to owner", async () => {
    // const TOKEN_TO_SWAP = 25;
    // const TOKEN_LIQUIDITY = toNano(0.01);

    const res = await minterContract.contract.sendInternalMessage(
      internalMessage({
        from: OWNER_ADDRESS,
        body: JettonMinter.mintBody(PARTICIPANT_ADDRESS)
      })
    );



    // console.log(res.actionList[0])

    const jwallet = await getJWalletContract(PARTICIPANT_ADDRESS, minterContract.address);

    function actionToMessage2(from: Address, action: OutAction | undefined, messageValue = new BN(1000000000), bounce = true) {
      //@ts-ignore
      const sendMessageAction = action as SendMsgOutAction;

      let msg = new CommonMessageInfo({ body: new CellMessage(sendMessageAction.message?.body) });
      return new InternalMessage({
        to: sendMessageAction.message?.info.dest,
        from,
        value: messageValue,
        bounce,
        body: msg,
      });
    }

    const msg = actionToMessage2(minterContract.address, res.actionList[0]);

    let res3 = await jwallet.contract.invokeGetMethod("get_wallet_data", []);

    console.log(res3.result[0]?.toString())

    const res2 = await jwallet.contract.sendInternalMessage(msg);

    // console.log(res2)

    res3 = await jwallet.contract.invokeGetMethod("get_wallet_data", []);

    console.log(res3.result[0]?.toString())

    const call = await minterContract.contract.invokeGetMethod("get_jetton_data", []);
    console.log(parseJettonDetails(call).totalSupply.toString())

    // console.log(jwallet.address.toFriendly())
    // const participantJwalletAddress = await minterContract.getWalletAddress(PARTICIPANT_ADDRESS);

    // const res2 = await jwallet.contract.invokeGetMethod(
    //   "get_wallet_data", []
    // )

    // console.log((res2.result[1] as Slice).readAddress()?.toFriendly());

    // expect(jwallet.address.toFriendly()).to.equal(participantJwalletAddress.toFriendly());

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
