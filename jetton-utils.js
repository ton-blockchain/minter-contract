"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJettonWalletDetails = exports.getWalletAddress = exports.parseJettonDetails = void 0;
function parseContentField(content) {
    const uintArr = [];
    while (content.remaining) {
        uintArr.push(content.readUintNumber(8));
    }
    return new TextDecoder().decode(
    // Slice the off-chain/on-chain marker
    Buffer.from(uintArr).slice(1));
}
function parseJettonDetails(execResult) {
    return {
        totalSupply: execResult.result[0],
        address: execResult.result[2].readAddress(),
        contentUri: parseContentField(execResult.result[3].beginParse())
    };
}
exports.parseJettonDetails = parseJettonDetails;
function getWalletAddress(stack) {
    return stack[0][1].bytes[0].beginParse().readAddress();
}
exports.getWalletAddress = getWalletAddress;
function parseJettonWalletDetails(execResult) {
    return {
        balance: execResult.result[0],
        owner: execResult.result[1].readAddress(),
        jettonMasterContract: execResult.result[2].readAddress(),
    };
}
exports.parseJettonWalletDetails = parseJettonWalletDetails;
