import { SentryLogger } from './logger';

interface IResolver {
  [key: string]: (
    parent: any,
    args: { [key: string]: any },
    context: any,
    info: any,
  ) => any;
}

interface IResolverConfig {
  Query?: IResolver;
  Mutation?: IResolver;
  [key: string]: IResolver;
}

export default function logResolver(resolverConfig: IResolverConfig) {
  return Object.entries(resolverConfig).reduce(
    (finalResolverConfig: any, [queryType, resolvers]) => {
      finalResolverConfig[queryType] = Object.entries(resolvers).reduce(
        (finalResolvers, [resolverName, resolverFunction]) => {
          finalResolvers[resolverName] = (
            parent: any,
            args: any,
            context: { logger: SentryLogger },
            info: any,
          ) => {
            context.logger.setResolverType(queryType);
            context.logger.setResolverName(resolverName);
            return resolverFunction(parent, args, context, info);
          };
          return finalResolvers;
        },
        {} as { [key: string]: any },
      );
      return finalResolverConfig;
    },
    {},
  ) as IResolverConfig;
}
