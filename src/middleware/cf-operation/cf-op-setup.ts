import * as ethers from "ethers";
import { Address, H256, NetworkContext } from "../../types";
import {
  Abi,
  CfFreeBalance,
  CfNonce,
  CfStateChannel,
  MultisigInput,
  Operation
} from "./types";

import { CfMultiSendOp } from "./cf-multisend-op";

const TYPES = ["bytes1", "address", "address", "uint256", "bytes", "uint256"];

export class CfOpSetup extends CfMultiSendOp {
  /**
   * Helper method to get hash of an input calldata
   * @param multisig
   * @param multisigInput
   */
  public static toHash(multisig: Address, multisigInput: MultisigInput): H256 {
    multisigInput = sanitizeMultisigInput(multisigInput);
    return ethers.utils.solidityKeccak256(TYPES, [
      "0x19",
      multisig, // why did we use this as salt in the last iteration?
      multisigInput.to,
      multisigInput.val,
      multisigInput.data,
      multisigInput.op
    ]);
  }

  constructor(
    readonly ctx: NetworkContext,
    readonly multisig: Address,
    readonly freeBalanceStateChannel: CfStateChannel,
    readonly freeBalance: CfFreeBalance,
    readonly nonce: CfNonce
  ) {
    super(ctx, multisig, freeBalance, nonce);
  }

  /**
   * @override common.CfMultiSendOp
   */
  public eachMultisigInput(): MultisigInput[] {
    return [
      this.dependencyNonceInput(),
      this.finalizeDependencyNonceInput(),
      this.conditionalTransferInput()
    ];
  }

  public conditionalTransferInput(): MultisigInput {
    const terms = CfFreeBalance.terms();

    const depNonceKey = ethers.utils.solidityKeccak256(
      ["address", "uint256"],
      [this.multisig, this.dependencyNonce.salt]
    );

    const multisigCalldata = new ethers.Interface([
      Abi.executeStateChannelConditionalTransfer
    ]).functions.executeStateChannelConditionalTransfer.encode([
      this.ctx.Registry,
      this.ctx.NonceRegistry,
      depNonceKey,
      this.dependencyNonce.nonce,
      this.freeBalanceStateChannel.cfAddress(),
      [terms.assetType, terms.limit, terms.token]
    ]);

    return new MultisigInput(
      this.ctx.ConditionalTransfer,
      0,
      multisigCalldata,
      Operation.Delegatecall
    );
  }
}

function sanitizeMultisigInput(multisigInput: any): MultisigInput {
  return new MultisigInput(
    multisigInput.to,
    new ethers.BigNumber(multisigInput.value).toNumber(),
    multisigInput.data,
    new ethers.BigNumber(multisigInput.operation).toNumber()
  );
}