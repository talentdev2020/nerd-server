import ResolverBase from '../common/Resolver-Base';
import { logger, config, configAws } from '../common';
import { Context, IDependentInput } from '../types';
import { Dependent, IDependentDocument } from '../models';

class Resolvers extends ResolverBase {
  addDependent = async (
    parent: any,
    args: { dependent: IDependentInput },
    ctx: Context,
  ) => {
    const { user } = ctx;
    this.requireAuth(user);

    if (!(config.brand.toLowerCase() === 'blue' || config.brand.toLowerCase() === 'galvan'))
      throw new Error('Dependents are only allowed for galvan users');

    const { userId } = user;

    try {
      const numberOfDependents = await Dependent.find({
        userId,
      }).countDocuments();
      if (numberOfDependents >= configAws.careClixMaxDependents)
        throw new Error(
          `This user already has ${configAws.careClixMaxDependents} dependents`,
        );
    } catch (error) {
      throw error;
    }

    const { dependent } = args;
    const dependentModel = new Dependent();
    dependentModel.userId = userId;
    dependentModel.firstName = dependent.firstName;
    dependentModel.lastName = dependent.lastName;
    dependentModel.height = dependent.height;
    dependentModel.weight = dependent.weight;
    dependentModel.gender = dependent.gender;
    dependentModel.title = dependent.title;
    dependentModel.dateOfBirth = dependent.dateOfBirth;
    dependentModel.relationship = dependent.relationship;
    dependentModel.contactInformation.contactPhoneType =
      dependent.contactInformation.contactPhoneType;
    dependentModel.contactInformation.countryCode =
      dependent.contactInformation.countryCode;
    dependentModel.contactInformation.phoneNumber =
      dependent.contactInformation.phoneNumber;
    dependentModel.contactInformation.email =
      dependent.contactInformation.email;
    dependentModel.contactInformation.country =
      dependent.contactInformation.country;
    dependentModel.contactInformation.zipCode =
      dependent.contactInformation.zipCode;
    dependentModel.contactInformation.state =
      dependent.contactInformation.state;
    dependentModel.blueDetails.clinic = dependent.blueDetails.clinic;
    dependentModel.blueDetails.careclixId = userId;
    dependentModel.created = new Date();
    dependentModel.smsNotification = dependent.smsNotification;
    dependentModel.emailNotification = dependent.emailNotification;

    let retDependent: IDependentDocument;
    try {
      retDependent = await dependentModel.save();
    } catch (error) {
      logger.warn(`resolvers.dependent.addDependent`);
      throw error;
    }
    return retDependent;
  };

  getMyDependents = async (parent: any, args: {}, ctx: Context) => {
    const { user } = ctx;
    this.requireAuth(user);

    if (!(config.brand.toLowerCase() === 'blue' || config.brand.toLowerCase() === 'galvan'))
      throw new Error('Dependents are only allowed for galvan users');

    const { userId } = user;
    let dependents: IDependentDocument[];
    try {
      dependents = await Dependent.find({ userId: userId });
    } catch (error) {
      logger.warn(`resolvers.dependent.getMyDependents`);
      throw error;
    }
    return dependents;
  };

  remDependent = async (parent: any, args: { _id: string }, ctx: Context) => {
    const { user } = ctx;
    this.requireAuth(user);

    if (!(config.brand.toLowerCase() === 'blue' || config.brand.toLowerCase() === 'galvan'))
      throw new Error('Dependents are only allowed for galvan users');

    const { userId } = user;
    const { _id } = args;
    const toReturn = { success: false, message: 'Nothing done' };
    try {
      const ret = await Dependent.deleteOne({ userId: userId, _id: _id });
      if (ret.deletedCount === 1) {
        toReturn.success = true;
        toReturn.message = 'dependent removed';
      } else {
        toReturn.success = false;
        toReturn.message = "record didn't find";
      }
    } catch (error) {
      logger.warn(`resolvers.dependent.remDependent`);
      toReturn.success = false;
      toReturn.message = error;
    }
    return toReturn;
  };
}

const resolvers = new Resolvers();

export default {
  Mutation: {
    addDependent: resolvers.addDependent,
    remDependent: resolvers.remDependent,
  },
  Query: {
    getMyDependents: resolvers.getMyDependents,
  },
};
