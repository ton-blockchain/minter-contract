// This is a simple generic deploy script in TypeScript that should work for most projects without modification
// Every contract you want to deploy should have a mycontract.deploy.ts script that returns its init data
// The script assumes that it is running from the repo root, and the directories are organized this way:
//  ./build/ - directory for build artifacts (mycontract.cell) and deploy init data scripts (mycontract.deploy.ts)
//  ./build/deploy.config.json - JSON config file with secret mnemonic of deploying wallet (will be created if not found)

import fs from "fs";
import path from "path";
import glob from "fast-glob";
import { Address, Cell, CommonMessageInfo, contractAddress, fromNano, InternalMessage, SendMode, StateInit, toNano, TonClient, WalletContract, WalletV3R2Source } from "ton";
import { mnemonicNew, mnemonicToWalletKey } from "ton-crypto";
import { BN } from "bn.js";

async function main() {
  console.log(`=================================================================`);
  console.log(`Deploy script running, let's find some contracts to deploy..`);

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
  const client = new TonClient({ endpoint: "https://toncenter.com/api/v2/jsonRPC" });
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

    // prepare the init code cell
    const cellArtifact = `build/${contractName}.cell`;
    if (!fs.existsSync(cellArtifact)) {
      console.log(` - ERROR: '${cellArtifact}' not found, did you build?`);
      process.exit(1);
    }
    const initCodeCell = Cell.fromBoc(fs.readFileSync(cellArtifact))[0];

    // deploy by sending an internal message to the deploying wallet
    sleep(1000); // to make sure we don't fail due to throttling
    const newContractAddress = contractAddress({ workchain: 0, initialData: initDataCell, initialCode: initCodeCell });
    console.log(` - About to deploy contract to new address: ${newContractAddress.toFriendly()}`);
    const seqno = await getSeqNo(client, walletContract.address);
    sleep(1000); // to make sure we don't fail due to throttling
    const transfer = await walletContract.createTransfer({
      secretKey: walletKey.secretKey,
      seqno: seqno,
      sendMode: SendMode.PAY_GAS_SEPARATLY + SendMode.IGNORE_ERRORS,
      order: new InternalMessage({
        to: newContractAddress,
        value: new BN(0.5),
        bounce: false,
        body: new CommonMessageInfo({ stateInit: new StateInit({ data: initDataCell, code: initCodeCell }) }),
      }),
    });
    await client.sendExternalMessage(walletContract, transfer);
    console.log(` - Contract deployed successfully!`);
  }

  console.log(``);
}

main();

// helpers

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getSeqNo(client: TonClient, walletAddress: Address) {
  if (await client.isContractDeployed(walletAddress)) {
    let res = await client.callGetMethod(walletAddress, "seqno");
    return parseInt(res.stack[0][1], 16);
  } else {
    return 0;
  }
}
