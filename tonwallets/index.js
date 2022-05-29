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
require('dotenv').config();
const ton_1 = require("ton");
const fs_1 = __importDefault(require("fs"));
const bn_js_1 = __importDefault(require("bn.js"));
const WORKCHAIN = 0;
const TON_0_1 = new bn_js_1.default("100000000");
const sleep = ms => new Promise(r => setTimeout(r, ms));
class WalletSerde {
    static createWalletAndSerialize(client, walletName) {
        return __awaiter(this, void 0, void 0, function* () {
            const { wallet, mnemonic, key } = yield client.createNewWallet({
                workchain: WORKCHAIN,
            });
            fs_1.default.writeFileSync(this._walletToFileName(walletName), JSON.stringify({
                address: wallet.address.toFriendly(),
                key,
                mnemonic
            }));
        });
    }
    static deserializeWallet(walletName) {
        const walletJSON = JSON.parse(fs_1.default.readFileSync(this._walletToFileName(walletName)).toString());
        walletJSON.address = ton_1.Address.parse(walletJSON.address);
        walletJSON.key.secretKey = Buffer.from(walletJSON.key.secretKey);
        walletJSON.key.publicKey = Buffer.from(walletJSON.key.publicKey);
        return walletJSON;
    }
}
WalletSerde._walletToFileName = (w) => `wallets/${process.env.TESTNET ? 'testnet' : 'mainnet'}/${w}.json`;
(() => __awaiter(void 0, void 0, void 0, function* () {
    // Create Client
    const client = new ton_1.TonClient({
        endpoint: "http://127.0.0.1:4443",
        apiKey: process.env.TESTNET ? process.env.TESTNET_API_KEY : process.env.MAINNET_API_KEY
    });
    function createWallets() {
        return __awaiter(this, void 0, void 0, function* () {
            yield WalletSerde.createWalletAndSerialize(client, "wallet1");
            yield WalletSerde.createWalletAndSerialize(client, "wallet2");
            yield WalletSerde.createWalletAndSerialize(client, "wallet3");
        });
    }
    function readWallets() {
        return __awaiter(this, void 0, void 0, function* () {
            const walletNames = ["wallet1", "wallet2", "wallet3"];
            const balances = yield Promise.all(walletNames
                .map(w => (WalletSerde.deserializeWallet(w).address))
                .map((a) => __awaiter(this, void 0, void 0, function* () { return yield client.getBalance(a); })));
            walletNames.forEach((w, i) => {
                console.log(`${w}:${balances[i]}`);
            });
        });
    }
    function transfer(from, to, value, client) {
        return __awaiter(this, void 0, void 0, function* () {
            const fromWallet = client.openWalletFromAddress({ source: from.address });
            fromWallet.prepare(0, from.key.publicKey);
            const beforeseqno = (yield fromWallet.getSeqNo());
            yield fromWallet.transfer({
                seqno: beforeseqno,
                to,
                value,
                bounce: false,
                secretKey: from.key.secretKey
            });
            let seqno = -1;
            let sleepMS = 100;
            while (seqno <= beforeseqno) {
                if (sleepMS > 15000)
                    throw new Error("Unexpected block time finalization");
                console.log(`Awaiting seqno to update. sleeping for ${sleepMS}ms`);
                yield sleep(sleepMS);
                seqno = yield fromWallet.getSeqNo();
                sleepMS *= 2;
            }
        });
    }
    function jettonRead() {
        return __awaiter(this, void 0, void 0, function* () {
            const wallet1 = WalletSerde.deserializeWallet("wallet1");
            const wallet2 = WalletSerde.deserializeWallet("wallet2");
            // await transfer(wallet1, wallet2.address, TON_0_1, client);
            const cell = new ton_1.Cell();
            cell.bits.writeAddress(wallet1.address);
            // const addressCell = beginCell()
            //   .storeAddress(wallet1.address)
            //   .endCell()
            const cellBoc = (cell.toBoc({ idx: false })).toString('base64');
            const MINTER_CONTRACT_ADDRESS = ton_1.Address.parse(process.env.TESTNET ? process.env.TESTNET_MINTER_CONTRACT : process.env.MAINNET_MINTER_CONTRACT);
            const res = yield client.callGetMethod(MINTER_CONTRACT_ADDRESS, "get_wallet_address", [['tvm.Slice', cellBoc]]);
            function bytesToAddress(bufferB64) {
                const buff = Buffer.from(bufferB64, "base64");
                let c2 = ton_1.Cell.fromBoc(buff);
                return c2[0].beginParse().readAddress();
            }
            // const res = await client.callGetMethod(
            //   MINTER_CONTRACT_ADDRESS,
            //   "get_jetton_data",
            // )
            // JSON - https://api.jsonbin.io/b/628ced3405f31f68b3a53622
            console.log(bytesToAddress(res.stack[0][1].bytes).toFriendly()); // TODO figure out bytes to address
        });
    }
    const command = process.argv[2];
    switch ((command !== null && command !== void 0 ? command : '').toLowerCase()) {
        case 'create':
            break;
        case 'balances':
            yield readWallets();
            break;
        case 'transfer':
            break;
        case 'jettonread':
            yield jettonRead();
            break;
        default:
            throw new Error("Unknown command");
    }
    return;
}))();
// static async GetWalletAddress(client: TonClient, minterAddress: Address, walletAddress: Address) {
//         try {
//             let cell = new Cell();
//             cell.bits.writeAddress(walletAddress);
//             // nodejs buffer
//             let b64dataBuffer = (await cell.toBoc({ idx: false })).toString("base64");
//             let res = await client.callGetMethod(minterAddress, "get_wallet_address", [["tvm.Slice", b64dataBuffer]]);
//             return bytesToAddress(res.stack[0][1].bytes);
//         } catch (e) {
//             console.log("exception", e);
//         }
//     }
