import BN from "bn.js";
import { Cell, beginCell, Address } from "ton";

// encode contract storage according to save_data() contract method
export function data(params: { ownerAddress: Address; counter: number }): Cell {
  return beginCell().storeAddress(params.ownerAddress).storeUint(params.counter, 64).endCell();
}

// message encoders for all ops (see contracts/imports/constants.fc for consts)

export function increment(): Cell {
  return beginCell().storeUint(0x37491f2f, 32).storeUint(0, 64).endCell();
}

export function deposit(): Cell {
  return beginCell().storeUint(0x47d54391, 32).storeUint(0, 64).endCell();
}

export function withdraw(params: { withdrawAmount: BN }): Cell {
  return beginCell().storeUint(0x41836980, 32).storeUint(0, 64).storeCoins(params.withdrawAmount).endCell();
}

export function transferOwnership(params: { newOwnerAddress: Address }): Cell {
  return beginCell().storeUint(0x2da38aaf, 32).storeUint(0, 64).storeAddress(params.newOwnerAddress).endCell();
}
