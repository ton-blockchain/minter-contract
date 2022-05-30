interface Env {
    rpcApi: string
}

export enum Environments {
    MAINNET,
    TESTNET,
    SANDBOX,
}


export const EnvProfiles = {
    [Environments.SANDBOX]: { rpcApi: "https://sandbox.tonhubapi.com/jsonRPC" }
};

// "https://testnet-api.scaleton.io"