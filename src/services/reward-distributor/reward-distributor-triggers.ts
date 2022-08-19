import {
  IUser,
  ItemTokenName,
  RewardActions,
  IRewardTriggerValues,
} from 'src/types';
import {
  BaseReward,
  Erc1155FungibleReward,
  Erc1155NFTReward,
} from './reward-handlers';
import { UserHelper } from 'src/utils';
import { logger, config } from 'src/common';

const {
  ALFA_FOUNTAIN_OK,
  ALFA_FOUNTAIN_GOOD,
  ALFA_FOUNTAIN_GREAT,
  ALFA_FOUNTAIN_MAJESTIC,
  BETA_KEY,
  EXPRESS_DEPOT,
} = ItemTokenName;

class RewardTrigger {
  getUserHelper = (user: IUser) => new UserHelper(user);

  private get actionRewards() {
    if (['gala', 'arcade'].includes(config.brand)) {
      return new Map<RewardActions, BaseReward[]>([
        [
          RewardActions.WALLET_CREATED,
          [
            new Erc1155FungibleReward('GALA', {
              amount: { toReferrer: 100, toUser: 100 },
            }),
            new Erc1155NFTReward(BETA_KEY, {
              amount: { toUser: 1 },
            }),
            new Erc1155NFTReward(ALFA_FOUNTAIN_OK, {
              amount: { toReferrer: 1 },
              valuesRequired: { referrer: 1 },
            }),
            new Erc1155NFTReward(ALFA_FOUNTAIN_GOOD, {
              amount: { toReferrer: 1 },
              valuesRequired: { referrer: 10 },
            }),
            new Erc1155NFTReward(ALFA_FOUNTAIN_GREAT, {
              amount: { toReferrer: 1 },
              valuesRequired: { referrer: 50 },
            }),
            new Erc1155NFTReward(ALFA_FOUNTAIN_MAJESTIC, {
              amount: { toReferrer: 1 },
              valuesRequired: { referrer: 100 },
            }),
          ],
        ],
        [
          RewardActions.UPGRADED,
          [
            new Erc1155FungibleReward('GALA', {
              amount: { toUser: 100 },
            }),
            new Erc1155NFTReward(EXPRESS_DEPOT, { amount: { toUser: 1 } }),
          ],
        ],
      ]);
    } else if (config.brand === 'connect') {
      return new Map<RewardActions, BaseReward[]>([
        [
          RewardActions.WALLET_CREATED,
          [
            new Erc1155NFTReward(BETA_KEY, {
              amount: { toUser: 1 },
            }),
          ],
        ],
        [
          RewardActions.UPGRADED,
          [
            new Erc1155FungibleReward('GALA', {
              amount: { toUser: 100 },
            }),
            new Erc1155NFTReward(EXPRESS_DEPOT, { amount: { toUser: 1 } }),
          ],
        ],
      ]);
    } else {
      return new Map<RewardActions, BaseReward[]>([
        [RewardActions.WALLET_CREATED, []],
        [RewardActions.UPGRADED, []],
      ]);
    }
  }

  triggerAction = (
    action: RewardActions,
    userHelper: UserHelper,
    triggerValues?: IRewardTriggerValues,
  ) => {
    const rewards = this.actionRewards.get(action);
    logger.debug(`triggerAction - rewards.length: ${rewards.length}`);
    logger.debug(`triggerAction - action: ${JSON.stringify(action)}`);
    logger.debug(`triggerAction - userHelper.self.id: ${userHelper.self.id}`);
    logger.debug(`triggerAction - triggerValues: ${!!triggerValues}`);

    return Promise.all(
      rewards.map(reward => {
        logger.debug(
          `triggerAction - reward: @@${action}@@${reward.rewardConfig.name}`,
        );
        return reward.triggerReward(userHelper, triggerValues);
      }),
    );
  };
}

export const rewardTrigger = new RewardTrigger();
