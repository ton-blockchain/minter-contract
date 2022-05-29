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
exports.JETTON_WALLET_CODE = void 0;
const chai_1 = __importStar(require("chai"));
const chai_bn_1 = __importDefault(require("chai-bn"));
const bn_js_1 = __importDefault(require("bn.js"));
chai_1.default.use((0, chai_bn_1.default)(bn_js_1.default));
const fs = __importStar(require("fs"));
const ton_1 = require("ton");
const jetton_minter = __importStar(require("../contracts/jetton-minter"));
const jetton_wallet = __importStar(require("../contracts/jetton-wallet"));
const helpers_1 = require("./helpers");
const jetton_utils_1 = require("../jetton-utils");
const jetton_minter_1 = require("./lib/jetton-minter");
const utils_1 = require("./lib/utils");
const jetton_wallet_1 = require("./lib/jetton-wallet");
const OWNER_ADDRESS = (0, helpers_1.randomAddress)("owner");
const PARTICIPANT_ADDRESS_1 = (0, helpers_1.randomAddress)("participant_1");
const PARTICIPANT_ADDRESS_2 = (0, helpers_1.randomAddress)("participant_2");
exports.JETTON_WALLET_CODE = ton_1.Cell.fromBoc(fs.readFileSync("build/jetton-wallet.cell"))[0];
const JETTON_MINTER_CODE = ton_1.Cell.fromBoc(fs.readFileSync("build/jetton-minter.cell"))[0]; // code cell from build output
describe("Jetton", () => {
    let minterContract;
    const getJWalletContract = (walletOwnerAddress, jettonMasterAddress) => __awaiter(void 0, void 0, void 0, function* () {
        return yield jetton_wallet_1.JettonWallet.create(exports.JETTON_WALLET_CODE, jetton_wallet.data({
            walletOwnerAddress,
            jettonMasterAddress,
            jettonWalletCode: exports.JETTON_WALLET_CODE
        }));
    });
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const dataCell = jetton_minter.data({
            adminAddress: OWNER_ADDRESS,
            totalSupply: new bn_js_1.default(0),
            offchainUri: 'https://api.jsonbin.io/b/628ced3405f31f68b3a53622',
            jettonWalletCode: exports.JETTON_WALLET_CODE
        });
        minterContract = (yield jetton_minter_1.JettonMinter.create(JETTON_MINTER_CODE, dataCell)); // TODO: 🤮;
    }));
    it("should get minter initialization data correctly", () => __awaiter(void 0, void 0, void 0, function* () {
        const call = yield minterContract.contract.invokeGetMethod("get_jetton_data", []);
        const { totalSupply, address, contentUri } = (0, jetton_utils_1.parseJettonDetails)(call);
        (0, chai_1.expect)(totalSupply).to.be.bignumber.equal(new bn_js_1.default(0));
        (0, chai_1.expect)(address.toFriendly()).to.equal(OWNER_ADDRESS.toFriendly());
        (0, chai_1.expect)(contentUri).to.equal('https://api.jsonbin.io/b/628ced3405f31f68b3a53622');
    }));
    it("offchain and onchain jwallet should return the same address", () => __awaiter(void 0, void 0, void 0, function* () {
        const jwallet = yield getJWalletContract(PARTICIPANT_ADDRESS_1, minterContract.address);
        const participantJwalletAddress = yield minterContract.getWalletAddress(PARTICIPANT_ADDRESS_1);
        (0, chai_1.expect)(jwallet.address.toFriendly()).to.equal(participantJwalletAddress.toFriendly());
    }));
    it("should get jwallet initialization data correctly", () => __awaiter(void 0, void 0, void 0, function* () {
        const jwallet = yield getJWalletContract(PARTICIPANT_ADDRESS_1, minterContract.address);
        const jwalletDetails = (0, jetton_utils_1.parseJettonWalletDetails)((yield jwallet.contract.invokeGetMethod("get_wallet_data", [])));
        (0, chai_1.expect)(jwalletDetails.balance).to.bignumber.equal(new bn_js_1.default(0));
        (0, chai_1.expect)(jwalletDetails.owner.toFriendly()).to.equal(PARTICIPANT_ADDRESS_1.toFriendly());
        (0, chai_1.expect)(jwalletDetails.jettonMasterContract.toFriendly()).to.equal(minterContract.address.toFriendly());
    }));
    it("should mint jettons and transfer to 2 new wallets", () => __awaiter(void 0, void 0, void 0, function* () {
        // Produce mint message
        const { actionList: actionList1 } = yield minterContract.contract.sendInternalMessage((0, helpers_1.internalMessage)({
            from: OWNER_ADDRESS,
            body: jetton_minter_1.JettonMinter.mintBody(PARTICIPANT_ADDRESS_1, (0, ton_1.toNano)(0.01))
        }));
        const jwallet1 = yield getJWalletContract(PARTICIPANT_ADDRESS_1, minterContract.address);
        const { balance: balanceInitial } = (0, jetton_utils_1.parseJettonWalletDetails)((yield jwallet1.contract.invokeGetMethod("get_wallet_data", [])));
        (0, chai_1.expect)(balanceInitial).to.bignumber.equal(new bn_js_1.default(0), "jwallet1 initial balance should be 0");
        // Send mint message to jwallet1
        yield jwallet1.contract.sendInternalMessage((0, utils_1.actionToMessage)(minterContract.address, actionList1[0]));
        const { balance: balanceAfter } = (0, jetton_utils_1.parseJettonWalletDetails)((yield jwallet1.contract.invokeGetMethod("get_wallet_data", [])));
        (0, chai_1.expect)(balanceAfter).to.bignumber.equal((0, ton_1.toNano)(0.01), "jwallet1 should reflact its balance after mint");
        let { totalSupply } = (0, jetton_utils_1.parseJettonDetails)((yield minterContract.contract.invokeGetMethod("get_jetton_data", [])));
        (0, chai_1.expect)(totalSupply).to.bignumber.equal((0, ton_1.toNano)(0.01), "total supply should increase after first mint");
        // Mint and transfer to jwallet2
        const { actionList: actionList2 } = yield minterContract.contract.sendInternalMessage((0, helpers_1.internalMessage)({
            from: OWNER_ADDRESS,
            body: jetton_minter_1.JettonMinter.mintBody(PARTICIPANT_ADDRESS_2, (0, ton_1.toNano)(0.02))
        }));
        const jwallet2 = yield getJWalletContract(PARTICIPANT_ADDRESS_2, minterContract.address);
        yield jwallet2.contract.sendInternalMessage((0, utils_1.actionToMessage)(minterContract.address, actionList2[0]));
        const { balance: balanceAfter2 } = (0, jetton_utils_1.parseJettonWalletDetails)((yield jwallet2.contract.invokeGetMethod("get_wallet_data", [])));
        (0, chai_1.expect)(balanceAfter2).to.bignumber.equal((0, ton_1.toNano)(0.02), "jwallet2 should reflact its balance after mint");
        totalSupply = (0, jetton_utils_1.parseJettonDetails)((yield minterContract.contract.invokeGetMethod("get_jetton_data", []))).totalSupply;
        (0, chai_1.expect)(totalSupply).to.bignumber.equal((0, ton_1.toNano)(0.03), "total supply should amount to both mints");
    }));
    it("should mint jettons and transfer from wallet1 to wallet2", () => __awaiter(void 0, void 0, void 0, function* () {
        // Produce mint message
        const { actionList: actionList1 } = yield minterContract.contract.sendInternalMessage((0, helpers_1.internalMessage)({
            from: OWNER_ADDRESS,
            body: jetton_minter_1.JettonMinter.mintBody(PARTICIPANT_ADDRESS_1, (0, ton_1.toNano)(0.01))
        }));
        const jwallet1 = yield getJWalletContract(PARTICIPANT_ADDRESS_1, minterContract.address);
        // Send mint message to jwallet1
        yield jwallet1.contract.sendInternalMessage((0, utils_1.actionToMessage)(minterContract.address, actionList1[0]));
        // Transfer jwallet1-->jwallet2
        const res = yield jwallet1.contract.sendInternalMessage((0, helpers_1.internalMessage)({
            from: PARTICIPANT_ADDRESS_1,
            body: jetton_wallet_1.JettonWallet.transferBody(PARTICIPANT_ADDRESS_2, (0, ton_1.toNano)(0.004)),
            value: (0, ton_1.toNano)(0.031)
        }));
        const jwallet2 = yield getJWalletContract(PARTICIPANT_ADDRESS_2, minterContract.address);
        yield jwallet2.contract.sendInternalMessage((0, utils_1.actionToMessage)(jwallet1.address, res.actionList[0]));
        const { balance: balanceAfter2 } = (0, jetton_utils_1.parseJettonWalletDetails)((yield jwallet2.contract.invokeGetMethod("get_wallet_data", [])));
        (0, chai_1.expect)(balanceAfter2).to.bignumber.equal((0, ton_1.toNano)(0.004), "jwallet2 balance should reflect amount sent from jwallet1");
        const { balance: balanceAfter1 } = (0, jetton_utils_1.parseJettonWalletDetails)((yield jwallet1.contract.invokeGetMethod("get_wallet_data", [])));
        (0, chai_1.expect)(balanceAfter1).to.bignumber.equal((0, ton_1.toNano)(0.01).sub((0, ton_1.toNano)(0.004)), "jwallet1 balance should subtract amount sent to jwallet2");
        const totalSupply = (0, jetton_utils_1.parseJettonDetails)((yield minterContract.contract.invokeGetMethod("get_jetton_data", []))).totalSupply;
        (0, chai_1.expect)(totalSupply).to.bignumber.equal((0, ton_1.toNano)(0.01), "total supply should not change");
    }));
    /*
    Further tests:
    - burn
    - mint
    - transfer from wallet
    - change owner
    - change content / immutable vs nonimmutable
    */
});
