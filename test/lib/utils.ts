import BN from "bn.js";
import { Address, CommonMessageInfo, CellMessage, InternalMessage } from "ton";
import { OutAction } from "ton-contract-executor";

export function actionToMessage(
  from: Address,
  action: OutAction | undefined,
  messageValue = new BN(1000000000),
  bounce = true
) {
  //@ts-ignore
  const sendMessageAction = action as SendMsgOutAction;

  let msg = new CommonMessageInfo({
    body: new CellMessage(sendMessageAction.message?.body),
  });
  return new InternalMessage({
    to: sendMessageAction.message?.info.dest,
    from,
    value: messageValue,
    bounce,
    body: msg,
  });
}
