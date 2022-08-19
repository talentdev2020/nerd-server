import { logger, ResolverBase } from 'src/common';
import { Context } from 'src/types/context';
import { LicenseTypeModel } from 'src/models';
import { ILicenseType } from 'src/types';

class Resolvers extends ResolverBase {
  getAllLicenseTypes = async (
    _parent: any,
    args: any,
    ctx: Context,
  ): Promise<ILicenseType[]> => {
    const { user } = ctx;
    this.requireAdmin(user);

    try {
      const licenseTypes = LicenseTypeModel.find({}).exec();

      return licenseTypes;
    } catch (error) {
      logger.warn(`resolvers.license-type.getLicenseTypes.catch: ${error}`);
      throw new Error("Unable to find license-types: " + error.message);
    }
  };

  createLicenseType = async (
    _parent: any,
    args: {
      name: string;
      rewardType: string;
      environmentType: string;
      topPerformingMinerRewardPerDollarMined: number;
      remainingMinerRewardPerDollarMined: number;
      concurrentDevices: number;
      promoPointsPerDay: number;
      nodeType: string;
      fullNode: boolean;
      destinationLicenseTypeId: string;
    },
    ctx: Context,
  ): Promise<ILicenseType> => {
    const { user } = ctx;
    this.requireAdmin(user);

    const { 
      name, 
      rewardType, 
      environmentType, 
      topPerformingMinerRewardPerDollarMined, 
      remainingMinerRewardPerDollarMined, 
      concurrentDevices,
      promoPointsPerDay,
      nodeType,
      fullNode,
      destinationLicenseTypeId,
      } = args;
    try {
      const licenseTypeModel = new LicenseTypeModel({
        name,
        rewardType, 
        environmentType, 
        topPerformingMinerRewardPerDollarMined, 
        remainingMinerRewardPerDollarMined, 
        concurrentDevices,
        promoPointsPerDay,
        nodeType,
        fullNode,
        destinationLicenseTypeId,
      });
      const newLicenseType = await licenseTypeModel.save();

      return newLicenseType;
    } catch (error) {
      logger.warn(`resolvers.license-type.createLicenseType.catch: ${error}`);
      throw new Error("Unable to create license-type: " + error.message);
    }
  };
}

const resolvers = new Resolvers();

export default {
  Query: {
    getAllLicenseTypes: resolvers.getAllLicenseTypes,
  },
  Mutation: {
    createLicenseType: resolvers.createLicenseType,
  },
};
