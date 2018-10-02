import * as ethers from "ethers";
import { CfState, Context, StateChannelInfoImpl } from "../../state";
import { InternalMessage, PeerBalance, StateProposal } from "../../types";
import { CfFreeBalance, CfNonce } from "../cf-operation/types";
import { getFirstResult } from "../middleware";

const FREE_BALANCE_TIMEOUT = 100;
/**
 * UniqueId corresponds to the number of apps maintained by a particular
 * multisig. Since the free balance is the first app, its id is 0.
 */
const FREE_BALANCE_UNIQUE_ID = 0;

/**
 * Similar to the unique id, the dependency nonce for every app is
 * determined Hash(multisig || salt), and so for the salt, we use a
 * counter on the number of apps associated with the multisig. For the
 * free balance this number is 0.
 */
export class SetupProposer {
  public static propose(message: InternalMessage): StateProposal {
    const toAddress = message.clientMessage.toAddress;
    const fromAddress = message.clientMessage.fromAddress;

    const balances = PeerBalance.balances(toAddress, 0, fromAddress, 0);
    const localNonce = 0;
    const freeBalance = new CfFreeBalance(
      balances.peerA.address,
      balances.peerA.balance,
      balances.peerB.address,
      balances.peerB.balance,
      FREE_BALANCE_UNIQUE_ID,
      localNonce,
      FREE_BALANCE_TIMEOUT,
      new CfNonce(FREE_BALANCE_UNIQUE_ID, 1)
    );
    const stateChannel = new StateChannelInfoImpl(
      toAddress,
      fromAddress,
      message.clientMessage.multisigAddress,
      {},
      freeBalance
    );
    return {
      state: {
        [String(message.clientMessage.multisigAddress)]: stateChannel
      }
    };
  }
}