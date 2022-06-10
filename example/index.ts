import {
  JettonDeployController,
  EnvProfiles,
  Environments,
  TonConnection,
} from "../index";
import { Address, toNano, TonClient } from "ton";
import { MnemonicProvider } from "../lib/ton-connection/mnemonic-provider";

const MNEMONIC = (process.env.MNEMONIC as string).split(" ");

(async () => {
  // TODO figure out how to find the failing txn
  const rpcApi = EnvProfiles[Environments.SANDBOX].rpcApi;

  const t = new TonClient({endpoint: rpcApi});
  const tx = await t.getTransactions(Address.parse("EQDCuG47RETYOkEdy6m-FuW2OFcIBw0zI7tn04ZZuzZ4PLia"), {limit: 1000});

  console.log(tx);

  return;

  const dep = new JettonDeployController();
  const con = new TonConnection(new MnemonicProvider(MNEMONIC, rpcApi), rpcApi);

  const {address} = await con.connect();

  console.log(address);
  
  const addrr = await dep.createJetton(
    {
      amountToMint: toNano(100),
      jettonName: "MyJetton",
      jettonSymbol: "MJT",
      // owner: Address.parse(address), //Address.parse("kQDBQnDNDtDoiX9np244sZmDcEyIYmMcH1RiIxh59SRpKZsb"),
      owner: Address.parse("kQDBQnDNDtDoiX9np244sZmDcEyIYmMcH1RiIxh59SRpKZsb"),
      onProgress: console.log
    },
    con
  );

  console.log("Jetton address:", addrr.toFriendly());
  
})();
