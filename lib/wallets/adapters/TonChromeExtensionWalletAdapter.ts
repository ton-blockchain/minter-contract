import { Cell } from "ton";
import { TransactionDetails } from "../../transaction-sender";
import { tonWalletClient } from "../clients/TonWalletClient";
import { TON_WALLET_EXTENSION_URL } from "../config";
import { TransactionRequest, Wallet, WalletAdapter } from "../types";

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export class TonChromeExtensionWalletAdapter implements WalletAdapter<boolean> {
  async createSession(): Promise<boolean> {
    try {
      await tonWalletClient.ready(150);
      return true;
    } catch (error) {
      window.open(TON_WALLET_EXTENSION_URL, "_blank");
      throw error;
    }
  }

  async awaitReadiness(session: boolean): Promise<Wallet> {
    await tonWalletClient.ready();

    const [[wallet]] = await Promise.all([tonWalletClient.requestWallets(), delay(150)]);

    if (!wallet) {
      throw new Error("TON Wallet is not configured.");
    }

    return wallet;
  }

  getWallet(session: boolean): Promise<Wallet> {
    return this.awaitReadiness(session);
  }

  isAvailable(): boolean {
    return !!(window as any).ton?.isTonWallet;
  }

  async requestTransaction(
    _session: any,
    request: TransactionDetails,
    onSuccess?: () => void
  ): Promise<void> {
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
