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
    state: JettonDeployState.NOT_STARTED
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

  async function deployContract(transactionSender: TransactionSender) {
    //@ts-ignore
    const ton = window.ton as any;
    const result = await ton.send('ton_requestWallets')

    if (result.length === 0) throw new Error("NO WALLET");

    const dep = new JettonDeployController(
      new TonClient({ endpoint: EnvProfiles[Environments.SANDBOX].rpcApi }),
      new ContractDeployer(),
      transactionSender
    );

    await dep.createJetton({
      owner: Address.parse("kQDBQnDNDtDoiX9np244sZmDcEyIYmMcH1RiIxh59SRpKZsb"), // TODO from state. this could come from chrome ext
      mintToOwner: false,
      onProgress: depState => setJettonState(oldState => ({...oldState, state: depState}))
    })

  }

  return (
    <div className="App">
      <header className="App-header">
        <div>
          Jetton: {JettonDeployState[jettonState.state]} {process.env.REACT_APP_NOT_SECRET_CODE}
        </div>
        <div>
          <button onClick={deployContract.bind(null, new TonDeepLinkTransactionSender(EnvProfiles[Environments.SANDBOX].deepLinkPrefix))}>Deploy contract (tonhub)</button>
          <button onClick={deployContract.bind(null, new ChromeExtensionTransactionSender())}>Deploy contract (chromext)</button>
        </div>
      </header>
    </div>
  )
}

export default App;
