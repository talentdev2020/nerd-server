import { Context } from '../types/context';
import { logger, config, configAws } from '../common';
import ResolverBase from '../common/Resolver-Base';
const autoBind = require('auto-bind');
import * as topSupportedCryptoFavorites from '../data/topSupportedFavoriteOptions.json';
import { UserInputError } from 'apollo-server-express';

class Resolvers extends ResolverBase {
  supportedFavorites = topSupportedCryptoFavorites.slice(0, 200);
  supportedFavoritesMap: Map<
    string,
    { symbol: string; name: string }
  > = new Map();
  constructor() {
    super();
    autoBind(this);
    this.supportedFavorites.forEach(fav =>
      this.supportedFavoritesMap.set(fav.symbol, fav),
    );
  }

  async getFavorites(
    parent: any,
    args: {},
    { user, dataSources: { cryptoFavorites } }: Context,
  ) {
    try {
      logger.debug(
        `resolvers.crypto-favorites.getFavorites.userId:${user && user.userId}`,
      );
      this.requireAuth(user);
      logger.debug(`resolvers.crypto-favorites.getFavorites.userId:ok`);
      const foundUser = await user.findFromDb();
      logger.debug(
        `resolvers.crypto-favorites.getFavorites.foundUser.id:${foundUser.id}`,
      );
      const { wallet } = foundUser;
      logger.debug(
        `resolvers.crypto-favorites.getFavorites.foundUser.wallet:${wallet &&
          wallet.id}`,
      );
      if (!wallet) {
        const updatedUser = await user.setWalletAccountToUser();
        logger.debug(
          `resolvers.crypto-favorites.getFavorites.foundUser.wallet.!!updatedUser:${!!updatedUser}`,
        );
        const favoritesFullData = await cryptoFavorites.getUserFavorites(
          updatedUser.wallet.cryptoFavorites,
        );
        logger.debug(
          `resolvers.crypto-favorites.getFavorites.foundUser.wallet.favoritesFullData.length:${favoritesFullData.length}`,
        );
        return favoritesFullData;
      }
      const userFavoritesFullData = await cryptoFavorites.getUserFavorites(
        wallet.cryptoFavorites,
      );
      logger.debug(
        `resolvers.crypto-favorites.getFavorites.foundUser.wallet.userFavoritesFullData.length:${userFavoritesFullData.length}`,
      );
      return userFavoritesFullData;
    } catch (error) {
      logger.debug(`resolvers.crypto-favorites.getFavorites.catch:${error}`);
      throw error;
    }
  }

  async getFavoritesNew(parent: any, args: {}, { user }: Context) {
    try {
      this.requireAuth(user);
      const userFavoriteMap = new Map();
      const foundUser = await user.findFromDb();
      const { wallet } = foundUser;
      if (wallet) {
        wallet.cryptoFavorites.forEach(fav => userFavoriteMap.set(fav, true));
      } else {
        await user.setWalletAccountToUser();
        configAws.defaultCryptoFavorites.forEach(fav =>
          userFavoriteMap.set(fav, true),
        );
      }
      return this.supportedFavorites.map(supportedFavorite => {
        return {
          ...supportedFavorite,
          following: !!userFavoriteMap.get(supportedFavorite.symbol),
        };
      });
    } catch (error) {
      logger.debug(`resolvers.crypto-favorites.getFavorites.catch:${error}`);
      throw error;
    }
  }

  async addFavorite(
    parent: any,
    args: { symbol: string },
    { user, dataSources: { cryptoFavorites } }: Context,
  ) {
    try {
      logger.debug(
        `resolvers.crypto-favorites.addFavorite.userId:${user && user.userId}`,
      );
      logger.debug(
        `resolvers.crypto-favorites.addFavorite.args.symbol:${args.symbol}`,
      );
      this.requireAuth(user);
      logger.debug(`resolvers.crypto-favorites.addFavorite.requireAuth:ok`);
      const foundUser = await user.findFromDb();
      logger.debug(
        `resolvers.crypto-favorites.addFavorite.foundUser.id:${foundUser.id}`,
      );
      const { wallet } = <{ wallet: any }>foundUser;
      wallet.cryptoFavorites.addToSet(args.symbol);
      await foundUser.save();
      logger.debug(
        `resolvers.crypto-favorites.addFavorite.foundUser.save():done`,
      );
      return cryptoFavorites.getUserFavorites(wallet.cryptoFavorites);
    } catch (error) {
      logger.warn(`resolvers.crypto-favorites.addFavorite.catch:${error}`);
      throw error;
    }
  }

  async removeFavorite(
    parent: any,
    args: { symbol: string },
    { user, dataSources: { cryptoFavorites } }: Context,
  ) {
    try {
      logger.debug(
        `resolvers.crypto-favorites.removeFavorite.userId:${user &&
          user.userId}`,
      );
      logger.debug(
        `resolvers.crypto-favorites.removeFavorite.args.symbol:${args.symbol}`,
      );
      this.requireAuth(user);
      logger.debug(`resolvers.crypto-favorites.removeFavorite.requireAuth:ok`);
      const foundUser = await user.findFromDb();
      logger.debug(
        `resolvers.crypto-favorites.removeFavorite.foundUser.id:${foundUser.id}`,
      );
      const { wallet } = <{ wallet: any }>foundUser;
      wallet.cryptoFavorites.remove(args.symbol);
      await foundUser.save();
      logger.debug(`resolvers.crypto-favorites.removeFavorite.save():done`);
      return cryptoFavorites.getUserFavorites(wallet.cryptoFavorites);
    } catch (error) {
      logger.warn(`resolvers.crypto-favorites.removeFavorite.catch:${error}`);
      throw error;
    }
  }

  async addFavoriteNew(
    parent: any,
    args: { symbol: string },
    { user, dataSources: { cryptoFavorites } }: Context,
  ) {
    try {
      this.requireAuth(user);
      const favoriteSupported = !!this.supportedFavoritesMap.get(args.symbol);
      if (!favoriteSupported)
        throw new UserInputError(`${args.symbol} not supported as a favorite`);
      const foundUser = await user.findFromDb();
      const { wallet } = <{ wallet: any }>foundUser;
      wallet.cryptoFavorites.addToSet(args.symbol);
      await foundUser.save();
      return {
        success: true,
      };
    } catch (error) {
      logger.warn(`resolvers.crypto-favorites.addFavorite.catch:${error}`);
      throw error;
    }
  }

  async removeFavoriteNew(
    parent: any,
    args: { symbol: string },
    { user }: Context,
  ) {
    try {
      this.requireAuth(user);
      const foundUser = await user.findFromDb();
      const { wallet } = <{ wallet: any }>foundUser;
      wallet.cryptoFavorites.remove(args.symbol);
      await foundUser.save();
      return {
        success: true,
      };
    } catch (error) {
      logger.warn(`resolvers.crypto-favorites.removeFavorite.catch:${error}`);
      throw error;
    }
  }

  getSupportedFavorites = () => {
    return this.supportedFavorites;
  };
}

const resolvers = new Resolvers();

export default {
  Query: {
    favorites: resolvers.getFavorites,
    favoritesNew: resolvers.getFavoritesNew,
    supportedFavorites: resolvers.getSupportedFavorites,
  },
  Mutation: {
    addFavorite: resolvers.addFavorite,
    removeFavorite: resolvers.removeFavorite,
    addFavoriteNew: resolvers.addFavoriteNew,
    removeFavoriteNew: resolvers.removeFavoriteNew,
  },
};
