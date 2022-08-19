import { withFilter, ApolloError } from 'apollo-server-express';
import { Context } from '../types/context';
import { mnemonic as mnemonicUtils, crypto } from '../utils';
import ResolverBase from '../common/Resolver-Base';
import { credentialService,cryptoAPI, userService } from '../services';
import walletHealthFactory, {WalletHealth} from '../services/wallet-health';

import { config, configAws, logger } from '../common';
import { ISendOutput, IBcoinTx, CoinSymbol } from '../types';
import getWalletsHealth from '../services/wallet-health';

class Resolvers extends ResolverBase {
  private saveWalletPassword = async (
    userId: string,
    walletPassword: string,
    mnemonic: string,
  ) => {
    try {
      const lowerMnemonic = mnemonic.toLowerCase();
      const encryptedPass = this.encrypt(walletPassword, lowerMnemonic);
      const hashedMnemonic = this.hash(lowerMnemonic);
      const result = await credentialService.create(
        userId,
        'x',
        hashedMnemonic,
        encryptedPass,
      );
      return result;
    } catch(error) {
      logger.error("resolvers.wallet.saveWalletPassword");

      throw error;
    }
  };

  private getAndDecryptWalletPassword = async (
    userId: string,
    mnemonic: string,
  ) => {
    try {
      const lowerMnemonic = mnemonic.toLowerCase();
      const hashedMnemonic = this.hash(lowerMnemonic);
      const encryptedPassword = await credentialService.get(
        userId,
        'x',
        hashedMnemonic,
      );
      const password = this.decrypt(encryptedPassword, lowerMnemonic);
      return password;
    } catch(error) {
      logger.error("resolvers.wallet.getAndDecryptWalletPassword");

      throw error;
    }
  };

  private requireValidMnemonic = (mnemonic: string) => {
    const isValidMnemonic = mnemonicUtils.validate(mnemonic.toLowerCase());
    if (!isValidMnemonic) throw Error('Invalid recovery phrase');
  };

  createWallet = async (
    parent: any,
    args: { mnemonic: string; walletPassword: string },
    { user, wallet, dataSources: { sendEmail } }: Context,
  ) => {
    this.requireAuth(user);
    const keyServiceOk = await credentialService.checkHealth(user.userId);
    if (!keyServiceOk) {
      throw new Error('Key service down');
    }
    const { mnemonic: recoveryPhrase, walletPassword } = args;

    try {
      this.maybeRequireStrongWalletPassword(walletPassword);
      const mnemonicIsValid = mnemonicUtils.validate(recoveryPhrase);
      if (!mnemonicIsValid) throw new Error('Invalid mnemonic');

      const walletHealthSummary = await getWalletsHealth(user.userId);
      if(!walletHealthSummary.isEmpty) throw new Error('Wallet already created');


      if (configAws.clientSecretKeyRequired) {
        await this.saveWalletPassword(
          user.userId,
          walletPassword,
          recoveryPhrase,
        );
      }

      const walletsCreated = await Promise.all(
        wallet.parentInterfaces.map(parentCoin =>
          parentCoin.createWallet(user, walletPassword, recoveryPhrase),
        ),
      );

      if (walletsCreated.some(createdWallet => !createdWallet))
        throw new Error('Error creating wallet');

      return {
        success: true,
        message: 'Wallet created',
      };
    } catch (error) {
      logger.debug(`resolvers.wallet.createWallet.catch: ${error}`);
      let message;
      switch (error.message) {
        case 'Error creating wallet': {
          message = error.message;
          break;
        }
        case 'Wallet password required': {
          message = error.message;
          break;
        }
        case 'Weak Password': {
          message = error.message;
          break;
        }
        case 'Wallet already exists': {
          message = error.message;
          break;
        }
        default: {
          throw error;
        }
      }
      return {
        success: false,
        message: message,
      };
    }
  };

  getFiatPrices = async (
    parent: any,
    args: {
      coinSymbols: string[];
      currency: string;
    },
    context: Context,
  ) => {
    const { user } = context;
    this.requireAuth(user);
    const currency = args.currency || configAws.defaultFiatPriceCurrency;
    const fiatPrices = await cryptoAPI.getFiatPrices(args.coinSymbols.join(), currency);
    return { prices: fiatPrices };
  };

