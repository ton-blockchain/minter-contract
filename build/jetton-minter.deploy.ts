import { sendInternalMessageWithWallet } from "../test/helpers";

import BN from "bn.js";
import { Cell, beginCell, Address, toNano, beginDict } from "ton";

import walletHex from "./jetton-wallet.compiled.json";
import minterHex from "./jetton-minter.compiled.json";
import { Sha256 } from "@aws-crypto/sha256-js";

const ONCHAIN_CONTENT_PREFIX = 0x00;
const SNAKE_PREFIX = 0x00;

export const JETTON_WALLET_CODE = Cell.fromBoc(walletHex.hex)[0];
export const JETTON_MINTER_CODE = Cell.fromBoc(minterHex.hex)[0]; // code cell from build output

export type JettonMetaDataKeys = "name" | "description" | "image" | "symbol";

const jettonOnChainMetadataSpec: {
  [key in JettonMetaDataKeys]: "utf8" | "ascii" | undefined;
} = {
  name: "utf8",
  description: "utf8",
  image: "ascii",
  symbol: "utf8",
};

const sha256 = (str: string) => {
  const sha = new Sha256();
  sha.update(str);
  return Buffer.from(sha.digestSync());
};

// TODO: support for vals over 1024 bytes (otherwise it'll fail here)
export function buildOnChainData(data: { [s: string]: string | undefined }): Cell {
  const KEYLEN = 256;
  const dict = beginDict(KEYLEN);

  Object.entries(data).forEach(([k, v]: [string, string | undefined]) => {
    if (!jettonOnChainMetadataSpec[k as JettonMetaDataKeys])
      throw new Error(`Unsupported onchain key: ${k}`);
    if (v === undefined) return;

    dict.storeCell(
      sha256(k),
      beginCell()
        .storeUint8(SNAKE_PREFIX)
        .storeBuffer(Buffer.from(v, jettonOnChainMetadataSpec[k as JettonMetaDataKeys])) // TODO imageUri is supposed to be saved ascii
        .endCell()
    );
  });

  return beginCell().storeInt(ONCHAIN_CONTENT_PREFIX, 8).storeDict(dict.endDict()).endCell();
}

export function parseOnChainData(contentCell: Cell): {
  [s in JettonMetaDataKeys]?: string;
} {
  // Note that this relies on what is (perhaps) an internal implementation detail:
  // "ton" library dict parser converts: key (provided as buffer) => BN(base10)
  // and upon parsing, it reads it back to a BN(base10)
  // tl;dr if we want to read the map back to a JSON with string keys, we have to convert BN(10) back to hex
  const toKey = (str: string) => new BN(str, "hex").toString(10);

  const KEYLEN = 256;
  const contentSlice = contentCell.beginParse();
  if (contentSlice.readUint(8).toNumber() !== ONCHAIN_CONTENT_PREFIX)
    throw new Error("Expected onchain content marker");

  const dict = contentSlice.readDict(KEYLEN, (s) => {
    const valSlice = s.toCell().beginParse();
    if (valSlice.readUint(8).toNumber() !== SNAKE_PREFIX)
      throw new Error("Only snake format is supported");
    return valSlice.readRemainingBytes();
  });

  const res: { [s in JettonMetaDataKeys]?: string } = {};

  Object.keys(jettonOnChainMetadataSpec).forEach((k) => {
    const val = dict
      .get(toKey(sha256(k).toString("hex")))
      ?.toString(jettonOnChainMetadataSpec[k as JettonMetaDataKeys]);
    if (val) res[k as JettonMetaDataKeys] = val;
  });

  return res;
}

// return the init Cell of the contract storage (according to load_data() contract method)
export function initData() {
  const owner = Address.parse("EQD4gS-Nj2Gjr2FYtg-s3fXUvjzKbzHGZ5_1Xe_V0-GCp0p2");
  return beginCell()
    .storeCoins(0)
    .storeAddress(owner)
    .storeRef(
      buildOnChainData({
        name: "MyJetton",
        symbol: "JET1"
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
  // const call = await walletContract.client.callGetMethod(contractAddress, "get_jetton_data");
  // console.log(
  //   parseOnChainData(Cell.fromBoc(Buffer.from(call.stack[3][1].bytes, "base64").toString("hex"))[0])
  // );
}
