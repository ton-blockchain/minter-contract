import { ContractDeployer } from '../lib/contract-deployer';
import { Address, Cell, toNano } from 'ton';
import { randomAddress } from './helpers';
import { TransactionDetails, TransactionSender } from '../lib/transaction-sender';
import { expect } from 'chai';

class MockTransactionSender implements TransactionSender {
    sendTransaction(transactionDetails: TransactionDetails): Promise<void> {
        // throw new Error('Method not implemented.');
    }
}

describe("Contract Deployer", () => {

    it("invokes the transaction sender", async () => {
        const x = await new ContractDeployer().deployContract({
            deployer: randomAddress("owner"),
            value: toNano(0.25),
            code: new Cell(),
            data: new Cell()
        }, new MockTransactionSender())
        expect(x.toFriendly()).to.equal("koko");
    });

});