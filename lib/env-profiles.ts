interface Env {
  rpcApi: string;
  deepLinkPrefix: string;
}

export enum Environments {
  MAINNET,
  TESTNET,
  SANDBOX,
}

export const EnvProfiles = {
  [Environments.MAINNET]: { rpcApi: "https://scalable-api.tonwhales.com/jsonRPC", deepLinkPrefix: "ton" },
  [Environments.TESTNET]: { rpcApi: "http://localhost:8080/https://testnet.toncenter.com/api/v2/jsonRPC", deepLinkPrefix: "n/a" },
  [Environments.SANDBOX]: { rpcApi: "https://sandbox.tonhubapi.com/jsonRPC", deepLinkPrefix: "ton-test" },
};

// "https://testnet-api.scaleton.io"
