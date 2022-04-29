# TON Starter Template - Contracts

> Starter template for a new TON project - FunC contracts, JS tests, compilation and deployment scripts

## Overview

This project is part of a set of 3 typical repositories needed for a blockchain dapp running on TON blockchain:

* Smart contracts in FunC that are deployed on-chain (this repo)
* Web frontend for interacting with the dapp from a web browser
* Telegram bot for interacting with the dapp from inside Telegram messenger

## What does this repo contain?

* `contracts/*.fc` - Smart contracts for TON blockchain written in [FunC](https://ton.org/docs/#/func) language
* `build/build.ts` - Build script to compile the FunC code to [Fift](https://ton-blockchain.github.io/docs/fiftbase.pdf)
* `build/*.fif` - Output Fift files for every contract that was compiled, not uploaded to git
* `build/deploy.ts` - Deploy script to deploy the compiled code to TON mainnet
* `test/*.spec.ts` - Test suite for the contracts running on [Mocha](https://mochajs.org/) test runner

There is no one official way to develop smart contracts for TON. Every developer has their own best practices. This setup is definitely opinionated and some developers may not appreciate the choices made. Nevertheless, we stand by every choice made here and believe that this is the optimal setup to develop fully tested contracts in the most seamless way possible.

Some of the opinionated choices made here include:

* Strong belief in tests - contracts often manage money - they must be developed under high scrutiny
* Clear and documented code to help users audit the contracts sources and understand what they do
* Reliance on modern TypeScript to develop clean and typed scripts and tests in a modern framework
* Reliance on TypeScript for deployment instead of working with `fift` CLI tools - it's simply easier
* Tests are executed in JavaScript with TVM in web-assembly - a great balance of speed and convenience
* Following of the TON contract [best practices](https://ton.org/docs/#/howto/smart-contract-guidelines) appearing in the official docs

## Dependencies and requirements

To setup your machine for development, please make sure you have the following:

* A modern version of Node.js
  * Installation instructions can be found [here](https://nodejs.org/)
  * Run in terminal `node -v` to verify your installation, the project was tested on `v17.3.0`
* The `func` CLI tool (FunC compiler)
  * Installation instructions can be found [here](https://github.com/ton-defi-org/ton-binaries)
  * Run in terminal `func -V` to verify your installation
* A decent IDE with FunC and TypeScript support
  * We recommend using [Visual Studio Code](https://code.visualstudio.com/) with the [FunC plugin](https://marketplace.visualstudio.com/items?itemName=tonwhales.func-vscode) installed

## Development instructions

* Install
  * Git clone the repo locally and rename the directory to your own project name
  * In the root repo dir, run in terminal `npm install`

* Develop
  * FunC contracts are located in `contracts/*.fc`
    * Standalone root contracts are located in `contracts/*.fc` and imported utility code in `contracts/lib/*.fc`
    * This structure assists with build and deployment and assumed by the included scripts
  * Tests are located in `test/*.spec.ts`

* Build
  * In the root repo dir, run in terminal `npm run build`
  * Compilation errors will appear on screen

* Test
  * In the root repo dir, run in terminal `npm run test`
  * Make sure to build before running tests

* Deploy
  * In the root repo dir, run in terminal `npm run deploy`
  * Follow the on-screen instructions to deploy to mainnet