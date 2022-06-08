import { Cell } from "ton";
import { TonhubConnector } from "ton-x";
import { TransactionDetails } from "../transaction-sender";
import { TonChromeExtensionWalletAdapter, TonhubWalletAdapter } from "./adapters";

import { WalletAdapter, Wallet, Adapters } from "./types";

const IS_TESTNET = false;

export class WalletService {
  private readonly adapters: Map<string, WalletAdapter<any>> = new Map();

  registerAdapter(adapterId: string, adapter: WalletAdapter<any>) {
    console.log(this.adapters);

    this.adapters.set(adapterId, adapter);
  }

  constructor() {
    this.registerAdapter(Adapters.TON_WALLET, new TonChromeExtensionWalletAdapter());
    this.registerAdapter(Adapters.TON_HUB, new TonhubWalletAdapter(IS_TESTNET));
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

  async requestTransaction<S>(
    adapterId: string,
    session: any,
    request: TransactionDetails,
    onSuccess?: () => void
  ): Promise<void | boolean> {
    const adapter = this.adapters.get(adapterId) as WalletAdapter<S>;

    return adapter.requestTransaction(session, request, onSuccess);
  }
}

export default WalletService;
