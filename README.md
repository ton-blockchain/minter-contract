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

10. To deploy the token, run in the root repo dir `npm run deploy` and follow the on-screen instructions.

&nbsp;
## Jetton metadata field best practices
* **Jetton Name** - 1-3 words usually, unabbreviated project name with spaces with each word capitalized. For example, for bitcoincash.org use `Bitcoin Cash`


&nbsp;
## Protect yourself and your users

Don't forget that we're dealing with programmable money here. Jettons are tradable and users may end up paying real money for them. It is our responsibility as a community to keep everybody safe.

1. **Never deploy smart contract code that you are unable to review**

    Make sure you understand what you deploy. We went into a lot of effort to make sure everything is open source. The smart contract code that is deployed is available in this repo, you should review it and see that it's compatible with the [official standard version](https://github.com/ton-blockchain/token-contract/tree/main/ft). The HTML form that performs the deployment is [open source](https://github.com/ton-defi-org/jetton-deployer-webclient) as well and served from [GitHub Pages](https://ton-defi-org.github.io/jetton-deployer-webclient) so you can have confidence the source you see is what actually being served. By deploying your Jetton, you are taking full responsibility over what you deploy. This repo is aimed for educational purposes only and provides no guarantees.
    
 2. **Revoke admin role in the Jetton as soon as possible**

    The Jetton code allows a special admin role (the deployer wallet address) to mint new tokens for themselves. This functionality is necessary for the initial launch because that's how new Jettons enter circulation. Once you're finished with minting you must revoke your admin permissions by changing the admin to an empty address. A blockchain ecosystem is designed to be trustless. You should never take responsibility for your user funds, you don't want a misplaced key on your behalf to permit theft from other people! Revoking the admin role will guarantee that nobody will ever be able to mint new tokens in the future and crush your Jetton price.

## Q&A: Is this contract deployer safe?

Yes! Contract deployers that look like this are the safest you can get. This is actually the reason we implemented this deployer, to prevent people from getting hurt. Let's go over all the questions that **you should ask yourself** before using any deployer:

1. *Are you making any money from this deployer? What's your business model? Why did you make it?*

    No. This is a community project that is 100% open source. It's completely free to use and there is no business model. Because it's open source anyone can copy it. The reason we made it is to keep people safe. We are TON ecosystem contributors that want TON to succeed.

2. *Do you have access to my token? Will you be able to mint my tokens to yourself and sell them?*

    No. This deployer uses the [standard Jetton code](https://github.com/ton-blockchain/token-contract/tree/main/ft) published by TON foundation. The standard code has only one special admin address that can mint tokens. This admin address is your deployer wallet address (your wallet that pays the deploy fees).
    
3. *How can I check that you're actually using the standard Jetton smart contract code in this deployer?*

    This deployer is open source so you can compare the code yourself. The standard Jetton code is [here](https://github.com/ton-blockchain/token-contract/tree/main/ft) - notice the TON blockchain repo. The code in this deployer is [here](https://github.com/ton-defi-org/jetton-deployer-contracts/tree/main/contracts).
    
4. *I'm using the HTML form to deploy from my browser, how can I be sure it's deploying the contract source code in the repo?*

    The HTML form is also open source, you can see the compiled smart contract bytecode that it is deploying [here](https://github.com/ton-defi-org/jetton-deployer-webclient/tree/main/src/lib/contracts). You can build the FunC source code by yourself by cloning the [contract repo](https://github.com/ton-defi-org/jetton-deployer-contracts) and building it by running `npm install` and then `npm run build`. Then compare the build output in the `/build` directory.
    
5. *How can I be sure that the website I visit in my browser is actually serving the HTML source code in the repo?*

    If you use the website to deploy, notice that the website is served by GitHub Pages - a cool service by GitHub that allows to serve websites directly from open source repos. The GitHub Actions that build the website are [here](https://github.com/ton-defi-org/jetton-deployer-webclient/tree/main/.github/workflows) and you can see that the repo name leads to the custom domain - https://ton-defi-org.github.io/jetton-deployer-webclient
    
6. *Does this deployer use any hidden backend servers that I don't have access to and the community can't audit?*

    No. We went into a lot of effort to make this tool as trustless as possible. There are no backend services. The entire deployer runs client side in your browser so the community can audit every aspect of it.

7. *I'm not technical enough to understand all the answers here, how can I still be confident you're telling the truth?*

    If you can't audit everything by yourself, rely on other people in your community. Since this deployer is fully open source, anyone has access to it. We encourage technical people in the community to verify every aspect and let the community know if we missed anything by accident. The best way to feel confident that someone is telling the truth is that they offer 100% transparency.
    
8. *What happens if somebody hacks my wallet in the future, would this hacker be able to steal from users of my token?*

    No, if you follow our advice. The best practice is to deploy a token that even you can't control. This means that even if you make a mistake in the future and your personal wallet gets hacked, your token users will still be safe. The first thing we're doing is storing all token metadata (like name and ticker) on-chain. Some deployers host this info in a JSON file on an external URL. This is very dangerous because if somebody ever hacks the website that holds the JSON - they would be able to change the ticker and destroy the token. Storing the metadata on-chain guarantees that it could never change. Second, after you finish minting the initial supply of your token, we encourage you to revoke the admin account to prevent any future minting. This means that even if your deployer wallet gets hacked, the hacker will not be able to mint and harm your token users.
