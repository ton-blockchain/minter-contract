import { TransactionDetails } from "../../transaction-sender";
import { Wallet, WalletAdapter } from "../types";
import {
  Cell,
  CellMessage,
  CommonMessageInfo,
  InternalMessage,
  SendMode,
  TonClient,
  Wallet as TonWallet,
  WalletContract,
  WalletV3R1Source,
} from "ton";
import { mnemonicToWalletKey } from "ton-crypto";

class TonClientAdapter implements WalletAdapter<void> {
  private _tonClient: TonClient;
  private _mnemonic: string[];
  private _wallet_contract: WalletContract;

  constructor(tonClient: TonClient, mnemonic: string[]) {
    this._tonClient = tonClient;
    this._mnemonic = mnemonic;
  }

  isAvailable(): boolean {
    return true;
  }
  async createSession(name: string): Promise<void> {
    const wk = await mnemonicToWalletKey(this._mnemonic);

    this._wallet_contract = WalletContract.create(
      this._tonClient,
      //TODO VER
      WalletV3R1Source.create({
        publicKey: wk.publicKey,
        workchain: 0,
      })
    );
    return Promise.resolve();
  }
  async awaitReadiness(session: void): Promise<Wallet> {

    
    TonWallet.open();
    
    throw new Error("Method not implemented.");
  }
  async getWallet(session: void): Promise<Wallet> {
    throw new Error("Method not implemented.");
  }
  async requestTransaction(
    session: void,
    request: TransactionDetails,
    onSuccess?: () => void
  ): Promise<void> {
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
          body: null,
        }),
      }),
    });

    await this._tonClient.sendExternalMessage(walletContract, transfer);
  }
}
