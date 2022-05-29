"use strict";
// TODO: possibly use this outside tests
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JettonMinter = void 0;
const ton_1 = require("ton");
const contract_deployer_1 = require("./contract-deployer");
const ops_1 = require("./ops");
class JettonMinter extends contract_deployer_1.WrappedSmartContract {
    getWalletAddress(forTonWalletAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.contract.invokeGetMethod("get_wallet_address", [
                // TODO(sy) ['tvm.Slice', cellBoc] => also a less desired API (tonclient)
                {
                    type: 'cell_slice',
                    value: (0, ton_1.beginCell)()
                        .storeAddress(forTonWalletAddress)
                        .endCell()
                        .toBoc({ idx: false })
                        .toString('base64')
                }
            ]);
            return res.result[0].readAddress();
        });
    }
    static mintBody(ownerAddress, jettonValue) {
        return (0, ton_1.beginCell)()
            .storeUint(ops_1.OPS.Mint, 32) // opcode (reference TODO)
            .storeUint(0, 64) // queryid
            .storeAddress(ownerAddress)
            .storeCoins((0, ton_1.toNano)(0.2)) // gas fee
            .storeRef(// internal transfer message
        (0, ton_1.beginCell)()
            .storeUint(ops_1.OPS.InternalTransfer, 32)
            .storeUint(0, 64)
            .storeCoins(jettonValue)
            .storeAddress(null) // TODO FROM?
            .storeAddress(null) // TODO RESP?
            .storeCoins(0)
            .storeBit(false) // forward_payload in this slice, not separate cell
            .endCell())
            .endCell();
    }
}
exports.JettonMinter = JettonMinter;
