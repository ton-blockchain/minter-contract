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

enum JettonState {
  NADA,
  IMG_IPFS_DEPLOYED,
  JSON_IPFS_DEPLOYED,
  MINTER_DEPLOYED,
  MINT_COMPLETED
}
const jettonStateAtom = atom({
  key: 'jettonState', // unique ID (with respect to other atoms/selectors)
  default: {
    state: JettonState.NADA
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
  useEffect(() => {
    console.log('hi')
    setTimeout(() => {
      setJettonState(oldState => ({ ...oldState, state: oldState.state + 1 }));
    }, 1000);
  }, [])

  const [jettonState, setJettonState] = useRecoilState(jettonStateAtom);

  async function deployContract(transactionSender: TransactionSender) {
    console.log('clicked')

    //@ts-ignore
    const ton = window.ton as any;
    const result = await ton.send('ton_requestWallets')

    if (result.length === 0) throw new Error("NO WALLET");


    // await DeployControllerFactory.create().createJetton(
    //   result[0].address
    // )

    const dep = new JettonDeployController(
      new TonClient({ endpoint: EnvProfiles[Environments.SANDBOX].rpcApi }),
      new ContractDeployer(),
      transactionSender
    );

    await dep.createJetton({
      owner: Address.parse("kQDBQnDNDtDoiX9np244sZmDcEyIYmMcH1RiIxh59SRpKZsb"), // TODO from state. this could come from chrome ext
      mintToOwner: false,
      onProgress: state => console.log(JettonDeployState[state])
    })

  }

  return (
    <div className="App">
      <header className="App-header">
        <div>
          Jetton: {JSON.stringify(jettonState)} {process.env.REACT_APP_NOT_SECRET_CODE}
        </div>
        <div>
          <button onClick={deployContract.bind(null, new TonDeepLinkTransactionSender())}>Deploy contract (tonhub)</button>
          <button onClick={deployContract.bind(null, new ChromeExtensionTransactionSender())}>Deploy contract (chromext)</button>
        </div>
      </header>
    </div>
  )
}

export default App;
