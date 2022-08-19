import { BigNumber } from 'ethers';
import {
  eSupportedInterfaces,
  ItemTokenName,
  IRewardTriggerConfig,
} from 'src/types';
import { ItemReward } from '.';
import { WalletTransaction, IRewardAudit } from 'src/models';
import { availableRewardTokenSupplyPipeline } from 'src/pipelines';
import { gameItemService } from 'src/services';
import { logger } from 'src/common';

export class Erc1155NFTReward extends ItemReward {
  logPath = 'services.rewardDistributer.rewardHandlers.erc1155-nft';
  tokenId: BigNumber;

  constructor(
    itemName: ItemTokenName,
    rewardTriggerConfig: IRewardTriggerConfig,
  ) {
    super(itemName, rewardTriggerConfig);
    if (this.rewardConfig.walletApi !== eSupportedInterfaces.erc1155) {
      throw new Error('Incorrect configuration provided for ERC1155NFTReward');
    }
    this.tokenId = BigNumber.from(this.rewardConfig.tokenId);
  }

  sendRewardToAccount = async (
    userId: string,
    ethAddress: string,
    amount: BigNumber,
    valueSent: number,
  ) => {
    logger.debug(`sendRewardToAccount - name: ${this.rewardConfig.name}`);
    logger.debug(`sendRewardToAccount - ethAddress: ${ethAddress}`);
    logger.debug(`sendRewardToAccount - userId: ${userId}`);
    logger.debug(`sendRewardToAccount - amount: ${amount.toString()}`);
    logger.debug(`sendRewardToAccount - valueSent: ${valueSent}`);

    const audit: IRewardAudit = {
      amountSent: amount.toString(),
      rewardType: 'ERC1155-NFT',
      userEthAddress: ethAddress,
      userId: userId,
      valueSent,
      txHash: '',
      error: '',
    };
    try {
      if (!ethAddress)
        throw new Error(
          `User ethAddress required to send ${this.rewardConfig.name}`,
        );

      logger.debug(`sendRewardToAccount - gameItemService: before`);

      try {
        const [
          result,
        ] = await gameItemService.assignItemToUserByTokenIdLimitOne(
          userId,
          ethAddress,
          [this.tokenId.toHexString()],
        );
        logger.debug('sendRewardToAccount - gameItemService: after');
        logger.debug(`sendRewardToAccount - txHash: ${audit.txHash}`);
        audit.txHash = result;
        this.saveRewardAudit(audit);
      } catch (error) {
        logger.exceptionContext(error, 'sendRewardToAccount');
      }
    } catch (error) {
      logger.exceptionContext(error, 'sendRewardToAccount');
      throw error;
    }
  };

  checkRewardThresholdAndAlert = async () => {
    const [result = { supplyRemaining: 0 }] = await WalletTransaction.aggregate(
      availableRewardTokenSupplyPipeline(
        this.rewardDistributerWallet.address,
        this.rewardConfig.tokenId,
      ),
    );
    if (result.supplyRemaining <= this.supplyWarnThreshold) {
      this.sendBalanceAlert(
        result.supplyRemaining.toString(),
        result.supplyRemaining.toString(),
        this.rewardConfig.name,
      );
      return true;
    }
    return false;
  };
}
