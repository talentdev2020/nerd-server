import { config, logger } from 'src/common';
import { ShareResolver } from './share';
import { Context, IUserWallet } from 'src/types';
import {
  referralRewardsPipeline,
  alfaFountainSharesPipeline,
} from 'src/pipelines';
import { default as User } from 'src/models/user';
import { Erc1155Token } from 'src/models';
import { logResolver } from 'src/common/logger';

export class GalaShareResolver extends ShareResolver {
  private getRewardTotals = async (userId: string) => {
    const [result] = await User.aggregate(referralRewardsPipeline(userId));
    return (
      result || {
        btcEarned: 0,
        friendsJoined: 0,
        friendsPlayed: 0,
        galaEarned: 0,
        nodesPurchased: 0,
        upgradedReferrals: 0,
      }
    );
  };

  public galaShareConfig = async (
    parent: any,
    args: {},
    { user, wallet, dataSources: { cryptoFavorites } }: Context,
  ) => {
    this.requireAuth(user);
    // this.requireBrand().toBeIn(['arcade', 'gala']);

    // TODO: Find a different method for getting BTC price and remove this
    const BANDAID_FIXED_BTC_USD_PRICE = 10865.3;

    try {
      const { brand } = config;
      const dbUser = await user.findFromDb();

      const {
        available,
        unactivated,
        earnedShares,
        numberOfActivations,
      } = await this.getShareConfigs(dbUser);

      // This was breaking things. IP may have been banned
      // const btcUsdPrice = await cryptoFavorites.getBtcUsdPrice();

      logger.JSON.debug({
        available,
        unactivated,
        earnedShares,
        numberOfActivations,
      });
      const userWallet = dbUser?.wallet;
      if (!userWallet) throw new Error('User wallet not initialized');
      const { confirmed, unconfirmed } = await wallet
        .coin('btc')
        .getBalance(user.userId);
      logger.JSON.debug({ confirmed, unconfirmed });
      const activatedShares =
        (userWallet && userWallet.shares && userWallet.shares[brand]) || 0;
      logger.obj.debug({ activatedShares });
      const [
        {
          referrerReward,
          companyFee,
          rewardCurrency,
          rewardAmount,
          userBalanceThreshold,
          upgradeBenefits,
          basicWalletBenefits,
        },
      ] = available;
      const {
        btcEarned,
        friendsJoined,
        friendsPlayed,
        galaEarned,
        nodesPurchasedByReferrals,
        nodesOwned,
        upgradedReferrals,
      } = await this.getRewardTotals(dbUser.id);

      return {
        userWallet, // required for sub-resolver
        goldMember: !!userWallet?.activations?.gala?.activated,
        btcBalanceConfirmed: confirmed,
        btcBalancePending: unconfirmed,
        referrerReward,
        companyFee,
        rewardCurrency,
        rewardAmount,
        userBalanceThreshold,
        upgradeBenefits,
        basicWalletBenefits,
        nodesOwned,
        galaRewards: {
          earned: galaEarned.toFixed(8),
          usd: '0',
        },
        btcRewards: {
          earned: btcEarned,
          usd: (BANDAID_FIXED_BTC_USD_PRICE * btcEarned).toFixed(8),
          // usd: (btcUsdPrice * btcEarned).toFixed(8),
        },
        referralOutcomes: {
          friendsJoined,
          friendsPlayed,
          goldMembers: upgradedReferrals,
          nodesPurchasedByReferrals,
        },
      };
    } catch (error) {
      logger.obj.warn({ error: error.stack });
    }
  };

  townStarRewards = async (
    { userWallet }: { userWallet: IUserWallet },
    args: {},
    { user }: Context,
  ) => {
    this.requireAuth(user);

    const result = await Erc1155Token.aggregate(
      alfaFountainSharesPipeline(userWallet.ethAddress),
    );

    return result;
  };
}

const resolvers = new GalaShareResolver();

export default logResolver({
  Query: {
    galaShareConfig: resolvers.galaShareConfig,
  },
  GalaShareConfig: {
    shareUrl: resolvers.shareUrl,
    townStarRewards: resolvers.townStarRewards,
  },
});
