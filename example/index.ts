import { JettonDeployController, EnvProfiles, Environments, JettonDeployState } from "../index";
import { Address, toNano } from "ton";
import { MnemonicProvider, TonConnection } from "ton-connection";

const MNEMONIC = (process.env.MNEMONIC as string).split(" ");

(async () => {
  const rpcApi = EnvProfiles[Environments.SANDBOX].rpcApi;

  const dep = new JettonDeployController();
  const con = new TonConnection(new MnemonicProvider(MNEMONIC, rpcApi), rpcApi);

  const { address } = await con.connect();

  const minterAddress = await dep.createJetton(
    {
      amountToMint: toNano(100),
      jettonName: "MyJetton",
      jettonSymbol: "MJT6",
      owner: Address.parse(address),
      onProgress: (e) => console.log(JettonDeployState[e]),
    },
    con
  );

  const details = await dep.getJettonDetails(minterAddress, Address.parse(address), con);

  console.log("\nOn-chain contract data:\n", JSON.stringify(details, null, 3));
})();
