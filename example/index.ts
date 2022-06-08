import {
  JettonDeployState,
  JettonDeployController,
  EnvProfiles,
  Environments,
  ContractDeployer,
  WalletService,
} from "jetton-deployer-contracts";
import { Adapters } from "jetton-deployer-contracts/dist/lib/wallets/types";
import { TonClient, Address } from "ton";

(async () => {
  const tonClient = new TonClient({ endpoint: EnvProfiles[Environments.SANDBOX].rpcApi });
  const dep = new JettonDeployController(tonClient);

  await dep.createJetton(
    {
      amountToMint: 100,
      jettonName: "MyJetton",
      jettonSymbol: "MYJ",
      owner: Address.parse("kQDBQnDNDtDoiX9np244sZmDcEyIYmMcH1RiIxh59SRpKZsb"),
    },
    new ContractDeployer(),
    Adapters.SHAHAR,
    "",
    new WalletService()
  );
})();
