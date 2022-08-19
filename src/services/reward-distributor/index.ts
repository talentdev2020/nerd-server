import { logger } from 'src/common';
import { erc20Reward, docReward } from './reward-handlers';

class RewardDistributer {
  public sendReward = async (
    rewardAmount: number,
    rewardCurrency: string,
    userId: string,
    ethAddress: string,
  ) => {
    logger.JSON.debugContext({ rewardAmount, rewardCurrency }, 'sendReward');
    const rewardCurrencyLowered = rewardCurrency.toLowerCase();
    let rewardId: string;
    const itemsRewarded: string[] = [];
    if (rewardCurrencyLowered === 'green') {
      rewardId = await erc20Reward.send(
        rewardCurrency,
        rewardAmount,
        ethAddress,
      );
    } else if (rewardCurrencyLowered === 'gala') {
      const [resultRewardId] = await Promise.all([
        docReward.send(rewardCurrency, rewardAmount, userId),
      ]);
      rewardId = resultRewardId;
    } else {
      rewardId = await docReward.send(rewardCurrency, rewardAmount, userId);
    }
    const rewardResult = {
      rewardId,
      amountRewarded: rewardAmount,
      itemsRewarded,
    };
    logger.JSON.debug(rewardResult);
    return rewardResult;
  };
}

const rewardDistributer = new RewardDistributer();
export default rewardDistributer;
