import { Adapter, Adapters } from "./types";

const adapters: Adapter[] = [
    {
      text: "Tonhub",
      type: Adapters.TON_HUB,
      mobileCompatible: true
    },
    {
      text: "Ton Wallet",
      type: Adapters.TON_WALLET,
      mobileCompatible: false
    },
  ];


  
  const TON_WALLET_EXTENSION_URL =
  "https://chrome.google.com/webstore/detail/ton-wallet/nphplpgoakhhjchkkhmiggakijnkhfnd";

  export {adapters, TON_WALLET_EXTENSION_URL}