import { TransactionDetails } from "../transaction-sender";
import { Wallet } from "../wallets/types";
import { TonhubProvider } from "./TonhubProvider";

export interface TonConnectionProvider {
  connect(): Promise<Wallet>;
  requestTransaction(request: TransactionDetails, onSuccess?: () => void): Promise<void>;
}


export class TonConnection {
  private _provider: TonConnectionProvider;

  constructor(provider: TonConnectionProvider) {
    this._provider = provider;
  }

  requestTransaction(request: TransactionDetails, onSuccess?: () => void): Promise<void> {
    return this._provider.requestTransaction(request, onSuccess);
  }
  connect(): Promise<Wallet> {
    return this._provider.connect();
  }
}

(async () => {
  //   const tonhubProv = ;
  // const tonHubCon = new TonConnection(
  //   new TonhubProvider({
  //     onSessionLinkReady: (link) => {},
  //   })
  // );
  // const wallet = await tonHubCon.connect();
  //   const con = new TonConnection(new MnemonicProvider([])); // TODO - allow a persistence provider for reloading etc.
})();
