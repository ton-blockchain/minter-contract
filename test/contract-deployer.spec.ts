import { ContractDeployer } from "../lib/contract-deployer";
import { Address, Cell, toNano } from "ton";
import { randomAddress } from "./helpers";
import { TransactionDetails, TransactionSender } from "../lib/transaction-sender";
import chai, { expect } from "chai";
import * as sinon from "ts-sinon";
import sinonChai from "sinon-chai";

chai.use(sinonChai);

describe("Contract Deployer", () => {
    it("invokes the transaction sender", async () => {
        const transactionSenderStub = sinon.stubInterface<TransactionSender>();
        const contractAddr = await new ContractDeployer().deployContract({
            deployer: randomAddress("owner"),
            value: toNano(0.25),
            code: new Cell(),
            data: new Cell(),
        }, transactionSenderStub);
        expect(transactionSenderStub.sendTransaction).to.have.been.calledOnce;
        expect(contractAddr.toFriendly()).to.equal("EQCtMet2LmiPwbohV11DWbD5xIc4r2U-FmojMwC9xrKa6fCK");
    });
});