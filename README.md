# Jetton deployer
> A library for deploying [Jettons](https://github.com/ton-blockchain/TIPs/issues/74) on the [Ton blockchain](https://ton.org/)

## How to use

> Note: This library is in alpha. Use at your own risk.

1. Instantiate a `JettonDeployController`
   
```
const dep = new JettonDeployController();
```

2. Connect a wallet provider

The provider is responsible for sending the transcations necessary for creating the jetton contract.

Current supported wallet providers are:

*  Tonhub (via [ton-x](https://github.com/ton-foundation/ton-x) connector)
*  Ton wallet chrome extension
*  Mnemonic-based provider

 Further providers can be added (PRs are welcome).

Example:
```
const tonHubCon = new TonConnection(
  new TonhubProvider({
    isSandbox: true,
    onSessionLinkReady: (session) => {
      // For example, display `session.link` as a QR code for the mobile tonhub wallet to scan
    },
    persistenceProvider: localStorage, // If you want the persist the session
  }),
  EnvProfiles[Environments.SANDBOX].rpcApi
);
const wallet = await tonHubCon.connect(); // Get wallet details
```

1. Create the jetton

```
const contractAddress = await dep.createJetton(
  {
    owner: ... // Wallet address of owner, 
    onProgress: (depState, err, extra) => {},
    jettonName: jettonParams.name, 
    jettonSymbol: jettonParams.symbol, 
    amountToMint: toNano(jettonParams.mintAmount),
  },
  tonHubCon
);
```

## Building jetton contracts from source

The library relies on precompiled jetton contracts. Their source code is available at contracts/jetton-minter.fc and contracts/jetton-wallet.fc.

The contract code can be modified and built using `npm run build`, which will generate compiled code as hex to be consumed by the deployer.

To build, follow instructions at `https://github.com/ton-defi-org/tonstarter-contracts`. 

## Running on web
In order to use this package with a web app, a node-compatible buffer library should be available. (See [buffer](https://www.npmjs.com/package/buffer))

See example at https://github.com/jetton-deployer/jetton-deployer-web

## Roadmap

* Support max supply tokens
* Support minting to different addresses

## Test

  - In the root repo dir, run in terminal `npm run test`
  - Don't forget to build (or rebuild) before running tests
  - Tests are running inside Node.js by running TVM in web-assembly using `ton-contract-executor`