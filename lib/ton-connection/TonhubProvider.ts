/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Cell, ConfigStore } from "ton";
import { TonhubConnector, TonhubCreatedSession } from "ton-x";
import { TransactionDetails } from "../transaction-sender";
import { Wallet } from "../wallets/types";
import { TonConnectionProvider } from "./ton-connection";

export type TonHubProviderConfig = {
  isSandbox?: boolean | undefined;
  onSessionLinkReady: (session: TonhubCreatedSession) => void;
  persistenceProvider?: PersistenceProvider;
};

export interface PersistenceProvider {
  setItem(key: string, value: string): void;
  getItem(key: string): string | null;
  removeItem(key: string): void;
}

export class TonhubProvider implements TonConnectionProvider {
  private TONHUB_TIMEOUT = 5 * 60 * 1000;
  private ITEM_KEY = "ton_hub_sess";

  private _tonhubConnector: TonhubConnector;
  private _config: TonHubProviderConfig;
  private _session?: TonhubCreatedSession;

  constructor(config: TonHubProviderConfig) {
    this._tonhubConnector = new TonhubConnector({ testnet: config.isSandbox });
    this._config = config;
    const existingSession = this._config.persistenceProvider?.getItem(this.ITEM_KEY);
    try {
      this._session = existingSession && JSON.parse(existingSession);
    } catch (e) {
      this._config.persistenceProvider?.removeItem(this.ITEM_KEY);
    }
  }

  private _setSession(session: TonhubCreatedSession) {
    this._session = session;
    this._config.persistenceProvider?.setItem(this.ITEM_KEY, JSON.stringify(session));
  }

  private _clearSession() {
    this._session = undefined;
    this._config.persistenceProvider?.removeItem(this.ITEM_KEY);
  }

  async requestTransaction(request: TransactionDetails, onSuccess?: () => void): Promise<void> {
    if (!this._session) throw new Error("No session!");

    const state = await this._tonhubConnector.getSessionState(this._session.id);

    if (state.state !== "ready") {
      this._clearSession();
      throw new Error("State is not ready");
    }

    const INIT_CELL = new Cell();
    request.stateInit.writeTo(INIT_CELL);
    const b64InitCell = INIT_CELL.toBoc().toString("base64");

    const response = await this._tonhubConnector.requestTransaction({
      seed: this._session.seed,
      appPublicKey: state.wallet.appPublicKey,
      to: request.to.toFriendly(),
      value: request.value.toString(),
      timeout: 5 * 60 * 1000,
      stateInit: b64InitCell,
      // text: request.text,
      payload: request.message?.toBoc().toString("base64"),
    });

    if (response.type === "rejected") {
      throw new Error("Transaction was rejected.");
    }

    if (response.type === "expired") {
      throw new Error("Transaction was expired.");
    }

    if (response.type === "invalid_session") {
      this._clearSession();
      throw new Error("Something went wrong. Refresh the page and try again.");
    }

    if (response.type === "success") {
      onSuccess && onSuccess();
      // Handle successful transaction
      // const externalMessage = response.response; // Signed external message that was sent to the network
    }
  }
  async connect(): Promise<Wallet> {
    const { location } = document; // TODO consider non-web if makes sense
    let session: TonhubCreatedSession;

    if (!this._session) {
      session = await this._tonhubConnector.createNewSession({
        name: `${location.protocol}//${location.host}`,
        url: "", // TODO: is the url important?
      });

      this._config.onSessionLinkReady(session);
    } else {
      session = this._session;
    }

    const state = await this._tonhubConnector.awaitSessionReady(
      session.id,
      this.TONHUB_TIMEOUT,
      0
    );

    if (state.state === "revoked") {
      this._clearSession();
      throw new Error("Connection was cancelled.");
    }

    if (state.state === "expired") {
      this._clearSession();
      throw new Error("Connection was not confirmed.");
    }

    session && this._setSession(session);

    const walletConfig = new ConfigStore(state.wallet.walletConfig);

    return {
      address: state.wallet.address,
      publicKey: walletConfig.getString("pk"),
      walletVersion: state.wallet.walletType,
    };
  }
}
