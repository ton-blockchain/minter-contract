import BN from "bn.js";
import { Address, Cell, Slice, TonClient } from "ton";

interface Executor {
  invokeGetMethod<T>(contractAddress: Address, methodName: string, params: any[], resultParser: (stack: (BN | Cell)[]) => T): Promise<T>;
}

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

class TonClientExecutor implements Executor {
  #tonClient: TonClient;

  constructor(tonClient: TonClient) {
    this.#tonClient = tonClient;
  }

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

  async invokeGetMethod<T>(contractAddress: Address, methodName: string, params: any[], resultParser: ResultParser): Promise<T> {
    const res = await this.#tonClient.callGetMethod(contractAddress, methodName, params);
    return resultParser(this.#parseGetMethodCall(res.stack));
  }
}

interface ResultParser {
  parse<T>(stack: (BN | Cell)[]): T;
}

class JettonDetailsParser implements ResultParser {
  parse(stack: (BN | Cell)[]): {totalSupply: BN, address: Address} {
    return {
      totalSupply: stack[0] as BN,
      address: (stack[2] as Cell).beginParse().readAddress() as Address,
    //   contentUri: parseContentField((stack[3] as Cell).beginParse()),
    };
  }
}

new TonClientExecutor().invokeGetMethod("", "", []);

class TestClientExecutor implements Executor {
  constructor(tonClient: TonClient) {
    this.#tonClient = tonClient;
  }

  parseGetMethodCall(stack: any[]) {
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

  async invokeGetMethod(contractAddress: Address, methodName: string, params: any[]): Promise<(BN | Cell)[]> {
    const res = await this.#tonClient.callGetMethod(contractAddress, methodName, params);
    return this.parseGetMethodCall(res.stack);
  }
}
