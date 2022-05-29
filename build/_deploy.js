"use strict";
// This is a simple generic deploy script in TypeScript that should work for most projects without modification
// Every contract you want to deploy should have a mycontract.deploy.ts script that returns its init data
// The script assumes that it is running from the repo root, and the directories are organized this way:
//  ./build/ - directory for build artifacts (mycontract.cell) and deploy init data scripts (mycontract.deploy.ts)
//  ./.env - config file with DEPLOYER_MNEMONIC - secret mnemonic of deploying wallet (will be created if not found)
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
const axios_1 = __importDefault(require("axios"));
const axios_request_throttle_1 = __importDefault(require("axios-request-throttle"));
axios_request_throttle_1.default.use(axios_1.default, { requestsPerSecond: 0.5 }); // required since toncenter jsonRPC limits to 1 req/sec without API key
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const fast_glob_1 = __importDefault(require("fast-glob"));
const ton_1 = require("ton");
const ton_2 = require("ton");
const ton_crypto_1 = require("ton-crypto");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`=================================================================`);
        console.log(`Deploy script running, let's find some contracts to deploy..`);
        // check input arguments (given through environment variables)
        if (process.env.TESTNET || process.env.npm_lifecycle_event == "deploy:testnet") {
            console.log(`\n* We are working with 'testnet' (https://t.me/testgiver_ton_bot will give you test TON)`);
        }
        else {
            console.log(`\n* We are working with 'mainnet'`);
        }
        // initialize globals
        const client = new ton_2.TonClient({ endpoint: `https://${process.env.TESTNET ? "testnet." : ""}toncenter.com/api/v2/jsonRPC` });
        const deployerWalletType = "org.ton.wallets.v3.r1"; // also see WalletV3R2Source class used below
        const newContractFunding = (0, ton_1.toNano)(0.02); // this will be (almost in full) the balance of a new deployed contract and allow it to pay rent
        const workchain = 0; // normally 0, only special contracts should be deployed to masterchain (-1)
        // make sure we have a wallet mnemonic to deploy from (or create one if not found)
        const deployConfigEnv = ".env";
        let deployerMnemonic;
        if (!fs_1.default.existsSync(deployConfigEnv) || !process.env.DEPLOYER_MNEMONIC) {
            console.log(`\n* Config file '${deployConfigEnv}' not found, creating a new wallet for deploy..`);
            deployerMnemonic = (yield (0, ton_crypto_1.mnemonicNew)(24)).join(" ");
            const deployWalletEnvContent = `DEPLOYER_WALLET=${deployerWalletType}\nDEPLOYER_MNEMONIC="${deployerMnemonic}"\n`;
            fs_1.default.writeFileSync(deployConfigEnv, deployWalletEnvContent);
            console.log(` - Created new wallet in '${deployConfigEnv}' - keep this file secret!`);
        }
        else {
            console.log(`\n* Config file '${deployConfigEnv}' found and will be used for deployment!`);
            deployerMnemonic = process.env.DEPLOYER_MNEMONIC;
        }
        // open the wallet and make sure it has enough TON
        const walletKey = yield (0, ton_crypto_1.mnemonicToWalletKey)(deployerMnemonic.split(" "));
        // TODO specify wallet type?
        const walletContract = ton_2.WalletContract.create(client, ton_1.WalletV3R1Source.create({ publicKey: walletKey.publicKey, workchain }));
        console.log(` - Wallet address used to deploy from is: ${walletContract.address.toFriendly()}`);
        const walletBalance = yield client.getBalance(walletContract.address);
        if (walletBalance.lt((0, ton_1.toNano)(0.2))) {
            console.log(` - ERROR: Wallet has less than 0.2 TON for gas (${(0, ton_1.fromNano)(walletBalance)} TON), please send some TON for gas first`);
            process.exit(1);
        }
        else {
            console.log(` - Wallet balance is ${(0, ton_1.fromNano)(walletBalance)} TON, which will be used for gas`);
        }
        // go over all the contracts we have deploy scripts for
        const rootContracts = fast_glob_1.default.sync(["build/*.deploy.ts"]);
        for (const rootContract of rootContracts) {
            // deploy a new root contract
            console.log(`\n* Found root contract '${rootContract} - let's deploy it':`);
            const contractName = path_1.default.parse(path_1.default.parse(rootContract).name).name;
            // prepare the init data cell
            const deployInitScript = require(__dirname + "/../" + rootContract);
            if (typeof deployInitScript.initData !== "function") {
                console.log(` - ERROR: '${rootContract}' does not have 'initData()' function`);
                process.exit(1);
            }
            const initDataCell = deployInitScript.initData();
            // prepare the init message
            if (typeof deployInitScript.initMessage !== "function") {
                console.log(` - ERROR: '${rootContract}' does not have 'initMessage()' function`);
                process.exit(1);
            }
            const initMessageCell = deployInitScript.initMessage();
            // prepare the init code cell
            const cellArtifact = `build/${contractName}.cell`;
            if (!fs_1.default.existsSync(cellArtifact)) {
                console.log(` - ERROR: '${cellArtifact}' not found, did you build?`);
                process.exit(1);
            }
            const initCodeCell = ton_1.Cell.fromBoc(fs_1.default.readFileSync(cellArtifact))[0];
            // make sure the contract was not already deployed
            const newContractAddress = (0, ton_2.contractAddress)({ workchain, initialData: initDataCell, initialCode: initCodeCell });
            console.log(` - Based on your init code+data, your new contract address is: ${newContractAddress.toFriendly()}`);
            if (yield client.isContractDeployed(newContractAddress)) {
                console.log(` - Looks like the contract is already deployed in this address, skipping deployment`);
                yield performPostDeploymentTest(rootContract, deployInitScript, walletContract, walletKey.secretKey, newContractAddress);
                continue;
            }
            // deploy by sending an internal message to the deploying wallet
            console.log(` - Let's deploy the contract on-chain..`);
            const seqno = yield walletContract.getSeqNo();
            const transfer = walletContract.createTransfer({
                secretKey: walletKey.secretKey,
                seqno: seqno,
                sendMode: ton_2.SendMode.PAY_GAS_SEPARATLY + ton_2.SendMode.IGNORE_ERRORS,
                order: new ton_1.InternalMessage({
                    to: newContractAddress,
                    value: newContractFunding,
                    bounce: false,
                    body: new ton_1.CommonMessageInfo({
                        stateInit: new ton_1.StateInit({ data: initDataCell, code: initCodeCell }),
                        body: initMessageCell !== null ? new ton_1.CellMessage(initMessageCell) : null,
                    }),
                }),
            });
            yield client.sendExternalMessage(walletContract, transfer);
            console.log(` - Deploy transaction sent successfully`);
            // make sure that the contract was deployed
            console.log(` - Block explorer link: https://${process.env.TESTNET ? "test." : ""}tonwhales.com/explorer/address/${newContractAddress.toFriendly()}`);
            console.log(` - Waiting up to 20 seconds to check if the contract was actually deployed..`);
            for (let attempt = 0; attempt < 10; attempt++) {
                yield sleep(2000);
                const seqnoAfter = yield walletContract.getSeqNo();
                if (seqnoAfter > seqno)
                    break;
            }
            if (yield client.isContractDeployed(newContractAddress)) {
                console.log(` - SUCCESS! Contract deployed successfully to address: ${newContractAddress.toFriendly()}`);
                const contractBalance = yield client.getBalance(newContractAddress);
                console.log(` - New contract balance is now ${(0, ton_1.fromNano)(contractBalance)} TON, make sure it has enough to pay rent`);
                yield performPostDeploymentTest(rootContract, deployInitScript, walletContract, walletKey.secretKey, newContractAddress);
            }
            else {
                console.log(` - FAILURE! Contract address still looks uninitialized: ${newContractAddress.toFriendly()}`);
            }
        }
        console.log(``);
    });
}
main();
// helpers
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function performPostDeploymentTest(rootContract, deployInitScript, walletContract, secretKey, newContractAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        if (typeof deployInitScript.postDeployTest !== "function") {
            console.log(` - Not running a post deployment test, '${rootContract}' does not have 'postDeployTest()' function`);
            return;
        }
        console.log(` - Running a post deployment test:`);
        yield deployInitScript.postDeployTest(walletContract, secretKey, newContractAddress);
    });
}
