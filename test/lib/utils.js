"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.actionToMessage = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const ton_1 = require("ton");
function actionToMessage(from, action, messageValue = new bn_js_1.default(1000000000), bounce = true) {
    var _a, _b;
    //@ts-ignore
    const sendMessageAction = action;
    let msg = new ton_1.CommonMessageInfo({ body: new ton_1.CellMessage((_a = sendMessageAction.message) === null || _a === void 0 ? void 0 : _a.body) });
    return new ton_1.InternalMessage({
        to: (_b = sendMessageAction.message) === null || _b === void 0 ? void 0 : _b.info.dest,
        from,
        value: messageValue,
        bounce,
        body: msg,
    });
}
exports.actionToMessage = actionToMessage;
