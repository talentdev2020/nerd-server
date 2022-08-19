import { IMintDestination } from 'src/services/minter/connect/win-commission-minter';
import {
  Context,
  IVaultItem,
  IVaultTransaction,
  IVaultGasFee,
  IVaultItemRequest,
} from '../types';

import {
  GreenCoinResult,
  BlockbotReportUserDistributions,
  IWinReportUserDistribution,
} from '../models';

import VaultDirectPaymentRequests, {
  IVaultDirectPaymentRequest,
} from '../models/vault-payment-requests';

import { EthWallet } from '../wallet-api/coin-wallets';
import { addHours } from 'date-fns';
import ResolverBase from '../common/Resolver-Base';
import { logger, config } from '../common';
import { UserApi } from 'src/data-sources';
import { vaultMinterService } from 'src/services';

class Resolvers extends ResolverBase {
  getVaultItems = async (parent: any, args: {}, ctx: Context) => {
    const { user, wallet } = ctx;
    this.requireAuth(user);
    const userId = user.userId;
    const ethWallet = wallet.coin('ETH') as EthWallet;
    const { receiveAddress } = await ethWallet.getWalletInfo(user);

    const returnItems: IVaultItem[] = [];
    const minter = vaultMinterService.createMinter(user);

    try {
      if (this.vaultItemApprovedList(user)) {
        const toAddEth = await vaultMinterService.searchForCoinResultsSummary(
          minter,
          userId,
          'eth',
          'unminted',
          receiveAddress
        );
        returnItems.push(toAddEth.item);
      }

      const toAdd = await vaultMinterService.searchForCoinResultsSummary(
        minter,
        userId,
        config.brand.toLowerCase(),
        'unminted',
        receiveAddress
      );

      //TODO : taken out to show '0' balance (to then see the transactions details.)
      //if (toAdd.item.balance > 0) {
      returnItems.push(toAdd.item);
      //}
    } catch (err) {
      logger.exceptionContext(err, 'resolvers.getVaultItems.catch', {
        userId,
        returnItems: JSON.stringify(returnItems),
      });
    }
    return returnItems;
  };

  private vaultItemApprovedList (user: UserApi): boolean {
    if(config.brand === 'connect')
    {
      if(user.role === 'admin') {
        return true;
      }
      if(user.permissions.includes('COMMISSION_VAULT')) {
          return true;
      }
    }
    return false;
  }

  getGasFees = async (
    parent: any,
    args: {
      coinSymbol: string;
    },
    ctx: Context,
  ) => {
    const { user, wallet } = ctx;
    const { userId } = user
    this.requireAuth(user);
    const { coinSymbol } = args;
    const ethWallet = wallet.coin('ETH') as EthWallet;
    const { receiveAddress } = await ethWallet.getWalletInfo(user);

    const returnItem: IVaultGasFee = {
      symbolToMint: coinSymbol,
      symbolAcceptFee: 'ETH',
      amount: vaultMinterService.gasRandom(),
      expires: addHours(Date.now(), 1),
      name: 'Gas Fees',
    };

      const result = {
        balance: 0,

      }
    switch (args.coinSymbol.toLowerCase()) {
      case 'green':
        const minter = vaultMinterService.createMinter(user);

        const greens = await GreenCoinResult.find({
          userId,
          status: 'unminted',
        }).exec();

        greens.forEach(a => {
          result.balance = result.balance + +a.greenDecimal;
        });

        const availableMint: IMintDestination = {
          destinationAddress: receiveAddress,
          amountDecimal: result.balance,
        }
        let gasCost: number;

        try{
          gasCost = await minter.getGasCost(availableMint);
        }catch(e){
          throw new Error('Unavailable to estimate gas cost')
        }
        returnItem.amount = gasCost;
        break;
      case 'eth':
        const commissions = await BlockbotReportUserDistributions.find({
          UserId: userId,
          DateToDistribute: {$gte: new Date()},
          Status: status,
        }).exec();

        commissions.forEach(a => {
          result.balance = result.balance + a.TotalDirectRewardsCrypto;
        });

        returnItem.amount = vaultMinterService.gasRandom();
        break;
    }



    return returnItem;
  };

  getVaultTransactions = async (
    parent: any,
    args: {
      coinSymbol: string;
      filterType?: string;
    },
    ctx: Context,
  ) => {
    const { user } = ctx;
    this.requireAuth(user);
    const { coinSymbol } = args;
    const returnItems: IVaultTransaction[] = [];
    const userId = user.userId;

    try {
      const greens = await GreenCoinResult.find({
        userId,
      }).exec();

      if (config.brand === 'connect') {
        const commissions = await BlockbotReportUserDistributions.find({
          UserId: userId,
        }).exec();

        commissions.forEach((element: IWinReportUserDistribution) => {
          const toAdd: IVaultTransaction = {
            created: element.Date,
            isNft: false,
            status: element.Status,
            amount: element.TotalDirectRewardsCrypto,
            userId: element.UserId,
            dateMint: element.DateMint,
            tokenId: undefined,
            txMint: undefined,
            symbol: 'ETH',
          };
          returnItems.push(toAdd);
        });
      }

      greens.forEach(a => {
        const toAdd: IVaultTransaction = {
          created: a.runTime,
          isNft: false,
          status: a.status,
          amount: +a.greenDecimal,
          userId: a.userId,
          dateMint: a.dateMint,
          tokenId: undefined,
          txMint: undefined,
          symbol: coinSymbol,
        };
        returnItems.push(toAdd);
      });
    } catch (err) {
      logger.exceptionContext(err, 'resolvers.getVaultTransactions', {
        userId,
        coinSymbol,
        returnItems: JSON.stringify(returnItems),
      });
      return {
        success: false,
        message: err,
      };
    }

    return returnItems;
  };

  mint = async (
    _parent: any,
    args: {
      items: IVaultItemRequest[];
      encryptionPasscode: string;
    },
    ctx: Context,
  ) => {
    const { user, wallet } = ctx;
    this.requireAuth(user);        
    const res = await vaultMinterService.mint(user, wallet, args.items, args.encryptionPasscode);
    return res;
  };

  requestDirectVaultPayment = async (
    parent: any,
    args: {
      requestedPaymentInfo: {
        symbol?: string;
        requestedAmount?: string;
        toWalletAddress?: string;
      };
    },
    { user }: Context,
  ) => {
    try {
      this.requireAuth(user);

      const info = args.requestedPaymentInfo;
      if (!info) {
        throw new Error('Missing Request Info');
      }

      if (user.userId === null) {
        throw new Error('Expecting a User ID');
      }

      const newStatus = 'new';

      const doc: IVaultDirectPaymentRequest = {
        userId: user.userId,
        amountRequested: info.requestedAmount ?? '',
        created: new Date(),
        status: newStatus,
        symbol: info.symbol,
        toWalletAddress: info.toWalletAddress,
      };

      const result = await VaultDirectPaymentRequests.insertMany(doc);
      return { id: result._id?.toString(), status: newStatus };
    } catch (err) {
      logger.error(`resolvers.vault.requestVaultPayment: ${err?.message}`);
    }

    /* do work */
  };
}

const resolvers = new Resolvers();

export default {
  Mutation: {
    vault: resolvers.getVaultItems,
    vaultGas: resolvers.getGasFees,
    vaultRetrieve: resolvers.mint,
    vaultTransactions: resolvers.getVaultTransactions,
    requestDirectVaultPayment: resolvers.requestDirectVaultPayment,
  },
};
