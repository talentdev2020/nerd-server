import { config, logger, ResolverBase } from 'src/common';
import { Context } from 'src/types/context';
import { License } from 'src/models';

class Resolvers extends ResolverBase {
  getLicenses = async (parent: any, args: { type: string }, ctx: Context) => {
    const { user } = ctx;
    this.requireAuth(user);
    const query = [
      {
        $match: {
          userId: user.userId,
          ...(args.type && { licenseTypeId: args.type }),
        },
      },
      {
        $lookup: {
          from: 'license-types',
          localField: 'licenseTypeId',
          foreignField: 'id',
          as: 'licenseType',
        },
      },
      {
        $unwind: '$licenseType',
      },
    ];

    const licenses = await License.aggregate(query).exec();
    licenses.forEach(license => {
      const id = license._id.toString();
      const hashedId = id.slice(2, id.length - 4).replace(/[a-zA-Z0-9]/g, '#');
      license._id =
        id.substring(0, 2) + hashedId + id.substring(id.length - 4, id.length);
    });
    return licenses;
  };

  getUnhashedLicenses = async (
    parent: any,
    args: { type: string },
    ctx: Context,
  ) => {
    const { user } = ctx;
    this.requireAuth(user);
    const query = [
      {
        $match: {
          userId: user.userId,
          ...(args.type && { licenseTypeId: args.type }),
        },
      },
      {
        $lookup: {
          from: 'license-types',
          localField: 'licenseTypeId',
          foreignField: 'id',
          as: 'licenseType',
        },
      },
      {
        $unwind: '$licenseType',
      },
    ];

    const licenses = await License.aggregate(query).exec();
    licenses.forEach(license => {
      const id = license._id.toString();
      return id;
    });
    return licenses;
  };
}

const resolvers = new Resolvers();

export default {
  Query: {
    getLicenses: resolvers.getLicenses,
    getUnhashedLicenses: resolvers.getUnhashedLicenses,
  },
};
