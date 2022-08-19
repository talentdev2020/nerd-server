import ResolverBase from '../common/Resolver-Base';
import { logger } from '../common';
import { Context } from '../types';
import {
  BlockbotReportResult,
  BlockbotTokenReportResult,
  BlockbotRedemptionResult,
  BlockbotReportUserDistributions,
  IBlockbotReport,
  IBlockbotMemory,
} from '../models';
import VaultDirectPaymentRequests from 'src/models/vault-payment-requests';

class Resolvers extends ResolverBase {
  getBlockbotReport = async (
    parent: any,
    args: {
      userId?: string;
    },
    ctx: Context,
  ) => {
    const { user } = ctx;
    const otherUserId = args.userId;
    let userId = user.userId;
    this.requireAuth(user);

    if (user.role === 'admin' && otherUserId) {
      userId = otherUserId;
    }

    try {
      logger.debug(`resolvers.blockbot.getBlockBotReport`);

      const twoDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 2;

      const latestReport = await BlockbotReportResult.find({
        UserId: userId,
      })
        .sort({ DatePrepared: -1 })
        .limit(1)
        .exec();

      const latestDistributions = await BlockbotReportUserDistributions.find({
        UserId: userId,
      })
        .sort({ Date: -1 })
        .exec();

      const directPaymentRequests = await VaultDirectPaymentRequests.find({
        userId: userId,
      }).exec();
        
      const blankMemory: IBlockbotMemory = {
        TotalBlockbotsNow: 0,
        TotalBlockbotsPrevious: 0,
        TotalRewardsCoin: 0,
        TotalRewardsUsd: 0,
        AverageUsdPerBlockbot: 0,
        AveragePercentDifference: 0,
        Memory: '',
        WinPoints: 0,
        MainRewards : [],
        NodeRewards : [],
      }

      let toReturn : IBlockbotReport = {
        UserId: userId,
        DatePrepared: Date.now(),
        AvailableBalance: 0,
        WinScore: 0,
        WinRewards: 0,
        TotalBlockbots: 0,
        Day: blankMemory,
        Week: blankMemory,
        Month: blankMemory,
        Year: blankMemory,
        Quarter: blankMemory,
        All: blankMemory,
        PendingDirectPaymentsETH: 0,
      };
      if (latestReport.length >= 1) {
        toReturn = latestReport[0];
      } 

      //Resetting blockbot data to zero for the latestDistributions to map to correct values
      toReturn.AvailableBalance = 0;
      toReturn.WinRewards = 0;
      toReturn.Day.MainRewards = [];
      toReturn.Week.MainRewards = [];
      toReturn.Month.MainRewards = [];
      toReturn.Quarter.MainRewards = [];
      toReturn.Year.MainRewards = [];
      toReturn.All.MainRewards = [];
      toReturn.PendingDirectPaymentsETH = 0;

      // Pullng the reward details for connect pay from the win-report-user-distributions instead of saved win-report-blockbots
      latestDistributions.map(a => {
        toReturn.WinRewards += a.TotalDirectRewardsCrypto;

        if(a.DateToDistribute < new Date()){
          toReturn.AvailableBalance += a.TotalDirectRewardsCrypto;
        }
        

        const commissionDetails:[any] = JSON.parse(a.RewardDetailsJson);
        commissionDetails.map( b => {
          if(b.rewardType === 'Direct') {
            const mainReward = {
              Description: b.description,
              Points: b.points,
              RewardAmount: b.amount,
              Time: b.time,
            };

            toReturn.All.MainRewards.push(mainReward);
          }
        });

      });

      // Summing direct payment requests
      directPaymentRequests.filter(r => r.symbol === 'ETH').map(r => {
        const amountRequested = Number(r.amountRequested);
        if (!isNaN(amountRequested)) {
          toReturn.PendingDirectPaymentsETH += amountRequested;
        }
      });

      return toReturn;

    } catch (err) {
      logger.warn(`resolvers.blockbot.getBlockBotReport.catch: ${err}`);
      return {
        success: false,
        message: err,
      };
    }
  };

  getBlockbotTokenReport = async (
    _parent: any,
    args: {
      userId?: string;
    },
    ctx: Context,
  ) => {
    const { user } = ctx;    
    this.requireAuth(user);

    const otherUserId = args.userId;
    let userId = user.userId;

    if (user.role === 'admin' && otherUserId) {
      userId = otherUserId;
    }

    try {
      logger.debug(`resolvers.blockbot.getBlockBotReport`);      

      const latestReport = await BlockbotTokenReportResult.find({
        userId: userId,
      })
        .sort({ datePrepared: -1 })
        .limit(1)
        .exec();      

        //returns undefined if there is not a blockbot report for the userId.
        //This undefined should be handled in the presentation layer.                
        return latestReport[0];
      
    } catch (err) {
      logger.warn(`resolvers.blockbot.getBlockBotTokenReport.catch: ${err}`);
      throw new Error("Server error");
    }
  };

  redeemConnectPay = async (
    parent: any,
    args: {
      destinationAddress?: string;
      coinSymbol: string;
    },
    ctx: Context,
  ) => {
    const { user } = ctx;
    const destinationAddress = args.destinationAddress;
    const userId = user.userId;
    this.requireAuth(user);

    try {
      const toAdd = {
        userId,
        receiveAddress: destinationAddress,
        date: new Date(),
        status: 'pending',
      };

      const latestReport = await BlockbotTokenReportResult.insertMany(toAdd);

      return {
        status: 'Pending Approval. Please allow up to 2 business days.',
      };
    } catch (err) {
      logger.exceptionContext(err, `resolvers.blockbot.redeemRewards.catch`, {
        userId: userId,
        destination: destinationAddress,
      });
      return {
        status:
          'An error occurred. A ticket has been automatically submitted to Customer Service.',
      };
    }
  };
}

const resolvers = new Resolvers();

export default {
  Query: {
    getBlockbotReport: resolvers.getBlockbotReport,
    getBlockbotTokens: resolvers.getBlockbotTokenReport,
    redeemConnectPay: resolvers.redeemConnectPay,
  },
};
