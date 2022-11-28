# Jetton Deployer - Contracts

> Starter template for a [Jetton](https://github.com/ton-blockchain/TIPs/issues/74) project

This project contains everything you need to deploy a new token (Jetton contract) to TON blockchain. This project is free and open source and was created for educational purposes.

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

This is much more complicated and will allow you to change the actual behavior of the Jetton to any custom behavior you want to program with the [FunC](https://ton.org/docs/#/func) language. For example, let's say you want a special Jetton that pays a 1% fee to some address every time it's transferred between users. Since this behavior is different from the standard, for this option you will need to install the FunC compiler on your machine.

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

* **Jetton Name** - For example: `Bitcoin Cash`<br>Usually 1-3 words, unabbreviated project name with spaces with each word capitalized. Our running example will be the [bitcoincash.org](https://bitcoincash.org) project which is a fork of the Bitcoin token.

* **Jetton Symbol** - For example: `BCH`<br>Usually 3-5 uppercase characters, the currency symbol for the token. This would usually appear next to the amount when the token balance is [displayed](https://img.gadgethacks.com/img/12/13/63649303499825/0/bitcoin-cash-is-now-available-coinbase.w1456.jpg). This would also appear in exchanges where the token is listed as the [ticker](https://www.coingecko.com/en/coins/bitcoin-cash).

* **Decimals** - For example: `9`<br>The decimal precision of your token (9 is TON default). Blockchains store floating point numbers (like 1.2345) as integers with a given precision. Under 9 decimals precision the balance 1.2345 BCH will be encoded as 1234500000 and the smallest balance possible to encode is 0.000000001 BCH which is encoded as 1. The balance 1 BCH is encoded as 1000000000.

* **Tokens to Mint** - For example: `21,000,000`<br>Number of initial tokens to mint and send to your wallet address (float). In our example, let's mint the entire supply as in Bitcoin, 21 million coins. Notice that the value here is a float number and is not encoded according to the decimal precision in the previous field. So for 21,000,000 BCH we will input 21000000 and not 21000000000000000.

* **Description** - For example: `Low fee peer-to-peer electronic cash alternative to Bitcoin`<br>Optional freeform sentence explaining about your project. This can be left empty. Its purpose is to give a little more background detail about the project beyond the name. Don't make this part too long (longer than one sentence) because it's stored on-chain and can get costly.

* **Jetton Logo URI** - For example: `https://bitcoincash-example.github.io/website/logo.png`<br>URL of 256x256 pixel PNG image of the token logo with transparent background. Notice that this logo is not immutable (unlike the rest of the fields) and can be changed in the future of the project as its update poses no security risks to users. It should be placed on hosting where multiple maintainers can be given easy access, which makes GitHub Pages a good solution since it can support multiple community contributors and PRs. The best practice would be this:

    1. Create a new free GitHub organization for your project, you can follow the instructions [here](https://docs.github.com/en/organizations/collaborating-with-groups-in-organizations/creating-a-new-organization-from-scratch). In our example we created the organization `bitcoincash-example` which you can see [here](https://github.com/bitcoincash-example).
    
    2. Under this new organization, create a new public repository with the name `website`, you can follow the instructions [here](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository). In our example you can see the repo [here](https://github.com/bitcoincash-example/website).
    
    3. Upload your PNG image to this repository and enable GitHub Pages on it, you can follow the instructions [here](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository) and then [here](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site). The result should be a live website like https://bitcoincash-example.github.io/website/logo.png where your image is hosted.
    
    4. If you can afford it, we recommend to buy a custom domain for your project like `bitcoincash.org`. Use any domain seller like [Google Domains](https://domains.google/) or [GoDaddy](https://www.godaddy.com/). Then, connect your custom domain to the repository in the previous step, you can follow the instructions [here](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).
    
    5. If you have a custom domain, your image URL should be `https://bitcoincash.org/logo.png` instead of the `github.io` one. This will remove any future dependency on GitHub and allow you to switch hosting in the future which is a good option to keep.

* **Where is this metadata stored?** - [The Jetton standard](https://github.com/ton-blockchain/TIPs/issues/64) supports storing metadata either on-chain or in an off-chain URL (a JSON file hosted somewhere). It is our belief that the best practice is storing metadata on-chain. Why? Let's explore the alternatives:

  * *On-chain* - On-chain data is immutable, users can be guaranteed that important fields like the symbol will not change without their consent. On-chain data is also guaranteed to always be available. This deployer always stores metadata on-chain.
  
  * *Off-chain IPFS* (`ipfs://` URL) - IPFS data is immutable so it's safe like on-chain. But IPFS data is not guaranteed to always be available. Availability depends if someone is willing to pin the data (similar to seeding in torrents). If this someone goes out of business or suffers downtime, token metadata will disappear. This is an unnecessary risk in our eyes.
  
  * *Off-chain website* (`https://` URL) - This is by far the worst option. The owner of the website could change the metadata without user consent (not necessarily on purpose if the website is hacked). The website can also be taken down and the metadata will disappear. Users should never invest money in tokens that have their metadata stored this way.
 
  What about the Jetton Logo URI, if it's stored on a website, can't it change? Yes, it can change and this is a feature. We believe that logos can go through rebranding without putting users at risk. Satoshi Nakamoto didn't design the current logo of Bitcoin when he wrote the initial code.

  I don't see the metadata in a wallet or block explorer, why? Some tools don't support yet the secure on-chain metadata standard. Please open issues with these tools to fix and display on-chain metadata which is supported by the official standard and is the secure way to publish Jettons.

&nbsp;
## Protect yourself and your users

Don't forget that we're dealing with programmable money here. Jettons are tradable and users may end up paying real money for them. It is our responsibility as a community to keep everybody safe.

1. **Never deploy smart contract code that you are unable to review**

    Make sure you understand what you deploy. We went into a lot of effort to make sure everything is open source. The smart contract code that is deployed is available in this repo, you should review it and see that it's compatible with the [official standard version](https://github.com/ton-blockchain/token-contract/tree/main/ft). The HTML form that performs the deployment is [open source](https://github.com/ton-defi-org/jetton-deployer-webclient) as well and served from [GitHub Pages](https://ton-defi-org.github.io/jetton-deployer-webclient) so you can have confidence the source you see is what actually being served. By deploying your Jetton, you are taking full responsibility over what you deploy. This repo is aimed for educational purposes only and provides no guarantees.
    
 2. **Revoke admin role in the Jetton as soon as possible**

    The Jetton code allows a special admin role (the deployer wallet address) to mint new tokens for themselves and change token metadata. This functionality is necessary for the initial launch because that's how new Jettons enter circulation. Once you're finished with minting you must revoke your admin permissions by changing the admin to an empty address. A blockchain ecosystem is designed to be trustless. You should never take responsibility for your users' funds, you don't want a misplaced key on your behalf to permit theft from other people! Revoking the admin role will guarantee that nobody will ever be able to mint new tokens in the future and crush your Jetton price. Please only revoke after you finished doing QA and made sure all the metadata fields are correct! After revoking admin you will not be able to change any of the metadata fields anymore.

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

&nbsp;
## Troubleshooting

1. *I didn't write down my new Jetton's contract address and forgot what it was!*

    Don't worry, we can find your Jetton in a block explorer like tonscan.org. Open https://tonscan.org and go to the address page of the wallet you used to deploy the Jetton (this is the wallet that paid the 0.25 TON deploy fees). We assume that you minted some tokens to this address. In the explorer UI click on the tab named "JETTONS". This will now show you all the Jettons you hold, your new Jetton should be in the list. If you didn't mint any tokens, then just throw this Jetton away and deploy a new one.

2. *I made a mistake with the metadata! I want to change one of the fields*

    You can only change metadata fields until you revoke the admin role. If you didn't revoke the admin yet, open the minter UI and search for your Jetton by address. Once found, connect the wallet that you deployed with. You should have the ability to edit metadata fields in the UI. If you revoked the admin and must change one of the metadata fields due to a mistake, your best course of action is to throw this Jetton away and deploy a new one.
    
3. *Can there be multiple Jettons with the same metadata fields like name, logo and symbol?*

    Yes! Anyone can deploy as many duplicate Jettons as they want with similar metadata. Every Jetton will be deployed on a different address. Jettons are not unique and are very easy to fake. To make sure you're working with the correct Jetton, always compare the address to the official address. If you deployed a Jetton and made a mistake that cannot be recovered, you can always deploy a new one and forget about the old.

4. *I don't see my Jetton's image, it doesn't show!*

    Your Jetton's logo URI is probably invalid. To make sure the URI is working, paste it in your browser. Make sure the URI is not a web page but the URI of the image directly. The URI should end with a .PNG or .JPG extension. If this is not the case, open the website in your browser, right click on the image and select "Copy Image Address". You should now have the correct URI in your clipboard.

5. *My Jetton displays in some wallets/explorers but not in others*

    Some wallets and some explorers don't support the latest standard of Jettons that store metadata securely on-chain. Wallets like TonKeeper and TonHub should be ok and explorers like tonscan.org should be ok. If your Jettons works well in these but doesn't show up in a different wallet/explorer, please open an issue for this developer and ask them to add support for Jettons storing metadata on-chain (this is part of the official standard).

6. *I have a different problem and I don't know what to do*

    We have a friendly community on Telegram that will be happy to help you. Visit https://t.me/ton_minter and ask for help.

&nbsp;
# License
MIT
