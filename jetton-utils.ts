import BN from "bn.js";
import { Address, Cell, Slice } from "ton";
// import { SmartContract } from "ton-contract-executor";

interface JettonDetails {
    totalSupply: BN,
    address: Address,
    contentUri: string
}

function parseContentField(content: Slice): string {
    const uintArr = [];
    while (content.remaining) {
        uintArr.push(content.readUintNumber(8));
    }
    return new TextDecoder().decode(
        // Slice the off-chain/on-chain marker
        Buffer.from(uintArr).slice(1)
    );
}

export function parseJettonDetails(execResult: { result: any[] }): JettonDetails {
    return {
        totalSupply: execResult.result[0] as BN,
        address: (execResult.result[2] as Slice).readAddress()!,
        contentUri: parseContentField((execResult.result[3] as Cell).beginParse())
    }
}

export function getWalletAddress(stack: any[]): Address {
    return stack[0][1].bytes[0].beginParse().readAddress()!;
}

interface JettonWalletDetails {
    balance: BN,
    owner: Address,
    jettonMasterContract: Address // Minter
}

export function parseJettonWalletDetails(execResult: { result: any[] }): JettonWalletDetails {
    return {
        balance: execResult.result[0] as BN,
        owner: (execResult.result[1] as Slice).readAddress()!,
        jettonMasterContract: (execResult.result[2] as Slice).readAddress()!,
    }
}