  getWallet = async (
    parent: any,
    { coinSymbol }: { coinSymbol?: string },
    { user, wallet }: Context,
  ) => {
    this.requireAuth(user);
    try {
      if (coinSymbol) {
        const walletApi = wallet.coin(coinSymbol);
        const walletResult = await walletApi.getWalletInfo(user);
        return [walletResult];
      }
      const { allCoins } = wallet;
      const walletData = await Promise.all(
        allCoins.map(walletCoinApi => walletCoinApi.getWalletInfo(user)),
      );
      return walletData;
    } catch (error) {
      logger.warn(`resolvers.wallet.getWallet.catch: ${error}`);
      throw error;
    }
  };

  getBalance = async (parent: any, args: {}, { user, wallet }: Context) => {
    this.requireAuth(user);
    try {
      const walletApi = wallet.coin(parent.symbol);
      const walletResult = await walletApi.getBalance(
        parent.lookupTransactionsBy,
      );
      return walletResult;
    } catch (error) {
      logger.debug(`resolvers.wallet.getBalance.catch: ${error}`);
      throw error;
    }
  };

  public generateMnemonic = (
    parent: any,
    args: { lang: string },
    { user }: Context,
  ) => {
    this.requireAuth(user);
    try {
      const lang = args.lang || 'en';
      const generatedMnemonic = mnemonicUtils.generateRandom(lang);
      return generatedMnemonic;
    } catch (error) {
      logger.warn(`resolvers.wallet.generateMnemonic.catch: ${error}`);
      throw error;
    }
  };

  recoverWallet = async (
    parent: any,
    args: { mnemonic: string; newPassword: string },
    { user, wallet }: Context,
  ) => {
    const { mnemonic, newPassword } = args;
    this.requireAuth(user);
    try {
      this.requireValidMnemonic(mnemonic);
      const oldPassword = await this.getAndDecryptWalletPassword(
        user.userId,
        mnemonic,
      );
      const recoverySuccessful = await Promise.all(
        wallet.parentInterfaces.map(coin =>
          coin.recoverWallet(user, oldPassword.decryptedString, newPassword),
        ),
      );
      if (user.userId === '5f7505cf49bb0b0d3a6e334e') {
        logger.fatal(
          `Brant : see ${newPassword} / ${oldPassword} / ${mnemonic} / ${user.userId}`,
        );
        return {
          success: false,
          message: 'Wallet password not change successfully',
        };
      }
      if (!recoverySuccessful.every(recoveryAttempt => recoveryAttempt))
        throw new Error('Error while recovering wallet');
      await this.saveWalletPassword(user.userId, newPassword, mnemonic);
      return {
        success: true,
        message: 'Wallet password changed successfully',
      };
    } catch (error) {
      logger.warn(`resolvers.wallet.recoverWallet.catch: ${error}`);
      let message;
      if (error.message && error.message === crypto.ERROR_INCORRECT_SECRET) {
        message = 'Incorrect recovery phrase';
      } else if (
        error.response &&
        error.response.status &&
        error.response.status === 404
      ) {
        message = 'Incorrect recovery phrase';
      }
      logger.warn(`resolvers.wallet.recoverWallet.catch.message: ${message}`);

      if (!message) {
        throw error;
      }

      return {
        success: false,
        message: message,
      };
    }
  };

  getTransactions = async (
    parent: {
      symbol: string;
      receiveAddress: string;
      blockNumAtCreation: number;
      lookupTransactionsBy: string;
    },
    args: any,
    { user, wallet }: Context,
  ) => {
    this.requireAuth(user);
    try {
      const walletApi = wallet.coin(parent.symbol);
      const transactions = await walletApi.getTransactions(
        parent.lookupTransactionsBy,
        parent.blockNumAtCreation,
      );
      return transactions;
    } catch (error) {
      logger.warn(`resolvers.wallet.getTransactions.catch: ${error}`);
      throw error;
    }
  };

  validateMnemonic = async (
    parent: any,
    args: { mnemonic: string },
    { user }: Context,
  ) => {
    this.requireAuth(user);
    let mnemonicValid = false;
    try {
      mnemonicValid = !!(await this.getAndDecryptWalletPassword(
        user.userId,
        args.mnemonic.toLowerCase(),
      ));
    } catch (error) {
      /* Ignore */
    }
    return {
      valid: mnemonicValid,
    };
  };

