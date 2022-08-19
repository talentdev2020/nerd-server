import { logger, ResolverBase } from 'src/common';
import { Context } from 'src/types/context';
import {
  ICareclixConfirmTelemed,
  ICareclixUser,
} from 'src/types/ICareclixUser';
import { CareclixDemographic } from 'src/models';

class Resolvers extends ResolverBase {
  getCareclixDemographics = async (
    _parent: any,
    args: { params: ICareclixUser },
    ctx: Context,
  ) => {
    // const { user } = ctx;
    // this.requireAuth(user);
    try {
      const visitedTelemed = false;
      const sentToTelemed = false;
      const saveToDb = {
        productId: args.params.productId,
        userId: args.params.userId,
        email: args.params.email,
        clinicIds: args.params.clinicIds,
        firstName: args.params.firstName,
        lastName: args.params.lastName,
        dateOfBirth: {
          year: args.params.dateOfBirth.year,
          month: args.params.dateOfBirth.month,
          day: args.params.dateOfBirth.day,
        },
        gender: args.params.gender,
        phoneNumber: {
          type: args.params.phoneNumber.type,
          country: args.params.phoneNumber.countryCode,
          number: args.params.phoneNumber.number,
          code: args.params.phoneNumber.code,
        },
        address: {
          street: args.params.address.street,
          city: args.params.address.city,
          state: args.params.address.state,
          zipCode: args.params.address.zipCode,
          country: args.params.address.country,
        },
        visitedTelemed: visitedTelemed,
        sentToTelemed: sentToTelemed,
        created: new Date(),
      };
      const dbResponse = await CareclixDemographic.create(saveToDb);
      return true;
    } catch (err) {
      logger.error(err + ' careclix-demographic resolver error');
    }
  };
  confirmVisitedTelemed = async (
    _parent: any,
    args: { params: ICareclixConfirmTelemed },
    ctx: Context,
  ) => {
    // const { user } = ctx;
    // this.requireAuth(user);
    try {
      await CareclixDemographic.updateOne(
        { userId: args.params.userId },
        {
          $set: {
            visitedTelemed: args.params.visitedTelemed,
          },
        },
      );
    } catch (err) {
      throw new Error(err);
    }
    const {
      firstName,
      lastName,
      address,
      dateOfBirth,
      gender,
      phoneNumber,
    } = await CareclixDemographic.findOne(
      { userId: args.params.userId },
      {
        _id: 0,
        firstName: 1,
        lastName: 1,
        dateOfBirth: 1,
        gender: 1,
        address: 1,
        phoneNumber: 1,
      },
    )
      .lean()
      .exec();
    return true;
  };
}
const resolvers = new Resolvers();

export default {
  Mutation: {
    getCareclixDemographics: resolvers.getCareclixDemographics,
    confirmVisitedTelemed: resolvers.confirmVisitedTelemed,
  },
};
