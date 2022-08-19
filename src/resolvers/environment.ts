import { Context } from '../types';
import ResolverBase from '../common/Resolver-Base';
import { IEnvironmentModel, Environment } from '../models';
import { logger } from '../common';

class Resolvers extends ResolverBase {
  getEnvironment = async (
    parent: any,
    args: { host: string },
    { user }: Context,
  ): Promise<IEnvironmentModel> => {
    this.requireAuth(user);
    const { host } = args;

    try {
      const envs = await Environment.find({}).exec();

      if (host && host.toLowerCase().indexOf('localhost') > 0) {
        for (const env of envs) {
          if (env.domain.indexOf('localhost') > 0) {
            return env;
          }
        }
      } else {
        for (const env of envs) {
          if (env.domain.indexOf('localhost') < 0) {
            return env;
          }
        }
      }
    } catch (error) {
      logger.warn(`resolvers.environments.catch:${error}`);
      throw error;
    }
    return undefined;
  };
}

const resolvers = new Resolvers();

export default {
  Query: {
    environment: resolvers.getEnvironment,
  },
};
