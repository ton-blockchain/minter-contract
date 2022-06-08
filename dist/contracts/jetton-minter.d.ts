import BN from "bn.js";
import { Cell, Address } from "ton";
export declare const JETTON_WALLET_CODE: Cell;
export declare const JETTON_MINTER_CODE: Cell;
export declare type JettonMetaDataKeys = "name" | "description" | "image" | "symbol";
export declare function buildOnChainData(data: {
    [s: string]: string | undefined;
}): Cell;
export declare function parseOnChainData(contentCell: Cell): {
    [s in JettonMetaDataKeys]?: string;
};
export declare function initData(owner: Address, data: {
    [s: string]: string | undefined;
}): Cell;
export declare function mintBody(owner: Address, jettonValue: BN): Cell;
