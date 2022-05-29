"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMessage = void 0;
// return the init Cell of the contract storage (according to load_data() contract method)
// export function initData() {
//   return jettonMinter.data({
//     totalSupply: new BN(100000000),
//     adminAddress: Address.parseFriendly("EQD5677K8UgJ6OWmQT74oRUI5lB7be15jW_ot7oNweN-PdcN").address,
//     offchainUri: 'https://api.jsonbin.io/b/628d3eef402a5b38020beade',
//   });
// }
// return the op that should be sent to the contract on deployment, can be "null" to send an empty message
function initMessage() {
    return null; // TODO?
}
exports.initMessage = initMessage;
// optional end-to-end sanity test for the actual on-chain contract to see it is actually working on-chain
// export async function postDeployTest(walletContract: WalletContract, secretKey: Buffer, contractAddress: Address) {
// const call = await walletContract.client.callGetMethod(contractAddress, "counter");
// const counter = new TupleSlice(call.stack).readBigNumber();
// console.log(`   # Getter 'counter' = ${counter.toString()}`);
// const message = main.increment();
// await sendInternalMessageWithWallet({ walletContract, secretKey, to: contractAddress, value: toNano(0.02), body: message });
// console.log(`   # Sent 'increment' op message`);
// const call2 = await walletContract.client.callGetMethod(contractAddress, "counter");
// const counter2 = new TupleSlice(call2.stack).readBigNumber();
// console.log(`   # Getter 'counter' = ${counter2.toString()}`);
// }
