import BN from "bn.js";
import { Cell, beginCell, Address, toNano, beginDict, parseDict, parseDictRefs, BitString } from "ton";

const ONCHAIN_CONTENT_PREFIX = 0x00;
const SNAKE_PREFIX = 0x00;

import walletHex from "../build/jetton-wallet-hex.json";
import minterHex from "../build/jetton-minter-hex.json";

export const JETTON_WALLET_CODE = Cell.fromBoc(walletHex.hex)[0];
export const JETTON_MINTER_CODE = Cell.fromBoc(minterHex.hex)[0]; // code cell from build output

enum OPS {
  Mint = 21,
  InternalTransfer = 0x178d4519,
  Transfer = 0xf8a7ea5,
}
import {Sha256} from "@aws-crypto/sha256-js";

const jettonOnChainMetadataSpec: { [key: string]: "utf8" | "ascii" | undefined } = {
  name: "utf8",
  description: "utf8",
  image: "ascii",
  symbol: "utf8",
};

// TODO figure out crypto for web?
const sha256 = (str: string) => {
  const sha = new Sha256();
  sha.update(str);
  return Buffer.from(sha.digestSync());
};

// TODO: support for vals over 1024 bytes (otherwise it'll fail here)
function buildOnChainData(data: { [s: string]: string | undefined }): Cell {
  const KEYLEN = 256;
  const dict = beginDict(KEYLEN);

  Object.entries(data).forEach(([k, v]: [string, string | undefined]) => {
    if (!jettonOnChainMetadataSpec[k]) throw new Error(`Unsupported onchain key: ${k}`);
    if (v === undefined) return;

    dict.storeCell(
      sha256(k),
      beginCell()
        .storeUint8(SNAKE_PREFIX)
        .storeBuffer(Buffer.from(v, jettonOnChainMetadataSpec[k])) // TODO imageUri is supposed to be saved ascii
        .endCell()
    );
  });

  return dict.endDict() as Cell;
}

export function parseOnChainData(contentCell: Cell) {
  // Note that this relies on what is (perhaps) an internal implementation detail:
  // "ton" library dict parser converts: key (provided as buffer) => BN(base10)
  // and upon parsing, it reads it back to a BN(base10)
  // tl;dr if we want to read the map back to a JSON with string keys, we have to convert BN(10) back to hex
  const toKey = (str: string) => new BN(str, "hex").toString(10);

  const KEYLEN = 256;
  const contentSlice = contentCell.beginParse();
  if (contentSlice.readUint(8).toNumber() !== ONCHAIN_CONTENT_PREFIX) throw new Error("Expected onchain content marker");

  const dict = contentSlice.readDict(KEYLEN, (s) => {
    const valSlice = s.toCell().beginParse();
    if (valSlice.readUint(8).toNumber() !== SNAKE_PREFIX) throw new Error("Only snake format is supported");
    return valSlice.readRemainingBytes();
  });

  const res: { [s: string]: string } = {};

  Object.keys(jettonOnChainMetadataSpec).forEach((k) => {
    const val = dict.get(toKey(sha256(k).toString("hex")))?.toString(jettonOnChainMetadataSpec[k]);
    if (val) res[k] = val;
  });

  return res;
}

export function initData(owner: Address, data: { [s: string]: string | undefined }) {
  return beginCell()
    .storeCoins(0)
    .storeAddress(owner)
    .storeRef(beginCell().storeInt(ONCHAIN_CONTENT_PREFIX, 8).storeDict(buildOnChainData(data)).endCell())
    .storeRef(JETTON_WALLET_CODE)
    .endCell();
}

export function mintBody(owner: Address, jettonValue: BN): Cell {
  return beginCell()
    .storeUint(OPS.Mint, 32) // opcode (reference TODO)
    .storeUint(0, 64) // queryid
    .storeAddress(owner)
    .storeCoins(toNano(0.2)) // gas fee
    .storeRef(
      // internal transfer message
      beginCell()
        .storeUint(OPS.InternalTransfer, 32)
        .storeUint(0, 64)
        .storeCoins(jettonValue)
        .storeAddress(null) // TODO FROM?
        .storeAddress(null) // TODO RESP?
        .storeCoins(0)
        .storeBit(false) // forward_payload in this slice, not separate cell
        .endCell()
    )
    .endCell();
}
