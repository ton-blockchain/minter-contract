// TODO: possibly use this outside tests

import BN from "bn.js";
import { Address, beginCell, Cell, Slice, toNano } from "ton";
import { WrappedSmartContract } from "./wrapped-smart-contract";
import { OPS } from "./ops";

export class JettonWallet extends WrappedSmartContract {
  static transferBody(toOwnerAddress: Address, jettonValue: BN): Cell {
    return beginCell()
      .storeUint(OPS.Transfer, 32)
      .storeUint(0, 64) // queryid
      .storeCoins(jettonValue)
      .storeAddress(toOwnerAddress)
      .storeAddress(null) // TODO RESP?
      .storeDict(null) // custom payload
      .storeCoins(0) // forward ton amount TODO
      .storeRefMaybe(null) // forward payload - TODO??
      .endCell();
  }
}
