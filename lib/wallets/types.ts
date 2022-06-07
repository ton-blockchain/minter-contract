import { TransactionDetails } from "../transaction-sender";


export interface TransactionRequest {
  /** Destination */
  to: string;

  /** Amount in nano-tons */
  value: string;

  /** Timeout */
  timeout: number;

  stateInit?: Buffer | null;

  text?: string | null;

  payload: string;
}

export interface Wallet {
    address: string;
    publicKey: string;
    walletVersion: string;
  }

  
export interface WalletAdapter<S> {
  isAvailable(): boolean;
  createSession(name: string): Promise<S>;
  awaitReadiness(session: S): Promise<Wallet>;
  getWallet(session: S): Promise<Wallet>;
  requestTransaction(session: S, request: TransactionDetails, onSuccess?: () => void): Promise<void>;
}

export interface TonWalletProvider {
    isTonWallet: boolean;
    send(method: string, params?: any[]): Promise<any>;
    on(eventName: string, handler: (...data: any[]) => any): void;
  }

export enum Adapters  {
    TON_HUB = 'tonhub',
    TON_WALLET = 'ton-wallet'
}


export interface Adapter {
    text: string,
    type: Adapters,
    mobileCompatible: boolean
}