"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
const ton_1 = require("ton");
function data(params) {
    return (0, ton_1.beginCell)()
        .storeCoins(0)
        .storeAddress(params.walletOwnerAddress)
        .storeAddress(params.jettonMasterAddress)
        .storeRef(params.jettonWalletCode)
        .endCell();
}
exports.data = data;
// .store_uint(0, 2)
// .store_dict(jetton_wallet_code)
// .store_dict(pack_jetton_wallet_data(0, owner_address, jetton_master_address, jetton_wallet_code))
// .store_uint(0, 1)
