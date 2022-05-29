"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMessage = exports.initData = void 0;
const jettonMinter = __importStar(require("../contracts/jetton-minter"));
const ton_1 = require("ton");
const bn_js_1 = require("bn.js");
// return the init Cell of the contract storage (according to load_data() contract method)
function initData() {
    return jettonMinter.data({
        totalSupply: new bn_js_1.BN(100000000),
        adminAddress: ton_1.Address.parseFriendly("EQD5677K8UgJ6OWmQT74oRUI5lB7be15jW_ot7oNweN-PdcN").address,
        offchainUri: 'https://api.jsonbin.io/b/628d3eef402a5b38020beade'
    });
}
exports.initData = initData;
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
