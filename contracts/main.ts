// this file assists with instantiating the contract (code and data cells)

import * as fs from "fs";
import { Cell, beginCell, Address } from "ton";

// returns contract code cell by relying on the build output in the build directory
export function createCode() {
  return Cell.fromBoc(fs.readFileSync(__dirname + "/../build/main.cell"))[0];
}

// returns contract data cell (storage) according to save_data() contract method
export function createData(params: { ownerAddress: Address; counter: number }) {
  return beginCell().storeAddress(params.ownerAddress).storeUint(params.counter, 64).endCell();
}

// message generators for all ops

export function op_increment() {
  return beginCell().storeUint(1, 32).storeUint(0, 64).endCell();
}
