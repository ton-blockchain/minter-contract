import { ContractDeployer } from "../lib/contract-deployer";
import { Address, Cell, toNano, TonClient } from "ton";
import { randomAddress } from "./helpers";
import { TransactionDetails, TransactionSender } from "../lib/transaction-sender";
import chai, { expect } from "chai";
import * as sinon from "ts-sinon";
import sinonChai from "sinon-chai";
import { JettonDeployController } from "../lib/deploy-controller";
import * as ton from "ton";

chai.use(sinonChai);

describe("Deploy Controller", () => {
    it("Does smth", async () => {
        const transactionSenderStub = sinon.stubInterface<TransactionSender>();
        const tonClient = sinon.stubConstructor(ton.TonClient, { "endpoint": "" });
        const contractDeployer = sinon.stubConstructor(ContractDeployer);
        // const contractAddr = await new ContractDeployer().deployContract({
        //     deployer: randomAddress("owner"),
        //     value: toNano(0.25),
        //     code: new Cell(),
        //     data: new Cell(),
        // }, transactionSenderStub);
        // expect(transactionSenderStub.sendTransaction).to.have.been.calledOnce;
        // expect(contractAddr.toFriendly()).to.equal("EQCtMet2LmiPwbohV11DWbD5xIc4r2U-FmojMwC9xrKa6fCK");

        const deployController = new JettonDeployController(
            tonClient,
            contractDeployer,
            transactionSenderStub
        );

        await deployController.createJetton({
            amountToMint: toNano(0),
            jettonName: "",
            jettonSymbol: "",
            owner: randomAddress("owner"),
            mintToOwner: false
        });

    });
});