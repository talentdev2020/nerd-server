import CoinWalletBase from './coin-wallet-base';
import { logger } from '../../common';
import { PromotionalReward } from '../../models';
import { buildGetUserRewardsPipeline } from '../../pipelines';
import {
  ITransaction,
  ICoinMetadata,
  ISendOutput,
  IPromotionalRewardDoc,
  ICartAddress,
  ICartBalance,
} from '../../types';
import { UserApi } from '../../data-sources';

class DocWallet extends CoinWalletBase {
  rewardNames: string[];

  constructor({
    name,
    symbol,
    contractAddress,
    abi,
    backgroundColor,
    icon,
    decimalPlaces,
  }: ICoinMetadata) {
    super(
      name,
      symbol,
      contractAddress,
      abi,
      backgroundColor,
      icon,
      decimalPlaces,
    );
    this.setRewardName();
  }

  private setRewardName() {
    switch (this.symbol.toLowerCase()) {
      case 'win': {
        this.rewardNames = ['Win'];
        break;
      }
      case 'smart': {
        this.rewardNames = ['Smart'];
        break;
      }
      case 'gala': {
        this.rewardNames = ['Arc', 'GALA'];
        break;
      }
      case 'blue': {
        this.rewardNames = ['BLUE'];
        break;
      }
      case 'galvan': {
        this.rewardNames = ['IZE'];
        break;
      }
      case 'ize': {
        this.rewardNames = ['IZE'];
        break;
      }
      case 'switch': {
        this.rewardNames = ['SWITCH'];
        break;
      }
      case 'bxc': {
        this.rewardNames = ['BXC'];
        break;
      }
      case 'liberty': {
        this.rewardNames = ['LIBERTY'];
        break;
      }
      case 'element': {
        this.rewardNames = ['ELEMENT'];
        break;
      }
      case 'air': {
        this.rewardNames = ['AIR'];
        break;
      }
      case 'water': {
        this.rewardNames = ['WATER'];
        break;
      }
      case 'grow': {
        this.rewardNames = ['GROW'];
        break;
      }
      case 'elevate': {
        this.rewardNames = ['ELEVATE'];
        break;
      }
      case 'give': {
        this.rewardNames = ['GIVE'];
        break;
      }
      case 'usdt': {
        this.rewardNames = ['USDT'];
        break;
      }
      case 'usdc': {
        this.rewardNames = ['USDC'];
        break;
      }
      case 'busd': {
        this.rewardNames = ['BUSD'];
        break;
      }
      case 'dai': {
        this.rewardNames = ['DAI'];
        break;
      }
      case 'bat': {
        this.rewardNames = ['BAT'];
        break;
      }
      default: {
        throw new Error('Symbol not supported for DocWallet');
      }
    }
  }

  public async getCartAddress(
    symbol: string,
    orderId: string,
    amount: string,
  ): Promise<ICartAddress> {
    const result: ICartAddress = {
      address: '',
      coinSymbol: symbol,
      qrCode: '',
    };
    return result;
  }

  public async getCartBalance(
    symbol: string,
    orderId: string,
    address: string,
  ): Promise<ICartBalance> {
    const result: ICartBalance = {
      coinSymbol: symbol,
      address,
      amountConfirmed: 0,
      amountUnconfirmed: 0,
      lastTransactions: [],
    };
    return result;
  }

  public async checkIfWalletExists(userApi: UserApi) {
    //logger.debug(`walletApi.coin-wallets.DocWallet.checkIfWalletExists: true`);
    return true;
  }

  public async createWallet(
    userApi: UserApi,
    walletPassword: string,
    mnemonic: string,
  ) {
    return true;
  }

  public async estimateFee(userApi: UserApi) {
    const feeData = {
      estimatedFee: '0',
      feeCurrency: this.symbol,
      feeCurrencyBalance: '0',
    };
    return feeData;
  }

  public async getWalletInfo(userApi: UserApi) {
    try {
    
      return {
        receiveAddress: '',
        symbol: this.symbol,
        name: this.name,
        backgroundColor: this.backgroundColor,
        icon: this.icon,
        canSendFunds: false,
        lookupTransactionsBy: userApi.userId,
        decimalPlaces: this.decimalPlaces,
      };
    } catch (error) {
      logger.warn(
        `walletApi.coin-wallets.DocWallet.getWalletInfo.catch:${error}`,
      );
      throw error;
    }
  }

  async getBalance(userId: string) {
   
    try {
      const pipeline = buildGetUserRewardsPipeline(userId, this.rewardNames);
      const [rewardResponse] = await PromotionalReward.aggregate(pipeline);
      const balance = rewardResponse ? rewardResponse.balance : '0.0';
   
      return {
        unconfirmed: balance, //same value, no sense
        confirmed: balance,
      };
    } catch (error) {
      logger.warn(`walletApi.coin-wallets.DocWallet.getBalance.catch:${error}`);
      throw error;
    }
  }

  async getTransactions(
    userId: string,
    blockNumAtCreation: number,
  ): Promise<ITransaction[]> {
    try {

      const transactions = await PromotionalReward.find({
        userId,
        rewardName: { $in: this.rewardNames },
      });

      const formattedTransactions = this.formatTransactions(
        transactions,
        userId,
      );
      return formattedTransactions;
    } catch (error) {
      logger.warn(
        `walletApi.coin-wallets.DocWallet.getTransactions.catch:${error}`,
      );
      throw error;
    }
  }

  async send(userApi: UserApi, outputs: ISendOutput[], walletPassword: string) {
    const [{ amount }] = outputs;

    return {
      message: 'Cannot send from this wallet',
      success: false,
    };
  }

  private formatTransactions(
    transactions: IPromotionalRewardDoc[],
    userId: string,
  ): ITransaction[] {
    try {
      
      return transactions.map(rawTx => {
        const { id, amount, created } = rawTx;
        const returnTx = {
          id: id,
          status: 'Complete',
          confirmations: 6,
          timestamp: Math.round(created.getTime() / 1000),
          fee: '0',
          link: '',
          to: [userId],
          from: 'GALA',
          type: 'Deposit',
          amount: amount.toString(),
          total: amount.toString(),
        };

        return returnTx;
      });
    } catch (error) {
      logger.warn(
        `walletApi.coin-wallets.DocWallet.formatTransactions.catch:${error}`,
      );
      throw error;
    }
  }

  public async recoverWallet(
    userApi: UserApi,
    oldPassword: string,
    newPassword: string,
  ) {
    try {
      return true;
    } catch (error) {
      logger.warn(
        `walletApi.coin-wallets.DocWallet.recoverWallet.catch:${error}`,
      );
      throw error;
    }
  }
  public checkPassword() {
    return Promise.reject('Incorrect password');
  }
}

export default DocWallet;
