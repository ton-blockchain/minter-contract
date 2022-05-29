import { Address, beginCell, Cell, contractAddress } from "ton";
import { SmartContract } from "ton-contract-executor";
import { WORKCHAIN } from "../../lib/consts";

export function filterLogs(logs: string) {
    const arr = logs.split("\n");
    //    console.log(arr.length);

    let filtered = arr.filter((it) => {
        return it.indexOf("#DEBUG#") !== -1 || it.indexOf("error") !== -1;
    });
    const beautified = filtered.map((it, i) => {
        const tabIndex = it.indexOf("\t");
        return `${i + 1}. ${it.substring(tabIndex + 1, it.length)}`;
    });

    return beautified;
}

export class WrappedSmartContract {

    contract: SmartContract;
    address: Address;

    constructor(contract: SmartContract, address: Address) {
        this.contract = contract;
        this.address = address;
    }

    // TODO extends typeof / instancetype 
    static async create<T extends typeof WrappedSmartContract>(codeCell: Cell, dataCell: Cell): Promise<InstanceType<T>> {
        const contract = await SmartContract.fromCell(
            codeCell,
            dataCell,
            {
                debug: true
            }
        );

        const ca = contractAddress({ workchain: WORKCHAIN, initialCode: codeCell, initialData: dataCell });
        contract.setC7Config({myself: ca}); // TODO -> set the rest of the config

        return new this(contract, ca) as InstanceType<T>;
    }

}