import { EPermissions } from './../types/context';
import { startOfDay, endOfDay } from 'date-fns';
import { Context } from 'src/types/context';
import ResolverBase from 'src/common/Resolver-Base';
import { User, GreenCoinResult } from 'src/models';
import { ProcessLog } from 'src/models/process-log';
import { DistributionResult } from 'src/models/distribution-result';
import PromotionalReward from 'src/models/promotional-rewards';
import { getPipeline as getDistributionDataPipeline } from 'src/pipelines/get_distribution_data';
import { getPipeline as getDistributionSnapshotPipeline } from 'src/pipelines/get_distribution_snapshot';
import { getPipeline as getTokenResultsPipeline } from 'src/pipelines/get_token_results';
import { getPipeline as getDistributionPointsPipeline } from 'src/pipelines/get_distribution_points';
import { getPipeline as getGlobalDistributionResultsPipeline } from 'src/pipelines/get_global_distribution_results';

class Resolvers extends ResolverBase {
  getDistributionDataByEmail = async (
    parent: any,
    { email, date }: { email: string; date: Date },
    { user }: Context,
  ) => {
    this.requirePermissionOrAdmin(user, EPermissions.CLIMB_VIEW_ACCOUNTING);

    const startOfDate = startOfDay(date);
    const endOfDate = endOfDay(date);
    const pipeline = getDistributionDataPipeline(email, startOfDate, endOfDate);

    const [data] = await User.aggregate(pipeline);

    return data as Array<{
      firstName: string;
      lastName: string;
      email: string;
      userId: string;
      totalPoolPoints: number;
      points: Array<{ pointType: string; amount: number }>;
      tokensReceived: Array<{ token: string; amount: number }>;
    }>;
  };

  public getSnapshot = async (parent: any, args: {}, { user }: Context) => {
    this.requireAuth(user);

    const pipeline = getDistributionSnapshotPipeline(user.userId);

    const [snapshot] = await ProcessLog.aggregate(pipeline);

    return snapshot;
  };

  public getTokenResults = async (
    parent: any,
    { date }: { date: Date },
    { user }: Context,
  ) => {
    this.requireAuth(user);

    const startDate = startOfDay(date);
    const endDate = endOfDay(date);
    const pipeline = getTokenResultsPipeline(user.userId, startDate, endDate);

    const results = await DistributionResult.aggregate(pipeline);

    return results;
  };

  public getDistributionPoints = async (
    parent: any,
    { date }: { date: Date },
    { user }: Context,
  ) => {
    this.requireAuth(user);

    const startDate = startOfDay(date);
    const endDate = endOfDay(date);
    const pipeline = getDistributionPointsPipeline(
      user.userId,
      startDate,
      endDate,
    );

    const results = await PromotionalReward.aggregate(pipeline);

    return results;
  };

  public getValidDistributionDates = async (
    parent: any,
    args: {},
    { user }: Context,
  ) => {
    this.requireAuth(user);

    const [earliestResult, lastestResult] = await Promise.all([
      DistributionResult.findOne().sort({ created: 1 }),
      DistributionResult.findOne().sort({ created: -1 }),
    ]);

    return {
      start: earliestResult.created,
      end: lastestResult.created,
    };
  };

  public getDistributionInfo = async (
    parent: any,
    args: { date: Date },
    context: Context,
  ) => {
    const { user } = context;
    this.requireAuth(user);

    const startDate = startOfDay(args.date);
    const endDate = endOfDay(args.date);

    const query = {
      runTime: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    const results = await GreenCoinResult.find(query).exec();

    const model = JSON.parse(JSON.stringify(results));

    return model.map(
      (res: { runTime: Date; address: string; greenDecimal: number }) => {
        return {
          runTime: res.runTime,
          address: res.address,
          coinAmount: res.greenDecimal,
          pointAmount: 0,
        };
      },
    );
  };

  public getGlobalResults = async (
    parent: any,
    { date }: { date: Date },
    { user }: Context,
  ) => {
    this.requireAuth(user);

    const startDate = startOfDay(date);
    const endDate = endOfDay(date);
    const pipeline = getGlobalDistributionResultsPipeline(startDate, endDate);

    const results = await DistributionResult.aggregate(pipeline);

    return results;
  };
}

const resolvers = new Resolvers();

export default {
  Query: {
    distributionData: resolvers.getDistributionDataByEmail,
    distributionSnapshot: resolvers.getSnapshot,
    distributionResults: resolvers.getTokenResults,
    distributionPoints: resolvers.getDistributionPoints,
    distributionGlobalResults: resolvers.getGlobalResults,
    distributionInfo: resolvers.getDistributionInfo,
    validDistributionDates: resolvers.getValidDistributionDates,
  },
};
