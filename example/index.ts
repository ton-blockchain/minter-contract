import {
  JettonDeployController,
  EnvProfiles,
  Environments,
  TonConnection,
  JettonDeployState,
} from "../index";
import { Address, toNano } from "ton";
import { MnemonicProvider } from "ton-connection";

const MNEMONIC = (process.env.MNEMONIC as string).split(" ");

(async () => {
  const rpcApi = EnvProfiles[Environments.SANDBOX].rpcApi;

  const dep = new JettonDeployController();
  const con = new TonConnection(new MnemonicProvider(MNEMONIC, rpcApi), rpcApi);

  const { address } = await con.connect();

  const addrr = await dep.createJetton(
    {
      amountToMint: toNano(100),
      jettonName: "MyJetton",
      jettonSymbol: "MJT5",
      owner: Address.parse(address),
      onProgress: (e) => console.log(JettonDeployState[e]),
    },
    con
  );

  console.log("Jetton address:", addrr.toFriendly());
})();
