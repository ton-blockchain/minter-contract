import { Cell } from "ton";
import { TransactionDetails } from "../transaction-sender";
import { TonWalletProvider } from "./ton-connection";

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// TODO: refactor this redundant class

import {  Wallet } from "../types";
const TON_WALLET_EXTENSION_URL =
  "https://chrome.google.com/webstore/detail/ton-wallet/nphplpgoakhhjchkkhmiggakijnkhfnd";

  export interface TonWalletProvider2 {
    isTonWallet: boolean;
    send(method: string, params?: any[]): Promise<any>;
    on(eventName: string, handler: (...data: any[]) => any): void;
  }
  

declare global {
  interface Window {
    ton?: TonWalletProvider2;
  }
}

class TonWalletClient {
  constructor(private readonly window: Window) {}

  private get ton(): TonWalletProvider2 | undefined {
    return this.window.ton;
  }

  get isAvailable(): boolean {
    return !!this.ton?.isTonWallet;
  }

  ready(timeout = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timerId = setInterval(() => {
        if (this.isAvailable) {
          clearInterval(timerId);
          resolve();
        }
      }, 50);

      setTimeout(() => reject(new Error("TON Wallet cannot be initialized")), timeout);
    });
  }

  requestWallets(): Promise<Wallet[]> {
    return this.ton!.send("ton_requestWallets");
  }

  watchAccounts(callback: (accounts: string[]) => void): void {
    this.ton!.on("ton_requestAccounts", callback);
  }

  sign(hexData: string): Promise<string> {
    return this.ton!.send("ton_rawSign", [{ data: hexData }]);
  }

  sendTransaction(options: {
    to: string;
    value: string;
    data?: string;
    dataType?: "boc" | "hex" | "base64" | "text";
    stateInit?: string;
  }): Promise<void> {
    return this.ton!.send("ton_sendTransaction", [options]);
  }
}

if (!global["window"]) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  global["window"] = null;
}

export const tonWalletClient = new TonWalletClient(window);

export class ChromeExtensionWalletProvider implements TonWalletProvider {
  async connect(): Promise<Wallet> {
    try {
      await tonWalletClient.ready();

      const [[wallet]] = await Promise.all([tonWalletClient.requestWallets(), delay(150)]);

      if (!wallet) {
        throw new Error("TON Wallet is not configured.");
      }

      return wallet;
    } catch (error) {
      window.open(TON_WALLET_EXTENSION_URL, "_blank");
      throw error;
    }
  }
  async requestTransaction(request: TransactionDetails, onSuccess?: () => void): Promise<void> {
    const INIT_CELL = new Cell();
    request.stateInit.writeTo(INIT_CELL);
    const b64InitCell = INIT_CELL.toBoc().toString("base64");

    try {
      const res: any = await tonWalletClient.sendTransaction({
        to: request.to.toFriendly(),
        value: request.value.toString(),
        dataType: "boc",
        data: request.message?.toBoc().toString("base64"),
        stateInit: b64InitCell,
      });

      if (!res) {
        throw new Error("Something went wrong");
      } else {
        onSuccess && onSuccess();
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
