import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { JettonDeployState, TransactionSender, JettonDeployController, EnvProfiles, Environments, ContractDeployer, TonDeepLinkTransactionSender, ChromeExtensionTransactionSender } from 'tonstarter-contracts';
import {
  RecoilRoot,
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
} from 'recoil';
import { Address, TonClient } from 'ton';
import { JettonDeployParams } from '../../lib/deploy-controller';
// setTimeout(() => {
//   const x = new Module.default()
//   x.createJetton()
// }, 1);


const jettonStateAtom = atom({
  key: 'jettonState', // unique ID (with respect to other atoms/selectors)
  default: {
    state: JettonDeployState.NOT_STARTED,
    contractAddress: null
  }, // default value (aka initial value)
});


function App() {
  return (
    <RecoilRoot>
      <MyComp />
    </RecoilRoot>
  );
}

function MyComp() {


  const [jettonState, setJettonState] = useRecoilState(jettonStateAtom);

  async function deployContract(transactionSender: TransactionSender, addressStr: string, env: Environments) {
    //@ts-ignore
    const ton = window.ton as any;
    const result = await ton.send('ton_requestWallets')

    if (result.length === 0) throw new Error("NO WALLET");

    const dep = new JettonDeployController(
      // @ts-ignore
      new TonClient({ endpoint: EnvProfiles[env.valueOf()].rpcApi }),
      new ContractDeployer(),
      transactionSender
    );

    await dep.createJetton({
      owner: Address.parse(addressStr), // TODO from state. this could come from chrome ext
      mintToOwner: false,
      //@ts-ignore
      onProgress: (depState, err, extra) => setJettonState(oldState => ({ ...oldState, state: depState, contractAddress: depState === JettonDeployState.VERIFY_MINT ? extra : oldState.contractAddress }))
    })

  }

  return (
    <div className="App">
      <header className="App-header">
        <div>
          Jetton: {JettonDeployState[jettonState.state]}
        </div>
        <div>
          {jettonState.contractAddress}
        </div>
        <div>
          <button onClick={async () => {

            await deployContract(
              new TonDeepLinkTransactionSender(EnvProfiles[Environments.SANDBOX].deepLinkPrefix),
              "kQDBQnDNDtDoiX9np244sZmDcEyIYmMcH1RiIxh59SRpKZsb",
              Environments.SANDBOX
            );

          }}>Deploy contract (tonhub)</button>
          <button onClick={async () => {

            // @ts-ignore
            const x = await window.ton!.send('ton_requestWallets')
            await deployContract(new ChromeExtensionTransactionSender(), x[0].address, Environments.TESTNET);

          }}>Deploy contract (chromext)</button>
        </div>
      </header >
    </div >
  )
}

export default App;
