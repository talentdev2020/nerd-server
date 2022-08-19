import { Context, IGameOrder, IOrderContext } from '../types';
import ResolverBase from '../common/Resolver-Base';
import { gameItemService } from '../services/game-item';
import { configSecrets } from '../common';
import { GameOrder, GameProduct, IGameProductDocument } from '../models';
// import { exchangeService } from '../services';

class Resolvers extends ResolverBase {
  private getOrderDetails = async (
    product: IGameProductDocument,
    quantity: number,
    userId: string,
    orderContext: IOrderContext,
  ): Promise<IGameOrder> => {
    const galaUsdPrice = 0.05; // TODO: pull this value from the api-dex server eventually
    const totalGala = (quantity * (product.priceUsd / galaUsdPrice)).toFixed(8);
    return {
      galaUsdPrice: galaUsdPrice,
      created: new Date(),
      gameProductId: product._id,
      totalGala: +totalGala,
      isUpgradeOrder: false,
      itemsReceived: [],
      perUnitPriceUsd: product.priceUsd,
      quantity,
      txHash: '',
      userId,
      context: orderContext,
    };
  };

  getOwnedItems = async (parent: any, args: {}, { user }: Context) => {
    this.requireAuth(user);
    try {
      const dbUser = await user.findFromDb();
      const userEthAddress = dbUser?.wallet?.ethAddress;
      if (!userEthAddress) {
        return [];
      }
      const userItems = await gameItemService.getUserItems(userEthAddress);

      // const closedOrders = await exchangeService.getClosedOrders({
      //   userId: user.userId,
      // });

      // const listedItems = await exchangeService.getOpenOrders({
      //   userId: user.userId,
      //   base: 'a',
      //   rel: 'a',
      //   tokenId: '0',
      // });

      return userItems.map(userItem => {
        const lesserBalance = Math.min(
          +userItem.balance.confirmed,
          +userItem.balance.pending,
        );
        return {
          name: userItem.name,
          image: userItem.image,
          description: userItem.description,
          game: userItem.game,
          baseId: userItem.baseId,
          icon: userItem.properties.rarity.icon,
          coin: 'GALA',
          tradeWaitTime: 0,
          withdrawalWaitTime: 0,
          galaFee: 0,
          quantityOwned: lesserBalance || 0,
          rarity: userItem.properties.rarity,

          //   items: userItem.items.map(item => {
          //     const listedItem = listedItems.swaps.find(swap => {
          //       return swap.tokenId === item.id;
          //     });
          //     const purchasedOrder = closedOrders.swaps
          //       .sort((swapA, swapB) => {
          //         return swapA.startedAt - swapB.startedAt;
          //       })
          //       .find(swap => swap.tokenId === userItem.id);
          //     const isListed = item.id ? !!listedItem : false;
          //     const orderId = item.id && isListed ? listedItem.uuid : undefined;
          //     return {
          //       ...item,
          //       tokenId: item.id,
          //       isListed,
          //       orderId,
          //       purchasePrice: purchasedOrder?.myAmount,
          //     };
          //   }),
          // };
        };
      });
    } catch (error) {
      throw error;
    }
  };

  getFarmBotRequiredParts = async (parent: any, args: {}, ctx: Context) => {
    this.requireAuth(ctx.user);
    try {
      const items = await gameItemService.getFarmBotRequiredItems(
        ctx.user.userId,
      );
      return {
        ...items,
        coin: 'GALA',
        requiredPieces: items.requiredPieces.map((piece: any) => {
          return {
            ...piece,
            baseId: piece.id,
            coin: 'GALA',
          };
        }),
      };
    } catch (error) {
      throw error;
    }
  };

  getCraftedItemsByGameName = async (
    parent: any,
    args: { gameName: string },
    ctx: Context,
  ) => {
    this.requireAuth(ctx.user);
    try {
      const items = await gameItemService.getCraftedItemsAndRequiredParts(
        ctx.user.userId,
        args.gameName,
      );
      return items;
    } catch (error) {
      throw error;
    }
  };

