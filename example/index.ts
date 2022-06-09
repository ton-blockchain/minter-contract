import BN from "bn.js";
import {
  JettonDeployController,
  EnvProfiles,
  Environments,
  TonConnection,
} from "../index";
import { Address } from "ton";
import { MnemonicProvider } from "../lib/ton-connection/mnemonic-provider";

const MNEMONIC = (process.env.MNEMONIC as string).split(" ");

(async () => {
  const rpcApi = EnvProfiles[Environments.SANDBOX].rpcApi;
  const dep = new JettonDeployController();
  const con = new TonConnection(new MnemonicProvider(MNEMONIC, rpcApi), rpcApi);

  const {address} = await con.connect();

  console.log(address);
  
  const addrr = await dep.createJetton(
    {
      amountToMint: new BN(100),
      jettonName: "MyJetton",
      jettonSymbol: "MYJ",
      owner: Address.parse(address), //Address.parse("kQDBQnDNDtDoiX9np244sZmDcEyIYmMcH1RiIxh59SRpKZsb"),
      onProgress: console.log
    },
    con
  );

  console.log("Jetton address:", addrr.toFriendly());
  
})();
