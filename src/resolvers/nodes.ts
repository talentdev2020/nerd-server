import { Context } from 'src/types/context';
import ResolverBase from 'src/common/Resolver-Base';
import { IOrderContext } from 'src/types';
import { logger } from 'src/common';
import {
  Product,
  IProductDocument,
  PurchaseAttempt,
  MiningRecord,
} from '../models';
import { simulateNodeDistributionPipeline } from 'src/pipelines';
import License from 'src/models/license';
import { nodeServices } from 'src/services';

class Resolvers extends ResolverBase {
  getProductById = async (parent: any, { id }: { id: string }) => {
    const product = await Product.findById(id).exec();
    return product;
  };

  getAllProducts = async () => {
    let products: IProductDocument[];
    try {
      products = await Product.find({})
        .select('id name shownPrice description -_id')
        .exec();
      // throw new Error("Injected Error for test");
    } catch (error) {
      logger.warn(`resolvers.nodes.getAllProducts.catch: ${error}`);
      /**
       * The next doesn't work because the resolver
       * getAllproducts must return [Product]!
       * Insted graphql returns
       * "message": "Expected Iterable, but did not find one for field 
       return {
        success: false,
        message: error
      }
      };*/
      //consider to throw new ApolloError in the next line
      throw error;
    }
    return products;
  };

  getNodesInfo = async (parent: any, args: {}, ctx: Context) => {
    return {};
  };

  getNodesOnline = async (parent: any, args: {}, ctx: Context) => {
    logger.debug('GET_NODES_ONLINE');
    try {
      const { userId } = ctx.user
      const nodesOnline = await nodeServices.getNodesOnline(userId)
      return nodesOnline;
    } catch (err) {
      logger.warn(`resolvers.nodes.getNodesOnline.catch: ${err}`);
      return {
        success: false,
        message: err,
      };
    }
  };

  getNodesOwned = async (parent: any, args: {}, ctx: Context) => {
    logger.debug('GET_NODES_OWNED');
    try {
      const userId = ctx.user.userId;
      logger.debug(`resolvers.nodes.getNodesOwned.userId: ${userId}`);
      const nodesOwned = await License.find({ userId })
        .countDocuments()
        .exec();
      logger.debug(`resolvers.nodes.getNodesOwned.nodesOwned: ${nodesOwned}`);
      return nodesOwned;
    } catch (err) {
      logger.warn(`resolvers.nodes.getNodesOwned.catch: ${err}`);
      return {
        success: false,
        message: err,
      };
    }
  };

  buyNode = async (
    parent: any,
    {
      coinSymbol,
      productId,
      quantity,
      walletPassword,
      orderContext,
    }: {
      quantity: number;
      coinSymbol: string;
      productId: string;
      walletPassword: string;
      orderContext: IOrderContext;
    },
    { user, wallet, dataSources: { blockfunnels } }: Context,
  ) => {
    const purchaseLog = new PurchaseAttempt({
      userId: user?.userId,
      quantity,
      coinSymbol,
      productId,
      lastCompletedOperation: 'args',
      walletPasswordExists: walletPassword.length > 1,
      orderContext,
    });
    try {
      this.requireAuth(user);
      purchaseLog.lastCompletedOperation = 'authenticated';
      // Check wallet password and fail if incorrect
      await this.validateWalletPassword({
        password: walletPassword,
        symbol: coinSymbol,
        walletApi: wallet,
        user,
      });
      purchaseLog.lastCompletedOperation = 'password validated';

      // Make call to Blockfunnels to create order and get invoiceAddress
      const order = await blockfunnels.orderProduct({
        productId,
        productAmount: quantity,
        context: orderContext,
        id: user.userId,
      });
      purchaseLog.lastCompletedOperation = 'order received from blockfunnels';
      purchaseLog.orderId = order?.id;
      purchaseLog.invoiceAddress = order?.invoiceAddress;
      purchaseLog.btcValue = order?.btcValue;
      logger.debug(`resolvers.nodes.buyNode.order: ${order}`);
      // send BTC transaction to invoiceAddress
      const walletApi = wallet.coin(coinSymbol);
      const outputs = [{ to: order.invoiceAddress, amount: order.btcValue }];
      const result = await walletApi.send(user, outputs, walletPassword);
      purchaseLog.lastCompletedOperation = 'wallet transaction sent';
      purchaseLog.txHash = result?.transaction?.id;
      purchaseLog.success = result?.success;
      purchaseLog.successMessage = result?.message;
      await purchaseLog.save();
      return result;
    } catch (error) {
      logger.exceptionContext(error, 'resolvers.nodes.buyNode.catch');
      purchaseLog.error = error;
      purchaseLog.save();
      return {
        success: false,
        message: error,
      };
    }
  };

  simulateNodeDistribution = async (
    parent: any,
    args: { startDate: Date; endDate: Date },
    { user }: Context,
  ) => {
    try {
      this.requireAuth(user);
      const pipeline = simulateNodeDistributionPipeline(
        args.startDate,
        args.endDate,
      );
      const [data] = await MiningRecord.aggregate(pipeline);

      return data;
    } catch (error) {
      logger.exceptionContext(error, 'resolvers.nodes.buyNode.catch');
      throw error;
    }
  };
}

const resolvers = new Resolvers();

export default {
  Query: {
    productById: resolvers.getProductById,
    getAllproducts: resolvers.getAllProducts,
    nodesInfo: resolvers.getNodesInfo,
  },
  NodesInfo: {
    online: resolvers.getNodesOnline,
    owned: resolvers.getNodesOwned,
  },
  Mutation: {
    buyNode: resolvers.buyNode,
    simulateNodeDistribution: resolvers.simulateNodeDistribution,
  },
};
