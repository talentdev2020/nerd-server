import ResolverBase from '../common/Resolver-Base';
import { simplexJwtService, simplexEventsService } from '../services';
import { SimplexCryptoCurrency, SimplexFiatCurrency, Context } from '../types';
import { SimplexOrder } from '../models';
import { WalletConfig } from '../common';

class Resolvers extends ResolverBase {
  public getQuote = async (
    parent: any,
    args: {
      simplexQuoteInput: {
        sourceAmount: number;
        sourceCurrency: SimplexCryptoCurrency;
        targetCurrency: SimplexFiatCurrency;
        clientIp: string;
      };
    },
    { user }: Context,
  ) => {
    this.requireAuth(user);
    const quote = await simplexJwtService.getQuote(args.simplexQuoteInput);
    return quote;
  };

  public getBuyUrl = async (
    parent: any,
    args: {
      simplexBuyUrlInput: {
        cryptoAddress: string;
        cryptoCurrency: SimplexCryptoCurrency;
        fiatCurrency: SimplexFiatCurrency;
        fiatAmount: number;
      };
    },
    { user }: Context,
  ) => {
    this.requireAuth(user);
    const buyUrl = await simplexJwtService.buyCryptoUrl({
      ...args.simplexBuyUrlInput,
      userId: user.userId,
    });
    return { url: buyUrl };
  };

  public getOrders = async (
    parent: any,
    { saveEvents }: { saveEvents: boolean },
    { user }: Context,
  ) => {
    this.requireAuth(user);
    let upToDate = true;

    if (saveEvents) {
      // hit simplex-events lambda and wait for events to be saved before continuing
      const { success } = await simplexEventsService.saveEvents(user.userId);
      upToDate = success;
    }
    const orders = await SimplexOrder.find({ userId: user.userId });
    const ordersWithIcons = orders.map(order => {
      const matchingWalletConfig = WalletConfig.getWalletConfigurations().find(
        wallet => wallet.symbol === order.cryptoAmount.currency,
      );
      order.cryptoIcon = matchingWalletConfig ? matchingWalletConfig.icon : '';
      return order;
    });
    return { orders: ordersWithIcons, upToDate };
  };
}

const resolvers = new Resolvers();

export default {
  Query: {
    simplexQuote: resolvers.getQuote,
    simplexBuyUrl: resolvers.getBuyUrl,
    simplexOrders: resolvers.getOrders,
  },
};
