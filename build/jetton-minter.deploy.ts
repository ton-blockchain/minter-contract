import { Cell, beginCell, Address, WalletContract, beginDict, Slice } from "ton";

import walletHex from "./jetton-wallet.compiled.json";
import minterHex from "./jetton-minter.compiled.json";
import { Sha256 } from "@aws-crypto/sha256-js";
import BN from "bn.js";

export const JETTON_WALLET_CODE = Cell.fromBoc(walletHex.hex)[0];
export const JETTON_MINTER_CODE = Cell.fromBoc(minterHex.hex)[0]; // code cell from build output

const ONCHAIN_CONTENT_PREFIX = 0x00;
const SNAKE_PREFIX = 0x00;

// This is example data - Modify these params for your own jetton!
// - Data is stored on-chain (except for the image data itself)
// - Owner should usually be the deploying wallet's address.
const jettonParams = {
  owner: Address.parse("EQD4gS-Nj2Gjr2FYtg-s3fXUvjzKbzHGZ5_1Xe_V0-GCp0p2"),
  name: "MyJetton",
  symbol: "JET1",
  image: "https://www.linkpicture.com/q/download_183.png", // Image url
  description: "My jetton",
};

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

export function buildTokenMetadataCell(data: { [s: string]: string | undefined }): Cell {
  const KEYLEN = 256;
  const dict = beginDict(KEYLEN);

  Object.entries(data).forEach(([k, v]: [string, string | undefined]) => {
    if (!jettonOnChainMetadataSpec[k as JettonMetaDataKeys])
      throw new Error(`Unsupported onchain key: ${k}`);
    if (v === undefined || v === "") return;

    let bufferToStore = Buffer.from(v, jettonOnChainMetadataSpec[k as JettonMetaDataKeys]);

    const CELL_MAX_SIZE_BYTES = Math.floor((1023 - 8) / 8);

    const rootCell = new Cell();
    rootCell.bits.writeUint8(SNAKE_PREFIX);
    let currentCell = rootCell;

    while (bufferToStore.length > 0) {
      currentCell.bits.writeBuffer(bufferToStore.slice(0, CELL_MAX_SIZE_BYTES));
      bufferToStore = bufferToStore.slice(CELL_MAX_SIZE_BYTES);
      if (bufferToStore.length > 0) {
        const newCell = new Cell();
        currentCell.refs.push(newCell);
        currentCell = newCell;
      }
    }

    dict.storeRef(sha256(k), rootCell);
  });

  return beginCell().storeInt(ONCHAIN_CONTENT_PREFIX, 8).storeDict(dict.endDict()).endCell();
}

export function parseTokenMetadataCell(contentCell: Cell): {
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
    const buffer = Buffer.from("");

    const sliceToVal = (s: Slice, v: Buffer, isFirst: boolean) => {
      s.toCell().beginParse();
      if (isFirst && s.readUint(8).toNumber() !== SNAKE_PREFIX)
        throw new Error("Only snake format is supported");

      v = Buffer.concat([v, s.readRemainingBytes()]);
      if (s.remainingRefs === 1) {
        v = sliceToVal(s.readRef(), v, false);
      }

      return v;
    };

    return sliceToVal(s.readRef(), buffer, true);
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

export function jettonMinterInitData(
  owner: Address,
  metadata: { [s in JettonMetaDataKeys]?: string }
): Cell {
  return beginCell()
    .storeCoins(0)
    .storeAddress(owner)
    .storeRef(buildTokenMetadataCell(metadata))
    .storeRef(JETTON_WALLET_CODE)
    .endCell();
}

// return the init Cell of the contract storage (according to load_data() contract method)
export function initData() {
  return jettonMinterInitData(jettonParams.owner, {
    name: jettonParams.name,
    symbol: jettonParams.symbol,
    image: jettonParams.image,
    description: jettonParams.description,
  });
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
    parseTokenMetadataCell(
      Cell.fromBoc(Buffer.from(call.stack[3][1].bytes, "base64").toString("hex"))[0]
    )
  );
}
