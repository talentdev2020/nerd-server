import { config, logger, ResolverBase } from 'src/common';
import { Context } from 'src/types/context';
import { AffiliateAction, AffiliateLink, AffiliateLinkUser } from 'src/models';
import { affiliate } from 'src/services';

class Resolvers extends ResolverBase {
  logAffiliateVisit = async (
    parent: any,
    args: {
      affiliateId: string;
      sessionId: string;
      url: string;
    },
    ctx: Context,
  ) => {
    try {
      const affiliateAction = new AffiliateAction({
        affiliateId: args.affiliateId,
        sessionId: args.sessionId,
        url: args.url,
      });

      await affiliateAction.save();

      return { data: true };
    } catch (error) {
      logger.warn(`resolvers.affiliate.logAffiliateVisit.catch:${error}`);
      return { data: false, error: error };
    }
  };

  affiliateLink = async (
    parent: any,
    args: { affiliateId: string },
    ctx: Context,
  ) => {
    const { user } = ctx;
    this.requireAuth(user);

    const affiliateLink = await affiliate.affiliateLink(args.affiliateId);
    return affiliateLink;
  };

  getUserAffiliateLinks = async (parent: any, args: {}, ctx: Context) => {
    const { user } = ctx;
    this.requireAuth(user);

    const affiliateLinks = await affiliate.userAffiliateLinks(user);

    if (!affiliateLinks.length) {
      const templates = await affiliate.getAffiliateLinks();

      await Promise.all(templates.map(async (template) => {
        const affiliateLinkUser = await affiliate.addAffiliateLinkToUser(
          user,
          template,
        );
        affiliateLinks.push(affiliateLinkUser);
      }));
    }

    return affiliateLinks;
  };

  assignReferredBy = async (
    parent: any,
    args: {
      affiliateId: string;
      sessionId: string;
    },
    ctx: Context,
  ) => {
    try {
      const { user } = ctx;
      this.requireAuth(user);

      const userDoc = await user.findFromDb();

      if (!userDoc.referredByLocked) {
        const affiliateLinkUser = await AffiliateLinkUser.findOne({
          affiliateLinkId: args.affiliateId,
        }).exec();
        userDoc.referredBy = affiliateLinkUser.userId;
        userDoc.referredByLocked = true;
        userDoc.affiliate = {
          affiliateId: args.affiliateId,
          sessionId: args.sessionId,
        };

        await userDoc.save();
      }

      return { data: true };
    } catch (error) {
      logger.warn(`resolvers.affiliate.logAffiliateVisit.catch:${error}`);
      return { data: false, error: error };
    }
  };

  createAffiliateLink = async (
    parent: any,
    args: {
      pageUrl: string;
      name: string;
      brand: string;
    },
    ctx: Context,
  ) => {
    const { user } = ctx;
    this.requireAuth(user);

    const affiliateLink = new AffiliateLink({
      pageUrl: args.pageUrl,
      name: args.name,
      brand: args.brand,
    });

    await affiliateLink.save();

    return affiliateLink;
  };

  addAffiliateLinkToUser = async (
    parent: any,
    args: {
      affiliateLinkId: string;
    },
    ctx: Context,
  ) => {
    const { user } = ctx;
    this.requireAuth(user);

    const affiliateLink = await affiliate.affiliateLink(args.affiliateLinkId);
    const affiliateLinkUser = await affiliate.addAffiliateLinkToUser(
      user,
      affiliateLink,
    );

    return affiliateLinkUser;
  };
}

const resolvers = new Resolvers();

export default {
  Query: {
    logAffiliateVisit: resolvers.logAffiliateVisit,
    affiliateLink: resolvers.affiliateLink,
    getUserAffiliateLinks: resolvers.getUserAffiliateLinks,
  },
  Mutation: {
    assignReferredBy: resolvers.assignReferredBy,
    createAffiliateLink: resolvers.createAffiliateLink,
    addAffiliateLinkToUser: resolvers.addAffiliateLinkToUser,
  },
};
