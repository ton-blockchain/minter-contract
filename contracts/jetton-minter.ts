import BN from "bn.js";
import { Cell, beginCell, Address, toNano } from "ton";
import * as fs from "fs";

const OFFCHAIN_CONTENT_PREFIX = 0x01;

import {hex as walletHex} from "../build/jetton-wallet-hex.json";
import {hex as minterHex} from "../build/jetton-minter-hex.json";

export const JETTON_WALLET_CODE = Cell.fromBoc(walletHex)[0];
export const JETTON_MINTER_CODE = Cell.fromBoc(minterHex)[0]; // code cell from build output

enum OPS {
  Mint = 21,
  InternalTransfer = 0x178d4519,
  Transfer = 0xf8a7ea5,
}

export function initData(owner: Address, contentUri: string) {
  return beginCell()
    .storeCoins(0)
    .storeAddress(owner)
    .storeRef(
      beginCell()
        .storeInt(OFFCHAIN_CONTENT_PREFIX, 8) // off-chain marker (https://github.com/ton-blockchain/TIPs/issues/64)
        .storeBuffer(Buffer.from(contentUri, "ascii"))
        .endCell()
    )
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
