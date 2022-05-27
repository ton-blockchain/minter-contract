// TODO: possibly use this outside tests

import { Address, beginCell, Cell, Slice, toNano } from "ton";
import { WrappedSmartContract } from "./contract-deployer";
import { OPS } from "./ops";

export class JettonMinter extends WrappedSmartContract {

    async getWalletAddress(forTonWalletAddress: Address): Promise<Address> {
        const res = await this.contract.invokeGetMethod(
            "get_wallet_address",
            [
                // TODO(sy) ['tvm.Slice', cellBoc] => also a less desired API (tonclient)
                {
                    type: 'cell_slice',
                    value: beginCell()
                        .storeAddress(forTonWalletAddress)
                        .endCell()
                        .toBoc({ idx: false })
                        .toString('base64')
                }
            ]
        )

        return (res.result[0] as Slice).readAddress()!
    }

    static mintBody(ownerAddress: Address): Cell {
        return beginCell()
            .storeUint(OPS.Mint, 32) // opcode (reference TODO)
            .storeUint(0, 64) // queryid
            .storeAddress(ownerAddress)
            .storeCoins(toNano(0.2)) // gas fee
            .storeRef( // internal transfer message
                beginCell()
                    .storeUint(OPS.InternalTransfer, 32)
                    .storeUint(0, 64)
                    .storeCoins(toNano(0.01)) // JETTON Transfer amount?
                    .storeAddress(null) // FROM?
                    .storeAddress(null) // RESP?
                    .storeCoins(0)
                    .storeBit(false) // forward_payload in this slice, not separate cell
                    .endCell()
            )
            .endCell()
    }

}