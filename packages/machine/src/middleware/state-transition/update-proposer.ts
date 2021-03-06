import { CfState, Context } from "../../state";
import {
  Address,
  H256,
  InternalMessage,
  StateProposal,
  UpdateData
} from "../../types";

export class UpdateProposer {
  public static propose(
    message: InternalMessage,
    context: Context,
    state: CfState
  ): StateProposal {
    const multisig: Address = message.clientMessage.multisigAddress;
    const channels = state.stateChannelInfosCopy();

    if (message.clientMessage.appId === undefined) {
      throw new Error("update message must have appId set");
    }

    const appId: H256 = message.clientMessage.appId;
    const updateData: UpdateData = message.clientMessage.data;

    const app = channels[multisig].appChannels[appId];
    app.appStateHash = updateData.appStateHash;
    app.encodedState = updateData.encodedAppState;
    app.localNonce += 1;

    return { state: channels };
  }
}
