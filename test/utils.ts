import BN from "bn.js";
import { Address, Cell, CellMessage, InternalMessage, CommonMessageInfo } from "ton";
import Prando from "prando";

export const zeroAddress = new Address(0, Buffer.alloc(32, 0));

export function randomAddress(workchain: number, seed: string) {
  const random = new Prando(seed);
  const hash = Buffer.alloc(32);
  for (let i = 0; i < hash.length; i++) {
    hash[i] = random.nextInt(0, 255);
  }
  return new Address(workchain, hash);
}

export function internalMessage(params: { from?: Address; to?: Address; value?: BN; bounce?: boolean; body?: Cell }) {
  const message = params.body ? new CellMessage(params.body) : undefined;
  return new InternalMessage({
    from: params.from ?? randomAddress(0, "seed"),
    to: params.to ?? zeroAddress,
    value: params.value ?? 0,
    bounce: params.bounce ?? true,
    body: new CommonMessageInfo({ body: message }),
  });
}
