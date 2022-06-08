import BN from "bn.js";
import { Address, Cell, StateInit, TonClient } from "ton";
export interface TransactionDetails {
    to: Address;
    value: BN;
    stateInit: StateInit;
    message?: Cell;
}
export interface TransactionSender {
    sendTransaction(transactionDetails: TransactionDetails): Promise<void>;
}
export declare class ChromeExtensionTransactionSender implements TransactionSender {
    sendTransaction(transactionDetails: TransactionDetails): Promise<void>;
}
export declare class PrivKeyTransactionSender implements TransactionSender {
    #private;
    constructor(mnemonic: string[], tonClient: TonClient);
    sendTransaction(transactionDetails: TransactionDetails): Promise<void>;
}
export declare class TonDeepLinkTransactionSender implements TransactionSender {
    #private;
    constructor(deepLinkPrefix: string);
    sendTransaction(transactionDetails: TransactionDetails): Promise<void>;
}
