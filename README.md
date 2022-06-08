# Jetton deployer
> A library for deploying [Jettons](https://github.com/ton-blockchain/TIPs/issues/74) on the [Ton blockchain](https://ton.org/)

## How to use

> Note: This library is in alpha. Use at your own risk.

1. Instantiate a `JettonDeployController`
   
```
import {
  JettonDeployState,
  JettonDeployController,
  EnvProfiles,
  Environments,
  ContractDeployer,
  WalletService,
} from "jetton-deployer-contracts";

const dep = new JettonDeployController(
  new TonClient({
    endpoint: EnvProfiles[Environments.MAINNET].rpcApi,
  })
);
```

2. Connect an adapter

The adapter is responsible for sending the transcations necessary for creating the jetton contract.

Current supported adapters are:

*  Tonhub (via [ton-x](https://github.com/ton-foundation/ton-x) connector)
*  Ton wallet chrome extension

 However, further adapters can be added (PRs are welcome), for instance a mnemonic-based adapter (useful for CLI applications) which uses ton client directly

Example:
```
import { adapters, createWalletSession } from "jetton-deployer-contracts";
import { Adapters } from "jetton-deployer-contracts/dist/lib/wallets/types";

const session = await createWalletSession(
  Adapters.TON_HUB,
  "your app name",
  onWalletConnect: w => {}
);
```

3. Create the jetton

```
const contractAddress = await dep.createJetton(
  {
    owner: ... // Wallet address of owner, 
    onProgress: (depState, err, extra) => {},
    jettonName: jettonParams.name, 
    jettonSymbol: jettonParams.symbol, 
    amountToMint: toNano(jettonParams.mintAmount),
  },
  new ContractDeployer(),
  Adapters.TON_HUB, 
  session,
  new WalletService()
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