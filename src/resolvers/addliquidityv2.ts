import { ResolverBase, configAws, logger } from 'src/common';
import { Context } from '../types/context';
import { ethers } from 'ethers';
import Erc20API from 'src/wallet-api/coin-wallets/erc20-wallet';

import { addLiquidityV2 } from '../services/addliquidityv2';



class LiquidityResolverV2 extends ResolverBase {
  validatePasscode = async (
    parent: any,
    args: {
      walletPasscode: string;
    },
    { user, wallet }: Context,
  ) => {
    this.requireAuth(user);
    try {
      await this.validateWalletPassword({
        password: args.walletPasscode,
        symbol: '',
        walletApi: wallet,
        user,
      });
      return {
        message: 'Connected',
      };
    } catch (error) {
      throw new Error('Wrong password');
    }
  };

  createPair = async (
    parent: any,
    args: {
      walletPassword: string;
      coinSymbol0: string;
      coinSymbol1: string;
    },
    { user, wallet }: Context,
  ) => {
    this.requireAuth(user);
    const inputToken = wallet.coin(args.coinSymbol0) as Erc20API;
    const token0 = inputToken.contractAddress;
    const outputToken = wallet.coin(args.coinSymbol1) as Erc20API;
    const token1 = outputToken.contractAddress;
    const { receiveAddress } = await inputToken.getWalletInfo(user);

    const validPassword = await inputToken.checkPassword(
      user,
      args.walletPassword,
    );

    if (!validPassword) {
      return {
        message: 'Invalid Password',
        pairAddress: "Pair couldn't be created.",
      };
    }

    let decryptedPassword;
    try {
      const encryptedKey = await inputToken.getEncryptedPrivKey(user.userId);
      const decryptedPrivateKey = this.decrypt(
        encryptedKey,
        args.walletPassword,
      );
      const { decryptedString } = decryptedPrivateKey;
      decryptedPassword = decryptedString;
    } catch (e) {
      logger.warn('EncryptedKey no return instead we reach a 401 status' + e);
    }

    const createPairArgs = {
      decryptedPassword,
      token0,
      token1,
    };
    const createPair = await addLiquidityV2.createPair(createPairArgs);

    return createPair;
  };

  getPairInfo = async (
    parent: any,
    args: {
      coinSymbol0: string;
      coinSymbol1: string;
      walletPassword: string;
    },
    ctx: Context,
  ) => {
    this.requireAuth(ctx.user);
    const inputToken = ctx.wallet.coin(args.coinSymbol0) as Erc20API;
    const token0 = inputToken.contractAddress;
    const decimals0 = inputToken.decimalPlaces;
    const outputToken = ctx.wallet.coin(args.coinSymbol1) as Erc20API;
    const token1 = outputToken.contractAddress;
    const decimals1 = outputToken.decimalPlaces;
    const { receiveAddress } = await inputToken.getWalletInfo(ctx.user);

    const validPassword = await inputToken.checkPassword(
      ctx.user,
      args.walletPassword,
    );

    if (!validPassword) {
      return {
        message: 'Invalid Password',
        reserve0: '',
        reserve1: '',
        liquidity: '',
      };
    }

    let decryptedPassword;
    try {
      const encryptedKey = await inputToken.getEncryptedPrivKey(
        ctx.user.userId,
      );
      const decryptedPrivateKey = this.decrypt(
        encryptedKey,
        args.walletPassword,
      );
      const { decryptedString } = decryptedPrivateKey;
      decryptedPassword = decryptedString;
    } catch (e) {
      logger.warn('EncryptedKey no return instead we reach a 401 status' + e);
    }

    const pairInfoArgs = {
      token0,
      token1,
      decryptedPassword,
      decimalPlaces0: decimals0,
      decimalPlaces1: decimals1,
      receiveAddress,
    };
    const pairInfo = await addLiquidityV2.getPairInfo(pairInfoArgs);

    return pairInfo;
  };

  checkApprove = async (
    parent: any,
    args: {
      walletPassword: string;
      coinSymbol: string[];
      address?: string;
    },
    { user, wallet }: Context,
  ) => {
    this.requireAuth(user);
    const inputToken = wallet.coin(args.coinSymbol[0]) as Erc20API;
    const { receiveAddress } = await inputToken.getWalletInfo(user);

    const validPassword = await inputToken.checkPassword(
      user,
      args.walletPassword,
    );

    if (!validPassword) {
      return {
        message: 'Invalid Password',
        symbol: args.coinSymbol[0],
        isApprove: false,
      };
    }

    const checkApproveArgs = {
      coinSymbol: args.coinSymbol,
      receiveAddress,
      address: args.address || '',
    };
    const checkApprove = await addLiquidityV2.checkApprove(
      checkApproveArgs,
      wallet,
    );
    return checkApprove;
  };

