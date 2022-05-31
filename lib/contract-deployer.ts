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
    dryRun?: boolean
}

export class ContractDeployer {
    async deployContract(params: ContractDeployDetails, transactionSender: TransactionSender): Promise<Address> {
        const _contractAddress = contractAddress({ workchain: 0, initialData: params.data, initialCode: params.code });

        if (!params.dryRun) {
            await transactionSender.sendTransaction({
                to: _contractAddress,
                value: params.value,
                stateInit: new StateInit({ data: params.data, code: params.code }),
                message: null
            });
        }

        return _contractAddress
    }
}