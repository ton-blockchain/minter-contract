import { Cell } from "ton";
import { TonhubConnector } from "ton-x";
import { TransactionDetails } from "../transaction-sender";

import { TonhubWalletAdapter } from "./adapters/TonhubWalletAdapter";
import { TonWalletWalletAdapter } from "./adapters/TonWalletAdapter";
import { WalletAdapter, TransactionRequest, Wallet, Adapters } from "./types";

const IS_TESTNET = false;

export class WalletService {
  private readonly adapters: Map<string, WalletAdapter<any>> = new Map();

  registerAdapter(adapterId: string, adapter: WalletAdapter<any>) {
    console.log(this.adapters);

    this.adapters.set(adapterId, adapter);
  }

  createSession<S>(adapterId: string, appName: string): Promise<S> {
    const adapter = this.adapters.get(adapterId) as WalletAdapter<S>;
    return adapter.createSession(appName);
  }

  async awaitReadiness<S>(adapterId: string, session: S): Promise<Wallet> {
    const adapter = this.adapters.get(adapterId) as WalletAdapter<S>;
    return adapter.awaitReadiness(session);
  }

  async getWallet<S>(adapterId: string, session: S): Promise<Wallet> {
    const adapter = this.adapters.get(adapterId) as WalletAdapter<S>;
    return adapter.getWallet(session);
  }

  async requestTransaction(adapterId: string, session: any, request: TransactionDetails, onSuccess?: () => void): Promise<void | boolean> {
    const adapter = this.adapters.get(adapterId) as WalletAdapter<S>;

    return adapter.requestTransaction(session, request, onSuccess);
  }
}

export const walletService = new WalletService();

const tonhubConnector = new TonhubConnector({ testnet: IS_TESTNET });

walletService.registerAdapter(Adapters.TON_HUB, new TonhubWalletAdapter(tonhubConnector));
walletService.registerAdapter(Adapters.TON_WALLET, new TonWalletWalletAdapter());
