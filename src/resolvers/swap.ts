import { startSwap } from '../services/swap';
import { Context } from '../types/context';
import ResolverBase from '../common/Resolver-Base';
import { logger, config } from 'src/common';
import Erc20API from 'src/wallet-api/coin-wallets/erc20-wallet';

class SwapResolvers extends ResolverBase {
  confirmSwap = async (
    parent: any,
    args: {
      coinSymbol0: string;
      coinSymbol1: string;
      amount: string;
      walletPassword: string;
    },
    { user, wallet }: Context,
  ) => {
    this.maybeRequireStrongWalletPassword(args.walletPassword);
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
        hash: '',
        blockNumber: 0,
        confirmations: 0,
        to: '',
        midPrice: '',
        midPriceInverted: '',
        path: '',
        liquidityProviderFee: '',
        liquidityProviderFeePercent: 0,
        tradeExpires: 0,
      };
    }

    let passwordDecripted: string;
    try {
      const encryptedKey = await inputToken.getEncryptedPrivKey(user.userId);
      const decryptedPrivateKey = this.decrypt(
        encryptedKey,
        args.walletPassword,
      );
      const { decryptedString } = decryptedPrivateKey;
      passwordDecripted = decryptedString;
    } catch (e) {
      return {
        message: e.message,
        hash: '',
        blockNumber: 0,
        confirmations: 0,
        to: '',
        midPrice: '',
        midPriceInverted: '',
        path: '',
        liquidityProviderFee: '',
        liquidityProviderFeePercent: 0,
        tradeExpires: 0,
      };
    }

    try {
      const confirmTrade = await startSwap.confirmSwap(
        passwordDecripted,
        token0,
        token1,
        args.amount,
        receiveAddress,
      );
      return confirmTrade;
    } catch (error) {
      logger.warn(`resolvers.Swap.startSwap.catch: ${error}`);
    }
  };

  startSwap = async (
    parent: any,
    args: {
      coinSymbol0: string;
      coinSymbol1: string;
      amount: string;
    },
    { user, wallet }: Context,
  ) => {
    this.requireAuth(user);
    const inputToken = wallet.coin(args.coinSymbol0) as Erc20API;
    const token0 = inputToken.contractAddress;
    const outputToken = wallet.coin(args.coinSymbol1) as Erc20API;
    const token1 = outputToken.contractAddress;
    const { receiveAddress } = await inputToken.getWalletInfo(user);

    try {
      const { trade, message } = await startSwap.uniswapSwap(
        token0,
        token1,
        args.amount,
        receiveAddress,
      );

      if (message !== 'Success') {
        throw new Error('Swap is not available');
      }

      const {
        minAmountConvertQuote,
        expectedConvertQuote,
        routeText,
        liquidityProviderFee,
        liquidityProviderFeePercent,
        tradeExpires,
      } = trade;

      return {
        message,
        midPrice: minAmountConvertQuote,
        midPriceInverted: expectedConvertQuote,
        path: routeText,
        liquidityProviderFee,
        liquidityProviderFeePercent,
        tradeExpires,
      };
    } catch (error) {
      logger.warn(`resolvers.Swap.startSwap.catch: ${error}`);
      return {
        message: error,
      };
    }
  };
}

export const swapResolver = new SwapResolvers();

export default {
  Mutation: {
    startSwap: swapResolver.startSwap,
    confirmSwap: swapResolver.confirmSwap,
  },
};
