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
    [Environments.SANDBOX]: { rpcApi: "https://sandbox.tonhubapi.com/jsonRPC", deepLinkPrefix: "ton-test" }
};

// "https://testnet-api.scaleton.io"