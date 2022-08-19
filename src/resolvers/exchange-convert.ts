import { logger } from '../common';
import { exchangeService } from '../services';
import ResolverBase from '../common/Resolver-Base';
import { Context } from '../types/context';
import {
  IOrderStatus,
  OrderStatus,
  IGetPriceResponse,
  IGetPrice,
  IGetFeeResponse,
} from '../types';

class Resolvers extends ResolverBase {
  status = async (
    parent: any,
    { orderId }: { orderId: string },
    { user }: Context,
  ) => {
    try {
      const orderStatus = await exchangeService.getOrderStatus({
        userId: user.userId,
        uuid: orderId,
      });
      return orderStatus;
    } catch (err) {
      logger.debug(`resolvers.exchange.convert.status.catch ${err}`);
      throw err;
    }
  };
  pricesAndFees = async (
    parent: any,
    {
      getPriceInput,
    }: {
      getPriceInput: IGetPrice;
    },
    ctx: Context,
  ): Promise<IGetPriceResponse> => {
    try {
      const {
        base,
        tokenId,
        rel,
        quantityBase,
        quantityRel,
        buyOrSell,
      } = getPriceInput;
      return exchangeService.getPrice({
        base,
        tokenId,
        rel,
        quantityBase: quantityBase || 0,
        quantityRel: quantityRel || 0,
        buyOrSell,
      });
    } catch (err) {
      logger.debug(`resolvers.exchange.convert.pricesAndFees.catch ${err}`);
      throw err;
    }
  };
  fees = async (
    parent: any,
    {
      coin,
    }: {
      coin: string;
    },
    ctx: Context,
  ): Promise<IGetFeeResponse[]> => {
    try {
      return exchangeService.getFee({
        coin,
      });
    } catch (err) {
      logger.debug(`resolvers.exchange.convert.fees.catch ${err}`);
      throw err;
    }
  };
  completed = async (
    parent: any,
    {
      from_uuid,
      limit,
      base,
      rel,
    }: { from_uuid?: string; limit?: number; base?: string; rel?: string },
    { user }: Context,
  ): Promise<IOrderStatus[]> => {
    try {
      const closedOrders = await exchangeService.getClosedOrders({
        userId: user.userId,
        base,
        rel,
      });
      return closedOrders.swaps.map(swap => ({
        orderId: swap.uuid,
        status: OrderStatus.complete,
        bought: swap.otherCoin,
        sold: swap.myCoin,
        quantity: swap.otherAmount,
        price: swap.myAmount,
      }));
    } catch (err) {
      logger.debug(`resolvers.exchange.convert.completed.catch ${err}`);
      throw err;
    }
  };
  pending = async (
    parent: any,
    {
      pendingInput,
    }: { pendingInput: { base: string; rel: string; tokenId: string } },
    { user }: Context,
  ): Promise<IOrderStatus[]> => {
    try {
      const { base, rel, tokenId } = pendingInput;
      const myOrders = await exchangeService.getOpenOrders({
        userId: user.userId,
        base,
        rel,
        tokenId: tokenId,
      });
      return myOrders.swaps.map(swap => ({
        orderId: swap.uuid,
        status: OrderStatus.converting,
        bought: swap.otherCoin,
        sold: swap.myCoin,
        quantity: swap.otherAmount,
        price: swap.myAmount,
      }));
    } catch (err) {
      logger.debug(`resolvers.exchange.convert.pending.catch ${err}`);
      throw err;
    }
  };
  cancel = async (
    parent: any,
    { orderId, walletPassword }: { orderId: string; walletPassword: string },
    { user, wallet }: Context,
  ) => {
    try {
      await this.validateWalletPassword({
        password: walletPassword,
        symbol: '',
        walletApi: wallet,
        user,
      });
      const cancelStatus = await exchangeService.cancel({
        walletPassword,
        userId: user.userId,
        uuid: orderId,
      });
      return { result: cancelStatus.result };
    } catch (err) {
      logger.debug(`resolvers.exchange.convert.cancel.catch ${err}`);
      throw err;
    }
  };
  ticks = async (parent: any, args: any, ctx: Context) => {
    try {
      const { ticks } = await exchangeService.getTicks();
      return ticks.slice(0, 20);
    } catch (err) {
      logger.debug(`resolvers.exchange.convert.ticks.catch ${err}`);
      throw err;
    }
  };
  markets = async (parent: any, args: any, ctx: Context) => {
    try {
      const { markets } = await exchangeService.getMarkets();
      return markets
        .map(market => ({
          ...market,
          relationships: market.relationships.map(relationship => ({
            ...relationship,
            lastPrice: relationship.last,
          })),
        }))
        .slice(0, 20);
    } catch (err) {
      logger.debug(`resolvers.exchange.convert.markets.catch ${err}`);
      throw err;
    }
  };
}

const resolvers = new Resolvers();

export default {
  Query: {
    markets: resolvers.markets,
    ticks: resolvers.ticks,
    status: resolvers.status,
    pricesAndFees: resolvers.pricesAndFees,
    completed: resolvers.completed,
    pending: resolvers.pending,
    fees: resolvers.fees,
  },
  Mutation: {
    cancelConvert: resolvers.cancel,
  },
};
