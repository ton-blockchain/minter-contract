import BN from "bn.js";
import { Address, Cell, Slice } from "ton";

interface JettonWalletDetails {
  balance: BN;
  owner: Address;
  jettonMasterContract: Address; // Minter
}

// TODO remove
export function parseJettonWalletDetails(execResult: { result: any[] }): JettonWalletDetails {
  return {
    balance: execResult.result[0] as BN,
    owner: (execResult.result[1] as Slice).readAddress()!,
    jettonMasterContract: (execResult.result[2] as Slice).readAddress()!,
  };
}
