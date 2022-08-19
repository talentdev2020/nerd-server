import { Context, IFriendsNodesReport, IReferralsNodesTypesCount } from '../types';
import ResolverBase from '../common/Resolver-Base';
import { configAws, logger } from '../common';
import config from '../common/config';
import { User, FriendNudge } from '../models';
import { getPipeline as getAllowedToNudgePipeline } from '../pipelines/allowed_to_nudge_friend';
import { getPipeline as getFriendsPipeline } from '../pipelines/get_friends';
import { getPipeline as getNudgableFriendsPipeline } from '../pipelines/nudgable_friends';
import { getPipeline as friendNodesReporPipeline } from '../pipelines/friend_nodes_report';
import { getPipeline as referralsNodesTypesCountPipeline } from '../pipelines/referrals_nodes_types_count';

class Resolvers extends ResolverBase {
  public friendsNodesReport = async (
    parent: any,
    args: {},
    { user }: Context,
  ): Promise<IFriendsNodesReport> => {
    this.requireAuth(user);
    const pipeline = friendNodesReporPipeline(user.userId);
    let report: IFriendsNodesReport;
    try {
      [report] = await User.aggregate<IFriendsNodesReport>(pipeline);
    } catch (error) {
      logger.warn(`resolvers.friends.friendsNodesReport.catch:${error}`);
      throw error;
    }
    return report;
  };

  private async verifyNudgableFriend(userId: string, friend: string) {
    const pipeline = getAllowedToNudgePipeline(
      userId,
      friend,
      configAws.nudgeCode,
    );

    const [result] = await User.aggregate(pipeline);
    return result;
  }

  public getFriends = async (parent: any, args: {}, { user }: Context) => {
    this.requireAuth(user);

    const pipeline = getFriendsPipeline(user.userId);
    const friends = await User.aggregate(pipeline);

    return friends;
  };

  public nudgeFriend = async (
    parent: any,
    { id }: { id: string },
    { user, dataSources }: Context,
  ) => {
    this.requireAuth(user);

    const {
      isFriend,
      allowedToNudge,
      email,
      firstName,
      referralLink,
      emailVerified,
    } = await this.verifyNudgableFriend(user.userId, id);

    if (!isFriend) {
      return {
        success: false,
        message: `Not your friend`,
      };
    }

    if (!allowedToNudge) {
      return {
        success: false,
        message: `Already nudged`,
      };
    }

    if (!emailVerified) {
      return {
        success: false,
        message: `Friend has not verified their email address`,
      };
    }

    const referrer = await user.findFromDb();

    await FriendNudge.create({
      code: configAws.nudgeCode,
      userId: user.userId,
      friend: id,
      created: new Date(),
      updated: null,
    });

    return { success: true };
  };

  public nudgeAllFriends = async (
    parent: any,
    args: {},
    { user, dataSources }: Context,
  ) => {
    this.requireAuth(user);

    const pipeline = getNudgableFriendsPipeline(user.userId, configAws.nudgeCode);
    const nudgableFriends: Array<{
      referrer: string;
      firstName: string;
      email: string;
      referralLink: string;
      userId: string;
      communicationConsent: Array<{
        timestamp: Date;
        consentGiven: boolean;
      }>;
      emailVerified: Date;
    }> = await User.aggregate(pipeline);

    const nudges = await Promise.all(
      nudgableFriends.map(async ({ referrer, ...friend }) => {

        return new FriendNudge({
          code: configAws.nudgeCode,
          userId: user.userId,
          friend: friend.userId,
        });
      }),
    );

    await FriendNudge.insertMany(nudges);

    return { success: true };
  };


  public getReferralsNodesTypesCounts = async (
    _parent: any,
    _args: {},
    { user }: Context,
  ):Promise<IReferralsNodesTypesCount[]> => {
    this.requireAuth(user);
    const pipeline = referralsNodesTypesCountPipeline(user.userId);
    const nodesTypesCount = await User.aggregate<IReferralsNodesTypesCount>(pipeline);
    return nodesTypesCount;
  };
}

const resolvers = new Resolvers();

export default {
  Query: {
    friends: resolvers.getFriends,
    friendsNodesReport: resolvers.friendsNodesReport,
    getReferralsNodesTypesCounts:resolvers.getReferralsNodesTypesCounts,
  },
  Mutation: {
    nudgeFriend: resolvers.nudgeFriend,
    nudgeAllFriends: resolvers.nudgeAllFriends,
  },
};