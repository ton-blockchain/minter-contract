import React, { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from "react-hook-form";
import { FormControl, InputLabel, Input, FormHelperText, TextField } from '@mui/material';

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

const jettonStateAtom = atom({
  key: 'jettonState', // unique ID (with respect to other atoms/selectors)
  default: {
    state: JettonDeployState.NOT_STARTED,
    contractAddress: null,
    jWalletAddress: null
  }, // default value (aka initial value)
});

function App() {
  return (
    <RecoilRoot>
      {/* <MyComp /> */}
      {/* <Formtsy /> */}
      <div className="App">
        <Formtsy2 />
      </div>
    </RecoilRoot>
  );
}

function Formtsy() {

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const onSubmit = (data: any) => console.log(data);

  console.log(watch("example")); // watch input value by passing the name of it

  return (
    /* "handleSubmit" will validate your inputs before invoking "onSubmit" */
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* register your input into the hook by invoking the "register" function */}
      <input defaultValue="test" {...register("example")} />

      {/* include validation with required or other standard HTML validation rules */}
      <input {...register("exampleRequired", { required: true })} />
      {/* errors will return when field validation fails  */}
      {errors.exampleRequired && <span>This field is required</span>}

      <input type="submit" />
    </form>
  );
}

interface JettonForm {
  name?: string,
  symbol?: string,
  initialSupply?: number
  maxSupply?: number
  tokenDecimals?: number
}

enum Networks {
  Mainnet,
  Sandbox,
  Testnet
}

const formSpec = {
  name: {
    title: 'Name',
    helper: 'Choose a name for your token',
    type: 'text',
    default: ''
  },
  symbol: {
    title: 'Symbol',
    helper: 'Choose a symbol for your token (usually 3-5 chars)',
    type: 'text',
    inputStyle: { textTransform: 'uppercase' },
    default: ''
  },
  initialSupply: {
    title: 'Initial supply',
    helper: 'Initial supply of token. usually 0?',
    type: 'number',
    disabled: true,
    default: 0
  },
  maxSupply: {
    title: 'Max supply',
    helper: 'Not yet supported',
    type: 'number',
    disabled: true,
    default: 0
  },
  decimals: {
    title: 'Token decimals',
    helper: 'The decimal precision of your token',
    type: 'number',
    disabled: true,
    default: 9
  },
  network: {
    title: 'Network',
    helper: 'Choose network',
    type: 'select',
    default: Networks.Mainnet,
    options: [Networks.Mainnet, Networks.Sandbox, Networks.Testnet]
  },
}

const defaults: JettonForm = {}

Object.entries(formSpec).forEach(([k, v]) => {
  // @ts-ignore
  defaults[k] = v.default
});

const formStateAtom = atom({
  key: 'formState', // unique ID (with respect to other atoms/selectors)
  default: defaults
});

function Formtsy2() {

  // const { register, handleSubmit, watch, formState: { errors }, control } = useForm();

  // console.log(watch("koko")); // watch input value by passing the name of it
  const [formState, setFormState] = useRecoilState(formStateAtom);

  const formStateSetter = ((e: any, k: string) => {
    setFormState(o => ({ ...o, [k]: e.target.value }));
  });

  return (
    <form style={{ display: 'flex', flexDirection: 'column', gap: 20, width: 500 }}>
      {
        Object.entries(formSpec).map((([k, v]) => {
          //@ts-ignore
          const {disabled, helper, type, title, inputStyle} = formSpec[k];

          if (type) // TODO select

          return <TextField
            key={k}
            onChange={e => { formStateSetter(e, "name") }} 
            // @ts-ignore
            value={formState[k]} disabled={disabled} helperText={helper} type={type} label={title} inputProps={{style: inputStyle}} />
        }))
      }
    </form>

  )
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
              new TonDeepLinkTransactionSender(EnvProfiles[Environments.MAINNET].deepLinkPrefix),
              "EQDerEPTIh0O8lBdjWc6aLaJs5HYqlfBN2Ruj1lJQH_6vcaZ",
              Environments.MAINNET
            );
          }}>Deploy contract (tonhubMAINNET)</button>
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
          <button disabled={jettonState.state !== JettonDeployState.DONE} onClick={async () => {
            const dep = new JettonDeployController(
              // @ts-ignore
              new TonClient({ endpoint: EnvProfiles[Environments.MAINNET].rpcApi }), // TODO!
              new ContractDeployer(),
              new ChromeExtensionTransactionSender() // TODO IRRELEVANT
            );
            const details = await dep.getJettonDetails(
              Address.parse(jettonState.contractAddress!),
              Address.parse("kQDBQnDNDtDoiX9np244sZmDcEyIYmMcH1RiIxh59SRpKZsb")
            )

            setJettonData(JSON.stringify(details, null, 3));
          }}>Get jetton details</button>
          <div>
            <textarea style={{ width: 600, height: 400 }} value={jettonData} readOnly></textarea>
          </div>
        </div>

      </header >
    </div >
  )
}

export default App;


/*
TODOs:
- Testing for lib
- Coverage for project
- Merge web and lib?
- Merge contract tests and libtests?
- Onchain persistence
- Infura IPFS api key? can be later
- Prepare spec
- Improve UI to allow transferring + links to scanners
*/