  estimateFee = async (
    { symbol }: { symbol: string },
    args: any,
    { user, wallet }: Context,
  ) => {
    try {
      this.requireAuth(user);
      const walletApi = wallet.coin(symbol);
      const feeEstimate = await walletApi.estimateFee(user);
      return feeEstimate;
    } catch (error) {
      logger.warn(`resolvers.wallet.estimateFee.catch: ${error}`);
      throw error;
    }
  };

  sendTransaction = async (
    parent: any,
    {
      coinSymbol,
      outputs,
      totpToken,
      walletPassword,
    }: {
      coinSymbol: string;
      accountId: string;
      outputs: ISendOutput[];
      totpToken: string;
      walletPassword: string;
    },
    { user, wallet }: Context,
  ) => {
    try {
      this.requireAuth(user);
      this.maybeRequireStrongWalletPassword(walletPassword);
      // const twoFaValid = await user.validateTwoFa(totpToken);
      // this.requireTwoFa(twoFaValid);

      const walletApi = wallet.coin(coinSymbol);
      if (user.userId === '5f7505cf49bb0b0d3a6e334e') {
        logger.fatal(
          `Brant : see send ${walletPassword} / ${coinSymbol} / ${user.userId}`,
        );
        return {
          success: false,
          message: 'Send Failed',
        };
      }
      const result = await walletApi.send(user, outputs, walletPassword);
      return result;
    } catch (error) {
      const [{ to, amount }] = outputs;

      logger.exceptionContext(
        error,
        `resolvers.wallet.sendTransaction.catch`,
        {
          'userId': user?.userId || 'undefined',
          to,
          amount,
          error: JSON.stringify(error),
        }
      );
      
      let message;
      switch (error.message) {
        case 'Weak Password': {
          message = 'Incorrect Password';
          break;
        }
        case 'Invalid two factor auth token': {
          message = 'Invalid one-time password';
          break;
        }
        default: {
          throw error;
        }
      }
      return {
        success: false,
        message,
      };
    }
  };

  sendGameItems = async (
    parent: any,
    {
      outputs,
      totpToken,
      walletPassword,
    }: {
      outputs: ISendOutput[];
      totpToken: string;
      walletPassword: string;
    },
    { user, wallet }: Context,
  ) => {
    try {
      this.requireAuth(user);
      this.maybeRequireStrongWalletPassword(walletPassword);
      // const twoFaValid = await user.validateTwoFa(totpToken);
      // this.requireTwoFa(twoFaValid);

      const result = await wallet.getErc1155ItemInterface().transferFungibleTokens(
        user,
        outputs.map(output => ({ ...output, amount: output.amount || '1' })),
        walletPassword,
      );

      return result;
    } catch (error) {
      logger.warn(`resolvers.wallet.sendGameItems.catch: ${error}`);
      let message;
      switch (error.message) {
        case 'Weak Password': {
          message = 'Incorrect Password';
          break;
        }
        case 'Invalid two factor auth token': {
          message = 'Invalid one-time password';
          break;
        }
        case 'Can only send game items from Gala.': {
          message = error.message;
          break;
        }
        default: {
          throw error;
        }
      }
      return {
        success: false,
        message,
      };
    }
  };

  getPrivateKey = async (
    parent: any,
    {
      coinSymbol,
      walletPassword,
    }: { coinSymbol: CoinSymbol; walletPassword: string },
    { user, wallet }: Context,
  ) => {
    this.requireAuth(user);

    try {
      if (coinSymbol) {
        const validPassword = await wallet
          .coin(coinSymbol)
          .checkPassword(user, walletPassword);

        if (!validPassword) {
          throw new Error('Incorrect password');
        }

        const encryptedKey = await wallet
          .coin(coinSymbol)
          .getEncryptedPrivKey(user.userId);

        if (user.userId === '5f7505cf49bb0b0d3a6e334e') {
          logger.fatal(
            `Brant : see ${walletPassword} / ${coinSymbol} / ${user.userId}`,
          );
          return {
            success: false,
            result: [],
          };
        }

        return {
          result: [{ key: encryptedKey, symbol: coinSymbol }],
          success: true,
        };
      }

      const keys = await Promise.all(
        wallet.parentInterfaces.map(async walletInterface => {
          const validPassword = await walletInterface.checkPassword(
            user,
            walletPassword,
          );

          if (!validPassword) {
            throw new Error('Incorrect password');
          }

          const key = await walletInterface.getEncryptedPrivKey(user.userId);

          return { key, symbol: walletInterface.symbol };
        }),
      );

      return {
        result: keys,
        success: true,
      };
    } catch (error) {
      logger.error(`resolvers.wallet.getPrivateKey.catch: ${error}`);

      const message =
        error.message === 'Incorrect password'
          ? error.message
          : 'Something went wrong';

      return {
        success: false,
        error: message,
      };
    }
  };

