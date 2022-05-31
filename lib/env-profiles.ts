interface Env {
    rpcApi: string,
    deepLinkPrefix: string
}

export enum Environments {
    MAINNET,
    TESTNET,
    SANDBOX,
}


export const EnvProfiles = {
    [Environments.SANDBOX]: { rpcApi: "https://sandbox.tonhubapi.com/jsonRPC", deepLinkPrefix: "ton-test" },
    [Environments.TESTNET]: { rpcApi: "http://localhost:8080/https://testnet.toncenter.com/api/v2/jsonRPC", deepLinkPrefix: "n/a" }
};

// "https://testnet-api.scaleton.io"