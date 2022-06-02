import { Cell, beginCell, Address, BitString } from "ton";

export function data(params: { walletOwnerAddress: Address; jettonMasterAddress: Address; jettonWalletCode: Cell }): Cell {
  return beginCell().storeCoins(0).storeAddress(params.walletOwnerAddress).storeAddress(params.jettonMasterAddress).storeRef(params.jettonWalletCode).endCell();
}

// .store_uint(0, 2)
// .store_dict(jetton_wallet_code)
// .store_dict(pack_jetton_wallet_data(0, owner_address, jetton_master_address, jetton_wallet_code))
// .store_uint(0, 1)
