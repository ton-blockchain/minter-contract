import { TonWalletProvider, Wallet } from "../types";




declare global {
  interface Window {
    ton?: TonWalletProvider;
  }
}

export class TonWalletClient {
  constructor(
    private readonly window: Window,
  ) {
  }

  private get ton(): TonWalletProvider | undefined {
    return this.window.ton;
  }

  get isAvailable(): boolean {
    return !!this.ton?.isTonWallet;
  }

  ready(timeout: number = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timerId = setInterval(
        () => {
          if (this.isAvailable) {
            clearInterval(timerId);
            resolve();
          }
        },
        50,
      );

      setTimeout(
        () => reject(new Error('TON Wallet cannot be initialized')),
        timeout,
      );
    });
  }

  requestWallets(): Promise<Wallet[]> {
    return this.ton!.send('ton_requestWallets');
  }

  watchAccounts(callback: (accounts: string[]) => void): void {
    this.ton!.on('ton_requestAccounts', callback);
  }

  sign(hexData: string): Promise<string> {
    return this.ton!.send('ton_rawSign', [
      { data: hexData },
    ]);
  }

  sendTransaction(options: {
    to: string,
    value: string,
    data?: string,
    dataType?: 'boc' | 'hex' | 'base64' | 'text',
    stateInit?: string,
  }): Promise<void> {
    return this.ton!.send('ton_sendTransaction', [options]);
  }
}

export const tonWalletClient = new TonWalletClient(window);
