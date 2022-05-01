import { Cell, beginCell, Address } from "ton";

// encode contract storage according to save_data() contract method
export function data(params: { ownerAddress: Address; counter: number }): Cell {
  return beginCell().storeAddress(params.ownerAddress).storeUint(params.counter, 64).endCell();
}

// message encoders for all ops

export function increment(): Cell {
  return beginCell().storeUint(0x37491f2f, 32).storeUint(0, 64).endCell();
}
