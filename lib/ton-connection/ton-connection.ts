import { TransactionDetails } from "../transaction-sender";
import { TonClient } from "ton";

export interface Wallet {
  address: string;
  publicKey: string;
  walletVersion: string;
}

export interface TonWalletProvider {
  connect(): Promise<Wallet>;
  requestTransaction(request: TransactionDetails, onSuccess?: () => void): Promise<void>;
}

export class TonConnection {
  private _provider: TonWalletProvider;
  public _tonClient: TonClient; // Future - wrap functionality and make private

  constructor(provider: TonWalletProvider, rpcApi: string) {
    this._provider = provider;
    this._tonClient = new TonClient({ endpoint: rpcApi });
  }

  requestTransaction(request: TransactionDetails, onSuccess?: () => void): Promise<void> {
    return this._provider.requestTransaction(request, onSuccess);
  }
  connect(): Promise<Wallet> {
    return this._provider.connect();
  }
}
