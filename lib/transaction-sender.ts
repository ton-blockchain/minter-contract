interface ITransactionSender {
    sendTransaction(): Promise<void>;
}

interface IContractDeployer {
    deployContract(): Promise<void>;
}