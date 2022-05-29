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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WrappedSmartContract = exports.filterLogs = void 0;
const ton_1 = require("ton");
const ton_contract_executor_1 = require("ton-contract-executor");
const consts_1 = require("../../lib/consts");
function filterLogs(logs) {
    const arr = logs.split("\n");
    //    console.log(arr.length);
    let filtered = arr.filter((it) => {
        return it.indexOf("#DEBUG#") !== -1 || it.indexOf("error") !== -1;
    });
    const beautified = filtered.map((it, i) => {
        const tabIndex = it.indexOf("\t");
        return `${i + 1}. ${it.substring(tabIndex + 1, it.length)}`;
    });
    return beautified;
}
exports.filterLogs = filterLogs;
class WrappedSmartContract {
    constructor(contract, address) {
        this.contract = contract;
        this.address = address;
    }
    // TODO extends typeof / instancetype 
    static create(codeCell, dataCell) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = yield ton_contract_executor_1.SmartContract.fromCell(codeCell, dataCell, {
                debug: true
            });
            const ca = (0, ton_1.contractAddress)({ workchain: consts_1.WORKCHAIN, initialCode: codeCell, initialData: dataCell });
            contract.setC7Config({ myself: ca }); // TODO -> set the rest of the config
            return new this(contract, ca);
        });
    }
}
exports.WrappedSmartContract = WrappedSmartContract;