  verifyEnoughItemsLeft = async (
    quantityRequested: number,
    product: IGameProductDocument,
    userId: string,
  ) => {
    let supplyRemaining;
    if (product.baseId) {
      supplyRemaining = await gameItemService.getRemaingSupplyForBaseId(
        userId,
        product.baseId,
      );
    } else {
      supplyRemaining = await gameItemService.getRemainingSupplyForRandomItems(
        userId,
      );
    }
    return supplyRemaining > quantityRequested;
  };

  openLootboxes = async (
    parent: any,
    args: { lootBoxIds: string[] },
    ctx: Context,
  ) => {
    const { user } = ctx;
    const { lootBoxIds } = args;
    this.requireAuth(user);
    try {
      const result = await gameItemService.markLootBoxesOpened(
        user.userId,
        lootBoxIds,
      );

      return {
        success: !!result,
        message: result ? '' : result,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  };

  private getProduct = async (productId: string) => {
    const notFound = new Error('Product not found');
    try {
      const product = await GameProduct.findById(productId).exec();
      if (!product) throw notFound;
      return product;
    } catch (error) {
      throw notFound;
    }
  };

  private assignItems = async (
    userId: string,
    ethAddress: string,
    quantityRequested: number,
    baseId: string,
  ) => {
    let itemsReceived: string[];
    if (baseId) {
      itemsReceived = await gameItemService.assignItemToUserByTokenId(
        userId,
        ethAddress,
        baseId,
        quantityRequested,
      );
    } else {
      itemsReceived = await gameItemService.assignItemsToUser(
        userId,
        ethAddress,
        quantityRequested,
      );
    }

    return itemsReceived;
  };

  buyGameProducts = async (
    parent: any,
    args: {
      numLootBoxes: number;
      walletPassword: string;
      quantity: number;
      productId: string;
      orderContext: IOrderContext;
    },
    ctx: Context,
  ) => {
    const { user, wallet } = ctx;
    this.requireAuth(user);
    const { quantity, walletPassword, productId, orderContext = {} } = args;
    const { wallet: userWallet } = await user.findFromDb();
    const product = await this.getProduct(productId);
    const isEnoughLeft = await this.verifyEnoughItemsLeft(
      quantity,
      product,
      user.userId,
    );
    if (!isEnoughLeft) {
      throw new Error('Product out of stock');
    }
    const ethAddress = userWallet?.ethAddress || '';
    const galaWallet = wallet.coin('GALA');
    const orderDetails = await this.getOrderDetails(
      product,
      quantity,
      user.userId,
      orderContext,
    );
    const outputs = [
      {
        to: configSecrets.companyFeeEthAddress,
        amount: orderDetails.totalGala.toFixed(8),
      },
    ];
    const { success, message, transaction } = await galaWallet.send(
      user,
      outputs,
      walletPassword,
    );

    if (!success) {
      throw new Error(message || 'Transaction failed');
    }
    orderDetails.txHash = transaction.id;
    orderDetails.itemsReceived = await this.assignItems(
      user.userId,
      ethAddress,
      quantity,
      product.baseId,
    );

    GameOrder.create(orderDetails);
    const items = await this.getOwnedItems(parent, args, ctx);
    return {
      items,
      transactionHash: orderDetails.txHash,
      totalGala: orderDetails.totalGala,
    };
  };

  getAvailableGameProducts = async (parent: any, args: {}, ctx: Context) => {
    this.requireAuth(ctx.user);
    const gameProducts = (await GameProduct.find({})
      .lean()
      .exec()) as IGameProductDocument[];
    return gameProducts.map(gameProduct => ({
      ...gameProduct,
      id: gameProduct._id,
    }));
  };
}

const resolvers = new Resolvers();

export default {
  Query: {
    ownedItems: resolvers.getOwnedItems,
    farmBotRequired: resolvers.getFarmBotRequiredParts,
    craftedItemsByGameName: resolvers.getCraftedItemsByGameName,
    gameProducts: resolvers.getAvailableGameProducts,
  },
  Mutation: {
    openLootBoxes: resolvers.openLootboxes,
    buyGameProducts: resolvers.buyGameProducts,
  },
};
