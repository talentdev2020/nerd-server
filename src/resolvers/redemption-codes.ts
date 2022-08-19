import { Context } from '../types';
import ResolverBase from '../common/Resolver-Base';
import { redemptionCodesService } from '../services/redemption-codes';
import { IRedemptionCode } from 'src/models';

class Resolvers extends ResolverBase {
  createRedemptionCode = async (
    _parent: any,
    args: {
      createRedemptionCode: {
        code: string;
        isActive: boolean;
        redeemableBy?: string;
        description?: string;
        value?: number;
      };
    },
    { user }: Context,
  ): Promise<IRedemptionCode> => {
    this.requireAuth(user);
    this.requireAdmin(user);
    
    const {
      code,
      isActive,
      redeemableBy,
      description,
      value,
    } = args.createRedemptionCode;

    const newRedemptionCode = {
      code: code,
      isActive: isActive,
      redeemableBy: redeemableBy,
      description: description,
      value: value,
    };

    return await redemptionCodesService.createRedemptionCode(newRedemptionCode);
  };

  getRedemptionCodes = async (
    _parent: any,
    args: {},
    { user }: Context,
  ): Promise<IRedemptionCode[]> => {
    this.requireAuth(user);
    return await redemptionCodesService.getRedemptionCodes();
  };

  getRedemptionCodesByUser = async (
    _parent: any,
    args: {},
    { user }: Context,
  ): Promise<IRedemptionCode[]> => {
    this.requireAuth(user);

    return await redemptionCodesService.getRedemptionCodesByUser(user.userId);
  }

  updateRedemptionCode = async (
    _parent: any,
    args: {
      updateRedemptionCode: {
        code: string;
        isActive: boolean;
      };
    },
    { user }: Context,
  ): Promise<IRedemptionCode> => {
    this.requireAuth(user);
    this.requireAdmin(user);

    const {
      code,
      isActive,
    } = args.updateRedemptionCode;

    return await redemptionCodesService.updateRedemptionCode(code, isActive);
  };

  redeemCode = async (
    _parent: any,
    args: {
      code: string
    },
    { user }: Context,
  ): Promise<any> => {
    this.requireAuth(user);

    // check that redeeming code is valid
    return redemptionCodesService.validateCode(args.code, user.userId);
  }
}

const resolvers = new Resolvers();

export default {
  Query: {
    getRedemptionCodes: resolvers.getRedemptionCodes,
    getRedemptionCodesByUser: resolvers.getRedemptionCodesByUser,
  },
  Mutation: {
    createRedemptionCode: resolvers.createRedemptionCode,
    updateRedemptioncode: resolvers.updateRedemptionCode,
    redeemCode: resolvers.redeemCode,
  },
};