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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _DeployController_instances, _DeployController_client, _DeployController_contractDeployer, _DeployController_transactionSender, _DeployController_deployContract;
Object.defineProperty(exports, "__esModule", { value: true });
class DeployController {
    constructor(client, contractDeployer, transactionSender) {
        _DeployController_instances.add(this);
        _DeployController_client.set(this, void 0);
        _DeployController_contractDeployer.set(this, void 0);
        _DeployController_transactionSender.set(this, void 0);
        __classPrivateFieldSet(this, _DeployController_client, client, "f");
        __classPrivateFieldSet(this, _DeployController_contractDeployer, contractDeployer, "f");
        __classPrivateFieldSet(this, _DeployController_transactionSender, transactionSender, "f");
    }
    createJetton(ownerAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            // this.#client.sendExternalMessage()
            // TODO - how/should we use the deployer here?
            /*
                1. Upload image to IPFS?
                2. Upload JSON to IPFS?
                3. Deploy contract?
                4. Mint to owner?
            */
            // Assume we've uploaded to IPFS
            try {
                yield __classPrivateFieldGet(this, _DeployController_contractDeployer, "f").deployContract(__classPrivateFieldGet(this, _DeployController_transactionSender, "f"), JettonContract.createFrom(jettonDetails, JettonContract.mint(to, ...)));
            }
            catch (e) {
                // TODO deploy-specific errors
                throw e;
            }
            // Assuming contract was deployed with mint
        });
    }
}
_DeployController_client = new WeakMap(), _DeployController_contractDeployer = new WeakMap(), _DeployController_transactionSender = new WeakMap(), _DeployController_instances = new WeakSet(), _DeployController_deployContract = function _DeployController_deployContract(params) {
    return __awaiter(this, void 0, void 0, function* () {
    });
};
