import { Address, beginCell, Cell, contractAddress } from "ton";
import { SmartContract } from "ton-contract-executor";
const WORKCHAIN = 0;

export class WrappedSmartContract {
  contract: SmartContract;
  address: Address;

  constructor(contract: SmartContract, address: Address) {
    this.contract = contract;
    this.address = address;
  }

  // TODO extends typeof / instancetype
  static async create<T extends typeof WrappedSmartContract>(
    codeCell: Cell,
    dataCell: Cell
  ): Promise<InstanceType<T>> {
    const contract = await SmartContract.fromCell(codeCell, dataCell, {
      debug: true,
    });

    const ca = contractAddress({
      workchain: WORKCHAIN,
      initialCode: codeCell,
      initialData: dataCell,
    });
    contract.setC7Config({ myself: ca }); // TODO -> set the rest of the config

    return new this(contract, ca) as InstanceType<T>;
  }
}
