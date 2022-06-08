import { TransactionSender } from "./transaction-sender";
import BN from "bn.js";
import { Address, Cell } from "ton";
interface ContractDeployDetails {
    deployer: Address;
    value: BN;
    code: Cell;
    data: Cell;
    message?: Cell;
    dryRun?: boolean;
}
export declare class ContractDeployer {
    addressForContract(params: ContractDeployDetails): Address;
    deployContract(params: ContractDeployDetails, transactionSender: TransactionSender): Promise<Address>;
}
export {};
