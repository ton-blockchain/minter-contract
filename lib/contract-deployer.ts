import { TransactionSender } from "./transaction-sender";
import { ContractDeployDetails } from "./deploy-controller";
import BN from "bn.js";
import { Address, Cell, contractAddress, StateInit } from "ton";

// export class DeployControllerFactory {
//     static create(): DeployController {
//         const client = new TonClient({
//             endpoint: "https://mainnet.tonhubapi.com/jsonRPC" // `https://${process.env.TESTNET ? 'testnet.' : ''}toncenter.com/api/v2/jsonRPC`, 
//             // apiKey: process.env.TESTNET ? process.env.TESTNET_API_KEY : process.env.MAINNET_API_KEY
//         });
//         return new DeployController(
//             client,
//             new MyContractDeployer(),
//             new TonChromeExtTransactionSender(),
//         )
//     }
// }

interface ContractDeployDetails {
    deployer: Address,
    value: BN,
    code: Cell,
    data: Cell,
    message?: any // TODO
}

export class ContractDeployer {
    async deployContract(contract: ContractDeployDetails, transactionSender: TransactionSender): Promise<void> {
        const minterAddress = contractAddress({ workchain: 0, initialData: contract.data, initialCode: contract.code });

        await transactionSender.sendTransaction({
            to: minterAddress,
            value: contract.value,
            stateInit: new StateInit({ data: contract.data, code: contract.code }),
            message: null
        });
    }
}