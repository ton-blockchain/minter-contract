import { Adapters, WalletAdapter_ } from "./types";
import { TonClientAdapter } from "./adapters/TonClientAdapter";
import { TransactionDetails } from "../transaction-sender";



export const AdapterTypes = {
  [Adapters.TON_CLIENT]: TonClientAdapter,
  // [Adapters.TON_HUB]: Bla
};




// export const AdapterFactory = {
//   getAdapterType: (type: Adapters): RXX =>  {
//     switch (type) {
//       case Adapters.TON_CLIENT:
//         return TonClientAdapter;
//       case Adapters.TON_HUB:
//         return Bla;
//       default:
//         return Bla;
//     }
//   }
// };

// const x = AdapterFactory.getAdapterType(Adapters.TON_CLIENT);
// new x();

