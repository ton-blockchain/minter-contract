import { Address, TonClient, Wallet } from "ton";

class DeployController {
    #client: TonClient;
    #contractDeployer: IContractDeployer;
    #transactionSender: ITransactionSender;

    constructor(client: TonClient, contractDeployer: IContractDeployer, transactionSender: ITransactionSender) {
        this.#client = client;
        this.#contractDeployer = contractDeployer;
        this.#transactionSender = transactionSender;
    }

    async createJetton(ownerAddress: Address) {
        // this.#client.sendExternalMessage()

        // TODO - how/should we use the deployer here?
        
        /*
            1. Upload image to IPFS?
            2. Upload JSON to IPFS?
            3. Deploy contract?
            4. Mint to owner?
        */

        // Assume we've uploaded to IPFS
        
        try {
            await this.#contractDeployer.deployContract(
                this.#transactionSender,
                JettonContract.createFrom(jettonDetails, JettonContract.mint(to...))
            )
        } catch(e) {
            // TODO deploy-specific errors
            throw e;
        }

        // Assuming contract was deployed with mint

    }


    async #deployContract(params: any) {



    }

}