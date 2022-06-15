# Jetton deployer contracts

A library for building and deploying [Jettons](https://github.com/ton-blockchain/TIPs/issues/74) on the [Ton blockchain](https://ton.org/)

> Note: This library is in alpha. Use at your own risk.

## Building
1. You should have the latest ton binaries installed. See the [tonstarter-contracts repo for instructions](https://github.com/ton-defi-org/tonstarter-contracts/#dependencies-and-requirements)
2. The contracts in this repo are compatible with the [vanilla jetton contracts](https://github.com/ton-blockchain/token-contract), updated for the func 0.2.0. If you wish to modify them to support different jetton configurations (such as max supply), edit the contract files (jetton-minter.fc and jetton-wallet.fc) as needed.
3. Run `npm run build`

## Deploying
### Using jetton-deployer-web webapp (easiest)
1. The easiest way is to use the [webapp](https://github.com/jetton-deployer/jetton-deployer-web) // TODO replace with github.io link
2. If you modified the contract func code:
   * Fork the webapp project
   * Replace the included `jetton-minter.compiled.json` and `jetton-wallet.compiled.json` files

### Deploying manually