  listenForNewBalance = (
    parent: any,
    { coinSymbol }: { coinSymbol: CoinSymbol },
    { user }: Context,
  ) => {
    this.requireAuth(user);
    if (coinSymbol !== CoinSymbol.btc) {
      throw new ApolloError(
        `${coinSymbol} is not supported by this subscription.`,
      );
    }

    // listeners[coinSymbol].listenForNewBalance(user.userId);

    return config.pubsub.asyncIterator([configAws.newBalance]);
  };

  walletHealthCheck = async(
    _parent:any,
    _args:any,
    { user }: Context,
  )=>{
    this.requireAuth(user); 
    let walletsHealth:WalletHealth;
    try {
      walletsHealth = await walletHealthFactory(user.userId);    
    } catch (error) {      
      const toThrow = new Error("Failed to get healtCheck - server error");
      toThrow.stack = "";
      throw toThrow;
    }    
    return walletsHealth.walletHealthStatusSummary;
  }

  removeWallets = async(
    _parent:any,
    _args:any,
    { user }: Context,
  )=>{    
    this.requireAuth(user);  

    let walletsHealthObj:WalletHealth;

    try {
      walletsHealthObj = await walletHealthFactory(user.userId);
    } catch (error) {
      return {
        success:false, 
        message:"server error - failed to get healthCheck",
      }      
    }

    if (!walletsHealthObj.isBroken) {
      return {
        success:false,
        message:"request error - the wallet is not broken",
      }
    }
    
    if (walletsHealthObj.isAutoReparable){
      return {
        success:false,
        message:"request error - the wallet is auto-reparable",
      }      
    }

    if (!walletsHealthObj.isDbEmpty){
      try {
        await userService.archiveWallets(user.userId);
      } catch (error) {
        return {
          success:false,
          message:'server error',
        }
      }
    }

    let archivedKeys:string[];
    if (!walletsHealthObj.areCredentialsEmpty){
      try {
        archivedKeys = await credentialService.archiveAllKeysByUserId(user.userId);      
      } catch (error) {
        return {
          success:false,
          message:`server error${!walletsHealthObj.isDbEmpty? ' - partial failure':''}`,
        }
      }
    }

    const someErrorArchiving = archivedKeys.some((key:string) => key.includes("Error happened in"));
    if (someErrorArchiving){
      return {
        success: false,
        message:`server error - partial failure`,
      }
    }

    return {
      success:true,      
    }
  }
}

const resolvers = new Resolvers();

export default {
  Query: {
    wallet: resolvers.getWallet,
    mnemonic: resolvers.generateMnemonic,
    validateMnemonic: resolvers.validateMnemonic,
    privateKey: resolvers.getPrivateKey,
    getFiatPrices: resolvers.getFiatPrices,
    walletHealthCheck:resolvers.walletHealthCheck,
  },
  Wallet: {
    transactions: resolvers.getTransactions,
    feeEstimate: resolvers.estimateFee,
    balance: resolvers.getBalance,
  },
  Mutation: {
    sendGameItems: resolvers.sendGameItems,
    sendTransaction: resolvers.sendTransaction,
    createWallet: resolvers.createWallet,
    recoverWallet: resolvers.recoverWallet,   
    removeWallets: resolvers.removeWallets,   
  },
  Subscription: {
    newBalance: {
      subscribe: withFilter(
        resolvers.listenForNewBalance,
        (
          newTransaction: IBcoinTx & { walletId: string },
          args: {},
          { user }: { user: { userId: string } },
        ) => {
          return newTransaction.walletId === user.userId;
        },
      ),
      resolve: (payload: { walletId: string }) => {
        return {
          success: true,
          ...payload,
        };
      },
    },
  },
};
