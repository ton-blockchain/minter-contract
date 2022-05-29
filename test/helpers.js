"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInternalMessageWithWallet = exports.setBalance = exports.internalMessage = exports.randomAddress = exports.zeroAddress = void 0;
const ton_1 = require("ton");
const prando_1 = __importDefault(require("prando"));
exports.zeroAddress = new ton_1.Address(0, Buffer.alloc(32, 0));
function randomAddress(seed, workchain) {
    const random = new prando_1.default(seed);
    const hash = Buffer.alloc(32);
    for (let i = 0; i < hash.length; i++) {
        hash[i] = random.nextInt(0, 255);
    }
    return new ton_1.Address(workchain !== null && workchain !== void 0 ? workchain : 0, hash);
}
exports.randomAddress = randomAddress;
// used with ton-contract-executor (unit tests) to sendInternalMessage easily
function internalMessage(params) {
    var _a, _b, _c, _d;
    const message = params.body ? new ton_1.CellMessage(params.body) : undefined;
    return new ton_1.InternalMessage({
        from: (_a = params.from) !== null && _a !== void 0 ? _a : randomAddress("sender"),
        to: (_b = params.to) !== null && _b !== void 0 ? _b : exports.zeroAddress,
        value: (_c = params.value) !== null && _c !== void 0 ? _c : 0,
        bounce: (_d = params.bounce) !== null && _d !== void 0 ? _d : true,
        body: new ton_1.CommonMessageInfo({ body: message }),
    });
}
exports.internalMessage = internalMessage;
// temp fix until ton-contract-executor (unit tests) remembers c7 value between calls
function setBalance(contract, balance) {
    contract.setC7Config({
        balance: balance.toNumber(),
    });
}
exports.setBalance = setBalance;
// helper for end-to-end on-chain tests (normally post deploy) to allow sending InternalMessages to contracts using a wallet
function sendInternalMessageWithWallet(params) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const message = params.body ? new ton_1.CellMessage(params.body) : undefined;
        const seqno = yield params.walletContract.getSeqNo();
        const transfer = params.walletContract.createTransfer({
            secretKey: params.secretKey,
            seqno: seqno,
            sendMode: ton_1.SendMode.PAY_GAS_SEPARATLY + ton_1.SendMode.IGNORE_ERRORS,
            order: new ton_1.InternalMessage({
                to: params.to,
                value: params.value,
                bounce: (_a = params.bounce) !== null && _a !== void 0 ? _a : false,
                body: new ton_1.CommonMessageInfo({
                    body: message,
                }),
            }),
        });
        yield params.walletContract.client.sendExternalMessage(params.walletContract, transfer);
        for (let attempt = 0; attempt < 10; attempt++) {
            yield sleep(2000);
            const seqnoAfter = yield params.walletContract.getSeqNo();
            if (seqnoAfter > seqno)
                return;
        }
    });
}
exports.sendInternalMessageWithWallet = sendInternalMessageWithWallet;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
