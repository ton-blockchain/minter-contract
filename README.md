# Jetton Deployer - Contracts

> Starter template for a [Jetton](https://github.com/ton-blockchain/TIPs/issues/74) project

This project contains everything you need to deploy a new token (Jetton contract) to TON blockchain.

&nbsp;
## Option 1: Deploy a standard Jetton using your browser

This is by far the simpler option if you want to use the standard Jetton code. You will not need to install any tools on your machine, just open up your web browser, fill-in some data about your token in the HTML form and click deploy.

#### Instructions:

1. Make sure you have a TON wallet with at least 0.25 TON balance. Supported wallets include [TonHub](https://ton.app/wallets/tonhub-wallet) and [Chrome Extension](https://ton.app/wallets/chrome-plugin).

2. Use your web browser to open the site of the deploy form: https://jetton.live

    > Safety Notice: The form is [open source](https://github.com/ton-defi-org/jetton-deployer-webclient) and served from [GitHub Pages](https://ton-defi-org.github.io/jetton-deployer-webclient)

3. Fill in the information about your Jetton in the form - choose a name, ticker and image.

4. Click the "Connect Wallet" button to connect your wallet.

5. Deploy and approve the deploy transaction in your wallet.

6. Once the token is deployed, the deploying wallet will receive all the tokens that were minted.

&nbsp;
## Option 2: Edit the Jetton code to add a custom token behavior

This is much more complicated and will allow you to change the actual behavior of the Jetton to any custom behavior you want to program with the [FunC](https://ton.org/docs/#/func) language. For example, let's say you want a special Jetton that pays a 1% fee to some address every time its transferred between users. For this option you will need to install the FunC compiler on your machine.

> Note: This project is based on the [tonstarter-contracts](https://github.com/ton-defi-org/tonstarter-contracts) repo, consult it if you need more help.

#### Instructions:

1. Make sure you have all "Dependencies and Requirements" as described in [tonstarter-contracts](https://github.com/ton-defi-org/tonstarter-contracts/#dependencies-and-requirements) repo.

2. Git clone the repo locally and rename the directory to your own project name.

3. In the root repo dir, run in terminal `npm install`

4. Edit the smart contract source files to implement your new custom behavior, they're here: `contracts/*.fc`

5. Once you finish coding, build the project by running in the root repo dir `npm run build`

6. If you want to test your code locally, implement TypeScript unit tests here: `test/*.spec.ts`

7. Once your tests are ready, run them by running in the root repo dir `npm run test`

8. Edit your token metadata (like name and ticker) in `jettonParams` in `build/jetton-minter.deploy.ts`

9. Prepare at least 0.25 TON for deployment fees.

9. To deploy the token, run in the root repo dir `npm run deploy` and follow the on-screen instructions.

&nbsp;
## Protect yourself and your users

Don't forget that we're dealing with programmable money here. Jettons are tradable and users may end up paying real money for them. It is our responsibility as a community to keep everybody safe.

1. **Never deploy smart contract code that you are unable to review**

    Make sure you understand what you deploy. We went into a lot of effort to make sure everything is open source. The smart contract code that is deployed is available in this repo, you should review it and see that it's compatible with the [official standard version](https://github.com/ton-blockchain/token-contract/tree/main/ft). The HTML form that performs the deployment is [open source](https://github.com/ton-defi-org/jetton-deployer-webclient) as well and served from [GitHub Pages](https://ton-defi-org.github.io/jetton-deployer-webclient) so you can have confidence the source you see is what actually being served.
    
 2. **Revoke admin role in the Jetton as soon as possible**

    The Jetton code allows a special admin role (the deployer wallet address) to mint new tokens for themselves. This functionality is necessary for the initial launch because that's how new Jettons enter circulation. Once you're finished with minting you must revoke your admin permissions by changing the admin to an empty address. A blockchain ecosystem is designed to be trustless. You should never take responsibility for your user funds, you don't want a misplaced key on your behalf to permit theft from other people! Revoking the admin role will guarantee that nobody will ever be able to mint new tokens in the future and crush your Jetton price.
