import { Cell, ConfigStore } from "ton";
import { TonhubConnector } from "ton-x";
import { TonhubCreatedSession } from "ton-x/dist/connector/TonhubConnector";
import { TransactionDetails } from "../../transaction-sender";
import { TransactionRequest, Wallet, WalletAdapter } from "../types";

const TONHUB_TIMEOUT = 5 * 60 * 1000;

export class TonhubWalletAdapter implements WalletAdapter<TonhubCreatedSession> {
  tonhubConnector = new TonhubConnector();
  constructor(testnet?: boolean) {
    this.tonhubConnector = new TonhubConnector({ testnet });
  }

  createSession(name: string): Promise<TonhubCreatedSession> {
    const { location } = document;

    return this.tonhubConnector.createNewSession({
      name: name,
      url: `${location.protocol}//${location.host}`,
    });
  }

  async awaitReadiness(session: TonhubCreatedSession): Promise<Wallet> {
    const state = await this.tonhubConnector.awaitSessionReady(session.id, TONHUB_TIMEOUT, 0);

    if (state.state === "revoked") {
      throw new Error("Connection was cancelled.");
    }

    if (state.state === "expired") {
      throw new Error("Connection was not confirmed.");
    }

    const walletConfig = new ConfigStore(state.wallet.walletConfig);

    return {
      address: state.wallet.address,
      publicKey: walletConfig.getString("pk"),
      walletVersion: state.wallet.walletType,
    };
  }

  getWallet(session: TonhubCreatedSession): Promise<Wallet> {
    return this.awaitReadiness(session);
  }

  async requestTransaction(
    session: TonhubCreatedSession,
    request: TransactionDetails,
    onSuccess?: () => void
  ): Promise<void> {
    const state = await this.tonhubConnector.getSessionState(session.id);

    if (state.state !== "ready") {
      throw new Error("State is not ready");
    }

    const INIT_CELL = new Cell();
    request.stateInit.writeTo(INIT_CELL);
    const b64InitCell = INIT_CELL.toBoc().toString("base64");

    const response = await this.tonhubConnector.requestTransaction({
      seed: session.seed,
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
      throw new Error("Something went wrong. Refresh the page and try again.");
    }

    if (response.type === "success") {
      onSuccess && onSuccess();
      // Handle successful transaction
      // const externalMessage = response.response; // Signed external message that was sent to the network
    }
  }

  isAvailable(): boolean {
    return true;
  }
}
