import { Address, TonClient, Wallet } from "ton";

export class TonChromeExtTransactionSender implements ITransactionSender {
    async sendTransaction(): Promise<void> {
        // @ts-ignore
        const ton = window.ton as any;

        const result = await ton.send('ton_requestWallets')

        console.log(result);
    }
}

// EQBod5J-GXAAgXI7OxoOtZRZhrYM9ll7MSpknZ1rPn-LosCz

export class DeployControllerFactory {

    static create(): DeployController {

        const client = new TonClient({
            endpoint: "https://mainnet.tonhubapi.com/jsonRPC" // `https://${process.env.TESTNET ? 'testnet.' : ''}toncenter.com/api/v2/jsonRPC`, 
            // apiKey: process.env.TESTNET ? process.env.TESTNET_API_KEY : process.env.MAINNET_API_KEY
        });

        return new DeployController(
            client,
            new TonChromeExtTransactionSender()
        )
    }

}

export class DeployController {
    #client: TonClient;
    // #contractDeployer: IContractDeployer;
    #transactionSender: ITransactionSender;

    constructor(
        client: TonClient,
        // contractDeployer: IContractDeployer,
        transactionSender: ITransactionSender) {
        this.#client = client;
        // this.#contractDeployer = contractDeployer;
        this.#transactionSender = transactionSender;
    }

    async createJetton(
        ownerAddress: string // TODO address?
    ) {

        await this.#transactionSender.sendTransaction();
        const address = Address.parse(ownerAddress)
        const balance = await this.#client.getBalance(address)

        console.log(balance.toString())

        // this.#client.sendExternalMessage()

        // TODO - how/should we use the deployer here?

        /*
            1. Upload image to IPFS? expose API KEY?
            2. Upload JSON to IPFS?
            3. Deploy contract?
            4. Mint to owner?
        */

        // Assume we've uploaded to IPFS

        // try {
        //     await this.#contractDeployer.deployContract(
        //         this.#transactionSender,
        //         JettonContract.createFrom(jettonDetails, JettonContract.mint(to...))
        //     )
        // } catch(e) {
        //     // TODO deploy-specific errors
        //     throw e;
        // }

        // Assuming contract was deployed with mint

    }


    async #deployContract(params: any) {



    }

}