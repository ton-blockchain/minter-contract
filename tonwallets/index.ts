require('dotenv').config();
import { TonClient, Wallet, Address, beginCell, Cell, Slice } from "ton";
import fs from 'fs';
import { KeyPair } from "ton-crypto";
import BN from "bn.js";

const WORKCHAIN = 0;
const TON_0_1 = new BN("100000000");
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

interface WalletJSON {
  address: Address,
  key: KeyPair,
  mnemonic: string[]
}

class WalletSerde {

  private static _walletToFileName = (w: string) => `wallets/${process.env.TESTNET ? 'testnet' : 'mainnet'}/${w}.json`;

  static async createWalletAndSerialize(client: TonClient, walletName: string) {
    const { wallet, mnemonic, key } = await client.createNewWallet({
      workchain: WORKCHAIN,
    });

    fs.writeFileSync(this._walletToFileName(walletName), JSON.stringify({
      address: wallet.address.toFriendly(),
      key,
      mnemonic
    }));
  }

  static deserializeWallet(walletName: string): WalletJSON {
    const walletJSON = JSON.parse(fs.readFileSync(this._walletToFileName(walletName)).toString());
    walletJSON.address = Address.parse(walletJSON.address);
    walletJSON.key.secretKey = Buffer.from(walletJSON.key.secretKey);
    walletJSON.key.publicKey = Buffer.from(walletJSON.key.publicKey);
    return walletJSON;
  }
}

(async () => {
  // Create Client
  const client = new TonClient({
    endpoint: "http://127.0.0.1:4443", // `https://${process.env.TESTNET ? 'testnet.' : ''}toncenter.com/api/v2/jsonRPC`, 
    apiKey: process.env.TESTNET ? process.env.TESTNET_API_KEY : process.env.MAINNET_API_KEY
  });


  async function createWallets() {
    await WalletSerde.createWalletAndSerialize(client, "wallet1");
    await WalletSerde.createWalletAndSerialize(client, "wallet2");
    await WalletSerde.createWalletAndSerialize(client, "wallet3");
  }

  async function readWallets() {
    const walletNames = ["wallet1", "wallet2", "wallet3"];
    const balances = await Promise.all(
      walletNames
        .map(w => (WalletSerde.deserializeWallet(w).address))
        .map(async a => await client.getBalance(a))
    )

    walletNames.forEach((w, i) => {
      console.log(`${w}:${balances[i]}`)
    });

  }

  async function transfer(from: WalletJSON, to: Address, value: BN, client: TonClient) {
    const fromWallet = client.openWalletFromAddress({ source: from.address });
    fromWallet.prepare(0, from.key.publicKey);
    const beforeseqno = (await fromWallet.getSeqNo());
    await fromWallet.transfer({
      seqno: beforeseqno,
      to,
      value,
      bounce: false,
      secretKey: from.key.secretKey
    });

    let seqno = -1;
    let sleepMS = 100;

    while (seqno <= beforeseqno) {
      if (sleepMS > 15000) throw new Error("Unexpected block time finalization");
      console.log(`Awaiting seqno to update. sleeping for ${sleepMS}ms`);
      await sleep(sleepMS);
      seqno = await fromWallet.getSeqNo()
      sleepMS *= 2;
    }
  }

  async function jettonRead() {
    const wallet1 = WalletSerde.deserializeWallet("wallet1");
    const wallet2 = WalletSerde.deserializeWallet("wallet2");

    // await transfer(wallet1, wallet2.address, TON_0_1, client);

    const cell = new Cell();
    cell.bits.writeAddress(wallet1.address);

    // const addressCell = beginCell()
    //   .storeAddress(wallet1.address)
    //   .endCell()

    const cellBoc = (cell.toBoc({ idx: false })).toString('base64');
    
    // @ts-ignore
    const MINTER_CONTRACT_ADDRESS = Address.parse(process.env.TESTNET ? process.env.TESTNET_MINTER_CONTRACT : process.env.MAINNET_MINTER_CONTRACT);

    const res = await client.callGetMethod(
      MINTER_CONTRACT_ADDRESS,
      "get_wallet_address",
      [['tvm.Slice', cellBoc]]
    )

    function bytesToAddress(bufferB64: string): Address {
      const buff = Buffer.from(bufferB64, "base64");
      let c2 = Cell.fromBoc(buff);
      return c2[0].beginParse().readAddress()!;
    }

    // const res = await client.callGetMethod(
    //   MINTER_CONTRACT_ADDRESS,
    //   "get_jetton_data",
    // )

    // JSON - https://api.jsonbin.io/b/628ced3405f31f68b3a53622
    console.log(
      bytesToAddress(res.stack[0][1].bytes).toFriendly()
    ); // TODO figure out bytes to address


  }

  const command = process.argv[2];

  switch ((command ?? '').toLowerCase()) {
    case 'create':
      break;
    case 'balances':
      await readWallets();
      break;
    case 'transfer':
      break;
    case 'jettonread':
      await jettonRead();
      break;
    default:
      throw new Error("Unknown command");
  }

  return



})();


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

