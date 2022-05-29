"use strict";
// TODO: possibly use this outside tests
Object.defineProperty(exports, "__esModule", { value: true });
exports.JettonWallet = void 0;
const ton_1 = require("ton");
const contract_deployer_1 = require("./contract-deployer");
const ops_1 = require("./ops");
class JettonWallet extends contract_deployer_1.WrappedSmartContract {
    static transferBody(toOwnerAddress, jettonValue) {
        return (0, ton_1.beginCell)()
            .storeUint(ops_1.OPS.Transfer, 32)
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
exports.JettonWallet = JettonWallet;
