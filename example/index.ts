import {
  JettonDeployController,
  EnvProfiles,
  Environments,
  TonConnection,
} from "../index";
import { Address, Cell, toNano, TonClient } from "ton";
import { MnemonicProvider } from "../lib/ton-connection/mnemonic-provider";

const MNEMONIC = (process.env.MNEMONIC as string).split(" ");

(async () => {
  // TODO figure out how to find the failing txn
  const rpcApi = EnvProfiles[Environments.SANDBOX].rpcApi;

  const t = new TonClient({endpoint: rpcApi});
  const tx = await t.getTransactions(Address.parse("EQDBQnDNDtDoiX9np244sZmDcEyIYmMcH1RiIxh59SRpKSCR"), {limit: 111000});
  console.log(tx[0]);
  const c = Cell.fromBoc(tx[0].inMessage?.body.data!)[0];
  const sl = c.beginParse();
  sl.readUint(32);
  sl.readUint(64);
  console.log(sl.readBit());
  console.log(sl.readBit());
  console.log(sl.readBit());
  console.log(sl.readBit());
  

  return;

  const dep = new JettonDeployController();
  const con = new TonConnection(new MnemonicProvider(MNEMONIC, rpcApi), rpcApi);

  const {address} = await con.connect();

  console.log(address);
  
  const addrr = await dep.createJetton(
    {
      amountToMint: toNano(100),
      jettonName: "MyJetton",
      jettonSymbol: "MJT5",
      // owner: Address.parse(address), //Address.parse("kQDBQnDNDtDoiX9np244sZmDcEyIYmMcH1RiIxh59SRpKZsb"),
      // owner: Address.parse("kQDBQnDNDtDoiX9np244sZmDcEyIYmMcH1RiIxh59SRpKZsb"),
      owner: Address.parse("EQDerEPTIh0O8lBdjWc6aLaJs5HYqlfBN2Ruj1lJQH_6vcaZ"),
      onProgress: console.log
    },
    con
  );

  console.log("Jetton address:", addrr.toFriendly());
  
})();
