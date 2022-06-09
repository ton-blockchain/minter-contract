import { Cell, CellMessage, CommonMessageInfo, InternalMessage, SendMode, TonClient, WalletContract, WalletV3R1Source } from "ton";
import { mnemonicToWalletKey } from "ton-crypto";
import { TransactionDetails } from "../transaction-sender";
import { Wallet } from "../wallets/types";
import { TonWalletProvider } from "./ton-connection";

export class MnemonicProvider implements TonWalletProvider {
  private _mnemonic: string[];
  private _tonClient: TonClient;
  constructor(mnemonic: string[], rpcApi: string) {
    this._mnemonic = mnemonic;
    this._tonClient = new TonClient({endpoint: rpcApi});
  }
  async requestTransaction(request: TransactionDetails, onSuccess?: () => void): Promise<void> {
    const wk = await mnemonicToWalletKey(this._mnemonic);
    
    const walletContract = WalletContract.create(
      this._tonClient,
      //TODO VER
      WalletV3R1Source.create({
        publicKey: wk.publicKey,
        workchain: 0,
      })
    );
    
    const seqno = await walletContract.getSeqNo();
    const INIT_CELL = new Cell();

    request.stateInit.writeTo(INIT_CELL);

    const ENC: any = {
      "+": "-",
      "/": "_",
      "=": ".",
    };
    const b64InitCell = INIT_CELL.toBoc()
      .toString("base64")
      .replace(/[+/=]/g, (m) => {
        return ENC[m];
      });

    const c0 = INIT_CELL.refs[1].beginParse();
    c0.readCoins();
    console.log(c0.readAddress()?.toFriendly());

    const transfer = walletContract.createTransfer({
      secretKey: wk.secretKey,
      seqno: seqno,
      sendMode: SendMode.PAY_GAS_SEPARATLY + SendMode.IGNORE_ERRORS,
      order: new InternalMessage({
        to: request.to,
        value: request.value,
        bounce: false,
        body: new CommonMessageInfo({
          stateInit: new CellMessage(Cell.fromBoc(Buffer.from(b64InitCell, "base64"))[0]),
          body: request.message && new CellMessage(request.message),
        }),
      }),
    });

    await this._tonClient.sendExternalMessage(walletContract, transfer);
  }
  async connect(): Promise<Wallet> {
    const wk = await mnemonicToWalletKey(this._mnemonic);
    
    const walletContract = WalletContract.create(
      this._tonClient,
      //TODO VER
      WalletV3R1Source.create({
        publicKey: wk.publicKey,
        workchain: 0,
      })
    );

    return {
      address: walletContract.address.toFriendly(),
      publicKey: wk.publicKey.toString("hex"),
      walletVersion: "PROBLEM" 
    };
  }
}
