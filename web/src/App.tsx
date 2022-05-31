import React, { useEffect, useRef, useState } from 'react';
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
import { Address, TonClient, toNano } from 'ton';
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

  const myFile: any = useRef(null);
  const [jettonState, setJettonState] = useRecoilState(jettonStateAtom);
  const [jettonParams, setJettonParams] = useState({
    name: "MyJetton",
    symbol: "JET",
    mintAmount: 100,
    mintToOwner: true
  });
  const [jettonData, setJettonData] = useState("")

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
      onProgress: (depState, err, extra) => setJettonState(oldState => ({ ...oldState, state: depState, contractAddress: depState === JettonDeployState.VERIFY_MINT ? extra : oldState.contractAddress })),
      jettonIconImageData: myFile.current,
      jettonName: jettonParams.name,
      jettonSymbol: jettonParams.symbol,
      amountToMint: toNano(jettonParams.mintAmount)
    })

  }

  function handleChange(e: any, k: string) {
    setJettonParams(o => ({ ...o, [k]: e.target.value }));
  }

  return (
    <div className="App">
      <header className="App-header">
        <div style={{ textAlign: 'left' }}>
          <form>
            <div>Name <input type="text" value={jettonParams.name} onChange={(e) => { handleChange(e, "name") }} /></div>
            <div>Symbol <input type="text" value={jettonParams.symbol} onChange={(e) => { handleChange(e, "symbol") }} /></div>
            <div>Amount to mint <input type="number" value={jettonParams.mintAmount} onChange={(e) => { handleChange(e, "mintAmount") }} /></div>
            <div>Mint to owner <input type="checkbox" defaultChecked disabled /></div>
            <div>
              <input type='file' onChange={(e) => {
                myFile.current = e.target.files![0];
              }} />
            </div>
          </form >
        </div >
        <br />
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

        <br />
        <br />
        <div>
          <button disabled={jettonState.state !== JettonDeployState.DONE} onClick={async ()=>{
            const dep = new JettonDeployController(
              // @ts-ignore
              new TonClient({ endpoint: EnvProfiles[Environments.SANDBOX].rpcApi }), // TODO!
              new ContractDeployer(),
              new ChromeExtensionTransactionSender() // TODO IRRELEVANT
            );
            const details = await dep.getJettonDetails(
              Address.parse(jettonState.contractAddress!),
              Address.parse("kQDBQnDNDtDoiX9np244sZmDcEyIYmMcH1RiIxh59SRpKZsb")
            )

            setJettonData(JSON.stringify(details, null,3));
          }}>Get jetton details</button>
          <div>
            <textarea style={{width: 600, height:400}} value={jettonData}></textarea>
          </div>
        </div>

      </header >
    </div >
  )
}

export default App;
