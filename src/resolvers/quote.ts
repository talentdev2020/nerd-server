import ResolverBase from '../common/Resolver-Base';
import { Context } from '../types/context';
import { WalletConfig } from '../models';

class Resolvers extends ResolverBase {
  getQuote = async (
    parent: any,
    { usdValueInCents }: { usdValueInCents: number },
    _: Context,
  ) => {
    const { galaToUsdRatio } = await WalletConfig.findOne(
      { brand: 'gala' },
      { galaToUsdRatio: 1 },
    );
    return {
        galaPrice: (usdValueInCents / 100) / galaToUsdRatio,
    };
  };
}

const resolvers = new Resolvers();

export default {
  Query: {
    quote: resolvers.getQuote,
  },
};
