import BN from "bn.js";
import {
  JettonDeployState,
  JettonDeployController,
  EnvProfiles,
  Environments,
  ContractDeployer,
  WalletService,
  TonConnection,
} from "../index";
import { TonClient, Address } from "ton";
import { AdapterTypes } from "../lib/wallets/AdapterFactory";
import { Adapters } from "../lib/wallets/types";
import { MnemonicProvider } from "../lib/ton-connection/MnemonicProvider";

const MNEMONIC = (process.env.MNEMONIC as string).split(" ");

(async () => {
  const tonClient = new TonClient({ endpoint: EnvProfiles[Environments.SANDBOX].rpcApi });
  const dep = new JettonDeployController(tonClient);

  const con = new TonConnection(new MnemonicProvider(MNEMONIC, tonClient));

  const {address} = await con.connect();

  console.log(address);
  
  const addrr = await dep.createJetton(
    {
      amountToMint: new BN(100),
      jettonName: "MyJetton1",
      jettonSymbol: "MYJ",
      owner: Address.parse(address), //Address.parse("kQDBQnDNDtDoiX9np244sZmDcEyIYmMcH1RiIxh59SRpKZsb"),
      onProgress: console.log
    },
    new ContractDeployer(),
    con
  );

  console.log("Jetton address:", addrr.toFriendly());
  
})();