  approveTokens = async (
    parent: any,
    args: {
      walletPassword: string;
      coinSymbol0: string;
      address?: string;
    },
    { user, wallet }: Context,
  ) => {
    this.requireAuth(user);
    const inputToken = wallet.coin(args.coinSymbol0) as Erc20API;
    const token0 = inputToken.contractAddress;
    const { receiveAddress } = await inputToken.getWalletInfo(user);

    const validPassword = await inputToken.checkPassword(
      user,
      args.walletPassword,
    );

    if (!validPassword) {
      return {
        message: 'Invalid Password',
        created: false,
      };
    }

    let decryptedPassword;
    try {
      const encryptedKey = await inputToken.getEncryptedPrivKey(user.userId);
      const decryptedPrivateKey = this.decrypt(
        encryptedKey,
        args.walletPassword,
      );
      const { decryptedString } = decryptedPrivateKey;
      decryptedPassword = decryptedString;
    } catch (e) {
      logger.warn('EncryptedKey no return instead we reach a 401 status' + e);
    }

    const approveTokensArgs = {
      decryptedPassword,
      token0,
      receiveAddress,
      address: args.address || '',
    };

    const approveTokens = await addLiquidityV2.approveTokens(approveTokensArgs);
    return approveTokens;
  };

  addLiquidityV2 = async (
    parent: any,
    args: {
      coinSymbol0: string;
      coinSymbol1: string;
      amountADesired: string;
      amountBDesired: string;
      walletPassword: string;
      address: string;
    },
    { user, wallet }: Context,
  ) => {
    this.requireAuth(user);
    const inputToken = wallet.coin(args.coinSymbol0) as Erc20API;
    const token0 = inputToken.contractAddress;
    const decimals0 = inputToken.decimalPlaces;
    const outputToken = wallet.coin(args.coinSymbol1) as Erc20API;
    const token1 = outputToken.contractAddress;
    const decimals1 = outputToken.decimalPlaces;
    const { receiveAddress } = await inputToken.getWalletInfo(user);

    const validPassword = await inputToken.checkPassword(
      user,
      args.walletPassword,
    );

    if (!validPassword) {
      return {
        message: 'Invalid Password',
      };
    }

    let decryptedPassword;
    try {
      const encryptedKey = await inputToken.getEncryptedPrivKey(user.userId);
      const decryptedPrivateKey = this.decrypt(
        encryptedKey,
        args.walletPassword,
      );
      const { decryptedString } = decryptedPrivateKey;
      decryptedPassword = decryptedString;
    } catch (e) {
      logger.warn('EncryptedKey no return instead we reach a 401 status' + e);
    }

    const addliquidityArgs = {
      token0,
      token1,
      decimals0,
      decimals1,
      amountADesired: args.amountADesired,
      amountBDesired: args.amountBDesired,
      decryptedPassword,
      receiveAddress,
      address: args.address,
    };

    const addliquidity = await addLiquidityV2.addLiquidityV2(addliquidityArgs);
    return addliquidity;
  };

  removeLiquidityV2 = async (
    parent: any,
    args: {
      coinSymbol0: string;
      coinSymbol1: string;
      walletPassword: string;
      percentage: number;
    },
    { user, wallet }: Context,
  ) => {
    this.requireAuth(user);
    const inputToken = wallet.coin(args.coinSymbol0) as Erc20API;
    const token0 = inputToken.contractAddress;
    const outputToken = wallet.coin(args.coinSymbol1) as Erc20API;
    const token1 = outputToken.contractAddress;
    const { receiveAddress } = await inputToken.getWalletInfo(user);

    const validPassword = await inputToken.checkPassword(
      user,
      args.walletPassword,
    );

    if (!validPassword) {
      return {
        message: 'Invalid Password',
        amountA: '',
        amountB: '',
      };
    }

    let decryptedPassword;
    try {
      const encryptedKey = await inputToken.getEncryptedPrivKey(user.userId);
      const decryptedPrivateKey = this.decrypt(
        encryptedKey,
        args.walletPassword,
      );
      const { decryptedString } = decryptedPrivateKey;
      decryptedPassword = decryptedString;
    } catch (e) {
      logger.warn('EncryptedKey no return instead we reach a 401 status' + e);
    }

    const remliquidityArgs = {
      token0,
      token1,
      decryptedPassword,
      receiveAddress,
      percentage: args.percentage,
    };

    const remLiquidity = await addLiquidityV2.removeLiquidityV2(
      remliquidityArgs,
    );
    return remLiquidity;
  };
}

export const liquidityResolverV2 = new LiquidityResolverV2();

export default {
  Query: {
    getPairInfo: liquidityResolverV2.getPairInfo,
    checkApprove: liquidityResolverV2.checkApprove,
  },

  Mutation: {
    validatePasscode: liquidityResolverV2.validatePasscode,
    createPair: liquidityResolverV2.createPair,
    approveTokens: liquidityResolverV2.approveTokens,
    addLiquidityV2: liquidityResolverV2.addLiquidityV2,
    remLiquidityV2: liquidityResolverV2.removeLiquidityV2,
  },
};
