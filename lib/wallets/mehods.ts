import { Adapters, Wallet } from "./types";
import { walletService } from "./WalletService";

const createWalletSession = async (adapterId: Adapters, appName: string, onWalletConnect?: (value: Wallet) => void) => {
  try {
    const _session = await walletService.createSession(adapterId, appName);
    awaitReadiness(adapterId, _session, onWalletConnect);
    return _session;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
};

const awaitReadiness = async (adapterId: Adapters, session: any, onWalletConnect?: (value: Wallet) => void) => {
  try {
    const wallet = await walletService.awaitReadiness(adapterId, session);

    localStorage.setItem("wallet:adapter-id", adapterId);
    localStorage.setItem("wallet:session", JSON.stringify(session));
    onWalletConnect && onWalletConnect(wallet);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
};

const killSession = () => {
  localStorage.removeItem("wallet:adapter-id");
  localStorage.removeItem("wallet:session");
};

const restoreSession = async () => {
  const adapterId = localStorage.getItem("wallet:adapter-id") as Adapters;
  const session = localStorage.getItem("wallet:session");

  if (!adapterId || !session) {
    throw new Error("Error while restoring");
  }

  try {
    const wallet = await walletService.awaitReadiness(adapterId, JSON.parse(session));

    return { wallet, adapterId, session: JSON.parse(session) };
  } catch {
    throw new Error("Error while restoring");
  }
};

export { createWalletSession, restoreSession, killSession };
