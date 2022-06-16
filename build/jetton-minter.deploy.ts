
import { Cell, beginCell, Address, WalletContract } from "ton";

import walletHex from "./jetton-wallet.compiled.json";
import minterHex from "./jetton-minter.compiled.json";
import { buildOnChainData, parseOnChainData } from "../contracts/jetton-minter";

export const JETTON_WALLET_CODE = Cell.fromBoc(walletHex.hex)[0];
export const JETTON_MINTER_CODE = Cell.fromBoc(minterHex.hex)[0]; // code cell from build output

const jettonParams = {
  owner: Address.parse("EQD4gS-Nj2Gjr2FYtg-s3fXUvjzKbzHGZ5_1Xe_V0-GCp0p2"),
  name: "MyJetton",
  symbol: "JET1",
  image: undefined, // Image url
  description: "My jetton",
};

// return the init Cell of the contract storage (according to load_data() contract method)
export function initData() {
  return beginCell()
    .storeCoins(0)
    .storeAddress(jettonParams.owner)
    .storeRef(
      buildOnChainData({
        name: jettonParams.name,
        symbol: jettonParams.symbol,
        image: jettonParams.image,
        description: jettonParams.description
      })
    )
    .storeRef(JETTON_WALLET_CODE)
    .endCell();
}

// return the op that should be sent to the contract on deployment, can be "null" to send an empty message
export function initMessage() {
  return null; // TODO?
}

// optional end-to-end sanity test for the actual on-chain contract to see it is actually working on-chain
export async function postDeployTest(
  walletContract: WalletContract,
  secretKey: Buffer,
  contractAddress: Address
) {
  const call = await walletContract.client.callGetMethod(contractAddress, "get_jetton_data");

  console.log(
    parseOnChainData(Cell.fromBoc(Buffer.from(call.stack[3][1].bytes, "base64").toString("hex"))[0])
  );
}
