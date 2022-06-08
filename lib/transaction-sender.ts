import BN from "bn.js";
import { Address, Cell, CellMessage, CommonMessageInfo, InternalMessage, SendMode, StateInit, TonClient, WalletContract, WalletV3R1Source } from "ton";
import { mnemonicToWalletKey } from "ton-crypto";

export interface TransactionDetails {
  to: Address;
  value: BN;
  stateInit: StateInit;
  message?: Cell;
}

export interface TransactionSender {
  sendTransaction(transactionDetails: TransactionDetails): Promise<void>;
}

export class ChromeExtensionTransactionSender implements TransactionSender {
  async sendTransaction(transactionDetails: TransactionDetails): Promise<void> {
    // @ts-ignore
    const ton = window.ton as any;
    if (!ton) throw new Error("Missing ton chrome extension");

    const INIT_CELL = new Cell();
    transactionDetails.stateInit.writeTo(INIT_CELL);
    const b64InitCell = INIT_CELL.toBoc().toString("base64");

    ton.send("ton_sendTransaction", [
      {
        to: transactionDetails.to.toFriendly(),
        value: transactionDetails.value.toString(),
        data: transactionDetails.message?.toBoc().toString("base64"),
        dataType: "boc",
        stateInit: b64InitCell,
      },
    ]);
  }
}

// TODO handle message
// TODO this resembles the ton-starter deployer. we can perhaps utilize this
export class PrivKeyTransactionSender implements TransactionSender {
  #mnemonic: string[];
  #tonClient: TonClient;

  constructor(mnemonic: string[], tonClient: TonClient) {
    this.#mnemonic = mnemonic;
    this.#tonClient = tonClient;
  }

  async sendTransaction(transactionDetails: TransactionDetails): Promise<void> {
    // TODO: think where the client should come from

    const wk = await mnemonicToWalletKey(this.#mnemonic);

    const walletContract = WalletContract.create(
      this.#tonClient,
      WalletV3R1Source.create({
        publicKey: wk.publicKey,
        workchain: 0,
      })
    );

    const seqno = await walletContract.getSeqNo();
    const INIT_CELL = new Cell();
    transactionDetails.stateInit.writeTo(INIT_CELL);

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
        to: transactionDetails.to,
        value: transactionDetails.value,
        bounce: false,
        body: new CommonMessageInfo({
          stateInit: new CellMessage(Cell.fromBoc(Buffer.from(b64InitCell, "base64"))[0]),
          body: null,
        }),
      }),
    });

    await this.#tonClient.sendExternalMessage(walletContract, transfer);
  }
}

export class TonDeepLinkTransactionSender implements TransactionSender {
  #deepLinkPrefix: string;

  constructor(deepLinkPrefix: string) {
    this.#deepLinkPrefix = deepLinkPrefix;
  }

  #encodeBase64URL(buffer: Buffer): string {
    const ENC: any = {
      "+": "-",
      "/": "_",
      "=": ".",
    };
    return buffer.toString("base64").replace(/[+/=]/g, (m) => {
      return ENC[m];
    });
  }

  async sendTransaction(transactionDetails: TransactionDetails): Promise<void> {
    if (!global["open"]) throw new Error("Missing open url web API. Are you running in a browser?");

    const INIT_CELL = new Cell();
    transactionDetails.stateInit.writeTo(INIT_CELL);
    const b64InitCell = this.#encodeBase64URL(INIT_CELL.toBoc());

    let link = `${this.#deepLinkPrefix}://transfer/${transactionDetails.to.toFriendly()}?amount=${transactionDetails.value}&init=${b64InitCell}`;

    if (transactionDetails.message) {
      const b64MsgCell = this.#encodeBase64URL(transactionDetails.message.toBoc());
      link = `${link}&bin=${b64MsgCell}`;
    }

    open(link);
  }
}
