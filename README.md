# Jetton deployer contracts

A library for building and deploying [Jettons](https://github.com/ton-blockchain/TIPs/issues/74) on the [Ton blockchain](https://ton.org/)

> Note: This library is in alpha. Use at your own risk.

## Overview
This project contains the necessary components for deploying a jetton token on the ton network.

## Building
1. You should have the latest ton binaries installed. See the [tonstarter-contracts repo for instructions](https://github.com/ton-defi-org/tonstarter-contracts/#dependencies-and-requirements)
2. The contracts in this repo are compatible with the [vanilla jetton contracts](https://github.com/ton-blockchain/token-contract), updated for the func 0.2.0. If you wish to modify them to support different jetton configurations (such as max supply), edit the contract files (jetton-minter.fc and jetton-wallet.fc) as needed.
3. Run `npm run build`

## Deploying
The easiest way is to use the [webapp](https://ton-defi-org.github.io/jetton-deployer-webclient), if you're using vanilla contracts.

If you want to deploy manually and/or change the contract code:

> This part uses the standard method of deploying, as defined in the [tonstarter-contracts repo](https://github.com/ton-defi-org/tonstarter-contracts/#development-instructions)

1. Make sure you have a ton wallet with at least 0.25 TON balance.
1. Edit `jettonParams` in `jetton-minter.deploy.ts` to set the jetton's name, symbol etc.
1. Run `npm run deploy`
