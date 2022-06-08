import BN from "bn.js";
import { Address, Cell, TonClient, Wallet } from "ton";
export declare function sleep(time: number): Promise<unknown>;
export declare function waitForSeqno(wallet: Wallet): Promise<() => Promise<void>>;
export declare function waitForContractDeploy(address: Address, client: TonClient): Promise<void>;
export declare function parseGetMethodCall(stack: any[]): (BN | Cell)[];
