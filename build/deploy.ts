// This is a simple generic deploy script in TypeScript that should work for most projects without modification
// Every contract you want to deploy should have a mycontract.deploy.ts script that returns its init data
// The script assumes that it is running from the repo root, and the directories are organized this way:
//  ./build/ - directory for build artifacts (mycontract.cell) and deploy init data scripts (mycontract.deploy.ts)
//  ./build/deploy.config.json - JSON config file with secret mnemonic of deploying wallet (will be created if not found)

import axios from "axios";
import axiosThrottle from "axios-request-throttle";
axiosThrottle.use(axios, { requestsPerSecond: 0.5 }); // required since toncenter jsonRPC limits to 1 req/sec without API key

import fs from "fs";
import path from "path";
import glob from "fast-glob";
import { Cell, CellMessage, CommonMessageInfo, contractAddress, fromNano, InternalMessage, SendMode, StateInit, toNano, TonClient, WalletContract, WalletV3R2Source } from "ton";
import { mnemonicNew, mnemonicToWalletKey } from "ton-crypto";

async function main() {
  console.log(`=================================================================`);
  console.log(`Deploy script running, let's find some contracts to deploy..`);

  // check some global settings
  if (process.env.TESTNET) {
    console.log(`\n* We are deploying to 'testnet' (https://t.me/testgiver_ton_bot will give you test TON)`);
  } else {
    console.log(`\n* We are deploying to 'mainnet'`);
  }

  // make sure we have a wallet mnemonic to deploy from (or create one if not found)
  const deployConfigJson = `build/deploy.config.json`;
  let deployerMnemonic;
  if (!fs.existsSync(deployConfigJson)) {
    console.log(`\n* Config file '${deployConfigJson}' not found, creating a new wallet for deploy..`);
    deployerMnemonic = (await mnemonicNew(24)).join(" ");
    const deployWalletJsonContent = { created: new Date().toISOString(), deployerMnemonic };
    fs.writeFileSync(deployConfigJson, JSON.stringify(deployWalletJsonContent, null, 2));
    console.log(` - Created new wallet in '${deployConfigJson}' - keep this file secret!`);
  } else {
    console.log(`\n* Config file '${deployConfigJson}' found and will be used for deployment!`);
    const deployConfigJsonContent = require(__dirname + "/../" + deployConfigJson);
    if (!deployConfigJsonContent.deployerMnemonic) {
      console.log(` - ERROR: '${deployConfigJson}' does not have the key 'deployerMnemonic'`);
      process.exit(1);
    }
    deployerMnemonic = deployConfigJsonContent.deployerMnemonic;
  }

  // open the wallet and make sure it has enough TON
  const client = new TonClient({ endpoint: `https://${process.env.TESTNET ? "testnet." : ""}toncenter.com/api/v2/jsonRPC` });
  const walletKey = await mnemonicToWalletKey(deployerMnemonic.split(" "));
  const walletContract = WalletContract.create(client, WalletV3R2Source.create({ publicKey: walletKey.publicKey, workchain: 0 }));
  console.log(` - Wallet address used for deployment is: ${walletContract.address.toFriendly()}`);
  const walletBalance = await client.getBalance(walletContract.address);
  if (walletBalance.lt(toNano(1))) {
    console.log(` - ERROR: Wallet has less than 1 TON for gas (${fromNano(walletBalance)} TON), please send some TON for gas first`);
    process.exit(1);
  }

  // go over all the contracts we have deploy scripts for
  const rootContracts = glob.sync(["build/*.deploy.ts"]);
  for (const rootContract of rootContracts) {
    // deploy a new root contract
    console.log(`\n* Found root contract to deploy '${rootContract}':`);
    const contractName = path.parse(path.parse(rootContract).name).name;

    // prepare the init data cell
    const deployInit = require(__dirname + "/../" + rootContract);
    if (typeof deployInit.initData !== "function") {
      console.log(` - ERROR: '${rootContract}' does not have 'initData()' function`);
      process.exit(1);
    }
    const initDataCell = deployInit.initData() as Cell;

    // prepare the init message
    if (typeof deployInit.initMessage !== "function") {
      console.log(` - ERROR: '${rootContract}' does not have 'initMessage()' function`);
      process.exit(1);
    }
    const initMessageCell = deployInit.initMessage() as Cell | null;

    // prepare the init code cell
    const cellArtifact = `build/${contractName}.cell`;
    if (!fs.existsSync(cellArtifact)) {
      console.log(` - ERROR: '${cellArtifact}' not found, did you build?`);
      process.exit(1);
    }
    const initCodeCell = Cell.fromBoc(fs.readFileSync(cellArtifact))[0];

    // make sure the contract was not already deployed
    const newContractAddress = contractAddress({ workchain: 0, initialData: initDataCell, initialCode: initCodeCell });
    console.log(` - Based on your init code+data, your new contract address is: ${newContractAddress.toFriendly()}`);
    if (await client.isContractDeployed(newContractAddress)) {
      console.log(` - Looks like the contract is already deployed in this address, skipping`);
      continue;
    }

    // deploy by sending an internal message to the deploying wallet
    console.log(` - Let's deploy the contract on-chain..`);
    const seqno = await walletContract.getSeqNo();
    const transfer = walletContract.createTransfer({
      secretKey: walletKey.secretKey,
      seqno: seqno,
      sendMode: SendMode.PAY_GAS_SEPARATLY + SendMode.IGNORE_ERRORS,
      order: new InternalMessage({
        to: newContractAddress,
        value: toNano(0.1),
        bounce: false,
        body: new CommonMessageInfo({
          stateInit: new StateInit({ data: initDataCell, code: initCodeCell }),
          body: initMessageCell !== null ? new CellMessage(initMessageCell) : null,
        }),
      }),
    });
    await client.sendExternalMessage(walletContract, transfer);
    console.log(` - Deploy transaction sent successfully`);

    // make sure that the contract was deployed
    console.log(` - Waiting 5 seconds to check if the contract was actually deployed..`);
    await sleep(5000);
    if (await client.isContractDeployed(newContractAddress)) {
      console.log(` - SUCCESS! Contract deployed successfully to address: ${newContractAddress.toFriendly()}`);
    } else {
      console.log(` - FAILURE! Contract address still looks uninitialized: ${newContractAddress.toFriendly()}`);
    }
  }

  console.log(``);
}

main();

// helpers

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
