import { capitalize } from 'lodash';
import EthWallet from '../wallet-api/coin-wallets/eth-wallet';
import { Context } from '../types';
import ResolverBase from '../common/Resolver-Base';
import { tokenClaimService } from '../services';
import { Erc1155Token } from '../models';
import { IToken } from '../types/token-claim';
import { config, configAws } from '../common';

class Resolvers extends ResolverBase {
  public getUnclaimedTokens = async (
    parent: any,
    args: {},
    { user }: Context,
  ) => {
    this.requireAuth(user);

    const tokens = await tokenClaimService.getClaimableTokens(user.userId);

    const unclaimedTokens = await Promise.all(
      tokens
        .filter(token => token.quantity > 0)
        .map(async ({ token, quantity, claimType, rewardType }) => {
          const { name, image } =
            token === 'gala'
              ? {
                  name: 'Gala',
                  image:
                    'https://gala-tokens.s3-us-west-2.amazonaws.com/compressed-images/logos/GALA-icon_dark.png',
                }
              : await Erc1155Token.findOne({ baseId: token });

          const formattedQuantity =
            token === 'gala' ? quantity / 10 ** 8 : quantity;

          const feeType = `${token === 'gala' ? 'gala' : 'item'}${capitalize(
            claimType,
          )}`;

          return {
            token,
            name,
            image,
            feeType,
            claimType,
            type: rewardType,
            quantity: formattedQuantity,
          };
        }),
    );

    return unclaimedTokens;
  };

  public getClaimQuote = async (parent: any, args: {}, { user }: Context) => {
    this.requireAuth(user);

    const quote = await tokenClaimService.getClaimQuote(user.userId);

    return {
      galaMintEthFee: +quote.galaMintEthFee,
      galaTransferEthFee: +quote.galaTransferEthFee,
      itemMintEthFee: +quote.itemMintEthFee,
      itemTransferEthFee: +quote.itemTransferEthFee,
      itemTransferAdditionalTokenEthFee: +quote.itemTransferAdditionalTokenEthFee,
      itemTransferMaxTokensPerTransaction:
        quote.itemTransferMaxTokensPerTransaction,
    };
  };

  public hasUnseenFulfilledClaims = async (
    parent: any,
    { markAsSeen }: { markAsSeen: boolean },
    { user }: Context,
  ) => {
    this.requireAuth(user);

    const unseenClaims = await tokenClaimService.getUnseenFulfilledClaims(
      user.userId,
    );

    if (markAsSeen && unseenClaims.length) {
      await tokenClaimService.markClaimsAsSeen(user.userId);
    }

    return !!unseenClaims.length;
  };

  public markClaimsAsSeen = async (
    parent: any,
    args: {},
    { user }: Context,
  ) => {
    this.requireAuth(user);

    await tokenClaimService.markClaimsAsSeen(user.userId);

    return true;
  };

  public claimTokens = async (
    parent: any,
    {
      claimFee,
      tokens,
      walletPassword,
    }: { claimFee: number; tokens: IToken[]; walletPassword: string },
    { user, wallet }: Context,
  ) => {
    this.requireAuth(user);

    const userDoc = await user.findFromDb();
    const ethWallet = wallet.coin('ETH') as EthWallet;

    const { hash, transaction } = await ethWallet.signTransaction(
      user,
      [{ amount: claimFee.toString(), to: configAws.galaClaimFeeReceiveAddress }],
      walletPassword,
    );

    const formattedTokens = tokens.map(token => {
      const quantity =
        token.token === 'gala'
          ? Math.floor(token.quantity * 10 ** 8)
          : token.quantity;

      return {
        ...token,
        quantity,
      };
    });

    const claim = {
      claimFee,
      userId: user.userId,
      userEthAddress: userDoc.wallet.ethAddress,
      tokens: formattedTokens,
      claimFeeTransactionHash: hash,
    };

    try {
      await tokenClaimService.claimTokens(claim);
    } catch (error) {
      await user.incrementTxCount(-1);

      throw error;
    }

    await ethWallet.sendSignedTransaction(transaction);

    return { success: true };
  };
}

export const resolvers = new Resolvers();

export default {
  Query: {
    unclaimedTokens: resolvers.getUnclaimedTokens,
    claimQuote: resolvers.getClaimQuote,
    hasUnseenFulfilledClaims: resolvers.hasUnseenFulfilledClaims,
  },
  Mutation: {
    markClaimsAsSeen: resolvers.markClaimsAsSeen,
    claimTokens: resolvers.claimTokens,
  },
};
