import BN from "bn.js";
import { Address, Cell, Slice, TonClient, contractAddress, beginCell } from "ton";
import { addressToCell } from "../test/deploy-controller.spec";
import { SmartContract } from "ton-contract-executor";

// interface Executor {
//   invokeGetMethod(methodName: string, params?: any[]): Promise<(BN | Cell)[]>;
// }

// interface CallableGetMethod {

//     get()

// }

// class TheContract {

// }

// class JettonMinterGetJettonDetails implements CallableGetMethod {

//     parse() {

//     }

//     async get() {

//     }

// }

export class TonClientGetMethodExecutor {
  #parseGetMethodCall(stack: any[]) {
    return stack.map(([type, val]) => {
      switch (type) {
        case "num":
          return new BN(val.replace("0x", ""), "hex");
        case "cell":
          return Cell.fromBoc(Buffer.from(val.bytes, "base64"))[0];
        default:
          throw new Error("unknown type");
      }
    });
  }

  #prepareParams(params: any[] = []) {
    return params.map((p) => {
      if (p instanceof Cell) {
        // TODO what's idx:false
        return ["tvm.Slice", p.toBoc({ idx: false }).toString("base64")];
      }

      throw new Error("unknown type!");
    });
  }

  async invokeGetMethod(address: Address, tonClient: TonClient, methodName: string, params: any[]): Promise<(BN | Cell)[]> {
    const res = await tonClient.callGetMethod(address, methodName, this.#prepareParams(params));
    return this.#parseGetMethodCall(res.stack);
  }
}

export class TestSuiteExecutor implements Executor {
  // TODO add address
  #contract: SmartContract;
  constructor(contract: SmartContract) {
    this.#contract = contract;
  }

  #parseGetMethodCall(stack: any[]) {
    return stack.map((o) => {
      if (o instanceof Slice) return o.toCell();
      return o;
    });
  }

  #prepareParams(params: any[] = []) {
    return params.map((p) => {
      if (p instanceof Cell) {
        // TODO what's idx:false
        return {
          type: "cell_slice",
          value: p.toBoc({ idx: false }).toString("base64"),
        };
      }

      throw new Error("unknown type!");
    });
  }

  async invokeGetMethod(methodName: string, params?: any[]): Promise<(BN | Cell)[]> {
    const res = await this.#contract.invokeGetMethod(methodName, this.#prepareParams(params));
    return this.#parseGetMethodCall(res.result);
  }
}

export interface JettonDetails {
  totalSupply: BN;
  address: Address;
  contentUri: string;
}

class ZContract {
  protected executor: Executor;
  public address: Address;
  constructor(executor: Executor, address: Address) {
    this.executor = executor;
    this.address = address;
  }
}

export interface ContractGetMethod {
  name: string;
  resolver: (res: (BN | Cell)[]) => unknown;
}

export const JettonMinterMethods = {
  getJettonDetails: {
    name: "get_jetton_details",
    resolver: (res: (BN | Cell)[]): JettonDetails => {
      const contentUriSlice = (res[3] as Cell).beginParse(); // TODO support onchain
      contentUriSlice.readInt(8);
      return {
        totalSupply: res[0] as BN,
        address: (res[2] as Cell).beginParse().readAddress() as Address,
        contentUri: contentUriSlice.readRemainingBytes().toString("ascii"),
      } as JettonDetails;
    },
  },
};

export class JettonMinterContract extends ZContract {
  static getJettonDetails(res: (BN | Cell)[]): JettonDetails {
    const contentUriSlice = (res[3] as Cell).beginParse(); // TODO support onchain
    contentUriSlice.readInt(8);

    return {
      totalSupply: res[0] as BN,
      address: (res[2] as Cell).beginParse().readAddress() as Address,
      contentUri: contentUriSlice.readRemainingBytes().toString("ascii"),
    };
  }

  static getJWalletAddress(res: (BN | Cell)[]): Address {
    return (res[0] as Cell).beginParse().readAddress() as Address;
  }
}

interface JWalletData {
  balance: BN;
  owner: Address;
  masterContract: Address;
}

export class JettonWalletContract extends ZContract {
  async getWalletData(): Promise<JWalletData> {
    const res = await this.executor.invokeGetMethod("get_wallet_data");
    return {
      balance: res[0] as BN,
      owner: (res[1] as Cell).beginParse().readAddress() as Address,
      masterContract: (res[2] as Cell).beginParse().readAddress() as Address,
    };
  }
}

// new TonClientExecutor().invokeGetMethod("", "", [], new JettonDetailsParser());

// class TestClientExecutor implements Executor {
//   constructor(tonClient: TonClient) {
//     this.#tonClient = tonClient;
//   }

//   parseGetMethodCall(stack: any[]) {
//     return stack.map(([type, val]) => {
//       switch (type) {
//         case "num":
//           return new BN(val.replace("0x", ""), "hex");
//         case "cell":
//           return Cell.fromBoc(Buffer.from(val.bytes, "base64"))[0];
//         default:
//           throw new Error("unknown type");
//       }
//     });
//   }

//   async invokeGetMethod(contractAddress: Address, methodName: string, params: any[]): Promise<(BN | Cell)[]> {
//     const res = await this.#tonClient.callGetMethod(contractAddress, methodName, params);
//     return this.parseGetMethodCall(res.stack);
//   }
// }
