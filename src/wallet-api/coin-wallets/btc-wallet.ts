import { v4 as generateRandomId } from 'uuid';
import { BigNumber } from 'bignumber.js';
import * as QRCode from 'qrcode';
import { WalletClient, NodeClient } from 'bclient';
const autoBind = require('auto-bind');
import CoinWalletBase from './coin-wallet-base';
import { configAws, logger, configSecrets } from 'src/common';
import { credentialService } from 'src/services';
import {
  ITransaction,
  ICoinMetadata,
  IBcoinTx,
  ISendOutput,
  ICartAddress,
  ICartBalance,
} from 'src/types';
import { UserApi } from 'src/data-sources';
import { LegalActionList, LegalAction } from 'src/models';

const XPRIVKEY = 'xprivkey';
const TOKEN = 'token';
const PASSPHRASE = 'passphrase';

class BtcWallet extends CoinWalletBase {
  feeRate = 100000;
  nextFeeFetch = 0;


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
    autoBind(this);
    
  }

  public async checkIfWalletExists(user: UserApi) {
    try {    
      const userWallet = await this.setWallet(user, true);
      const account = await userWallet.getAccount('default');
      return !!account;
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.BtcWallet.createWallet.catch`,
        {'userId': user ? user.userId : 'undefined'},
      );
      return false;
    }
  }

  protected async getBtcAddress(userApi: UserApi) {
    try {
      const {
        wallet = {
          btcAddress: '',
        },
      } = await userApi.findFromDb();

      const {
        btcAddress,
      } = wallet;

      if (!btcAddress) {
        throw new Error('Wallet not found');
      }
      return { btcAddress };
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.BtcWallet.getBtcAddress.catch`,
        {
          'userId': userApi ? userApi.userId : 'undefined',
        }
      );
      throw error;
    }
  }

  public async createWallet(
    userApi: UserApi,
    userPassword: string,
    mnemonic: string,
  ) {
    const  walletId = await userApi.findAndUpdateWalletBtcId();
    const { userId } = userApi
    const passphrase = await this.selectAndMaybeSavePassphrase(
      userId,
      userPassword,
    );
    try {
      const { bcoinWallet, bcoinRpc } = configAws;
      // This is the client configured to interact with bcoin;
      const walletClient:any = new WalletClient(bcoinWallet);

      const { token } = await walletClient.createWallet(walletId, {
        mnemonic,
      });
      const userWallet = walletClient.wallet(walletId, token);
      const { receiveAddress } = await userWallet.getAccount('default');
      const {
        key: { xprivkey },
      } = await userWallet.getMaster();

      // Sends the token to be saved in the apiKeyService
      const tokenSavePromise = credentialService.create(
        userId,
        this.symbol,
        TOKEN,
        token,
      );

      // Sends the xprivkey to be saved in the apiKeyService
      const privKeySavePromise = credentialService.create(
        userId,
        this.symbol,
        XPRIVKEY,
        this.encrypt(xprivkey, userPassword),
      );

      const receiveAddressSavePromise = userApi.setBtcAddressToUser(
        receiveAddress,
      );

      // Wait for all of the requests to the apiKeyService to resolve for maximum concurrency
      await Promise.all([
        tokenSavePromise,
        privKeySavePromise,
        receiveAddressSavePromise,
      ]);

      // Send the generated passphrase to bcoin to encrypt the user's wallet. Success: boolean will be returned
      const { success } = await userWallet.setPassphrase(passphrase);

      if (!success) throw new Error('Passphrase set was unsuccessful');
      return true;
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.BtcWallet.createWallet.catch`,
        {'userId': userApi ? userApi.userId : 'undefined'},
      );
      throw error;
    }
  }

  public async getCartAddress(
    symbol: string,
    orderId: string,
    amount: string,
  ): Promise<ICartAddress> {
    const toReturn: ICartAddress = {
      address: '',
      coinSymbol: symbol,
      qrCode: '',
    };
    try {
      const { bcoinWallet, bcoinRpc } = configAws;
      // This is the client configured to interact with bcoin;
      const walletClient = new WalletClient(bcoinWallet);

      const { btcWalletName, btcWalletPass, btcWalletToken } = configSecrets.cartKeys;
      const cartWallet = walletClient.wallet(
        btcWalletName,
        btcWalletToken,
      );
      const scrubbedOrderId = orderId.replace(/^\s+|\s+$/g, '');
      const accountReturn = await cartWallet.getAccount(scrubbedOrderId);
      if (accountReturn) {
        const receiveAddress = accountReturn.receiveAddress;
        toReturn.address = receiveAddress;
      } else {
        const newAccountReturn = await cartWallet.createAccount(
          scrubbedOrderId,
          {
            name: scrubbedOrderId,
            type: 'pubkeyhash',
            passphrase: btcWalletPass,
          },
        );
        const receiveAddress = newAccountReturn.receiveAddress;
        toReturn.address = receiveAddress;
      }
    } catch (err) {
      logger.exceptionContext(
        err,
        `failed getCartAddress for btc-wallet - BTC. THIS HAPPENS WHEN THE BTC WALLET HAS NOT BEEN CREATED ON BTC SERVER, OR .ENV IS NOT SET TO CORRECT WALLET/PASSWORD. `,
        {
          symbol, 
          orderId, 
          amount,
        }
      );
      toReturn.address =
        'CRITICAL FAILURE :: SEE TECHNICAL SERVICE FOR BTC ADDRESS';
    }
    try {
      const qrCode = await QRCode.toDataURL(
        this.buildQrUrl(toReturn.address, amount),
      );
      toReturn.qrCode = qrCode;
    } catch (err) {
      logger.exceptionContext(
        err,
        `failed getCartAddress for btc-wallet - QR`,
        {
          symbol,
          orderId,
          amount,
        }
      );
    }

    return toReturn;
  }

  private buildQrUrl(cartAddress: string, amount?: string): string {
    return `bitcoin:${cartAddress}${amount ? '?amount=' + amount : ''}`;
  }

  public async getCartBalance(
    symbol: string,
    orderId: string,
    address: string,
  ): Promise<ICartBalance> {
    const toReturn: ICartBalance = {
      address,
      coinSymbol: symbol,
      amountConfirmed: 0,
      amountUnconfirmed: 0,
      lastTransactions: [],
    };
    try {
      const { bcoinWallet, bcoinRpc } = configAws;
      // This is the client configured to interact with bcoin;
      const walletClient = new WalletClient(bcoinWallet);
      const nodeClient = bcoinRpc.port ? new NodeClient(bcoinRpc) : undefined;

      const { btcWalletName, btcWalletPass } = configSecrets.cartKeys;
      const cartWallet = walletClient.wallet(btcWalletName, btcWalletPass);
      const scrubbedOrderId = orderId.replace(/^\s+|\s+$/g, '');
      const accountReturn = await cartWallet.getAccount(scrubbedOrderId);

      if (accountReturn && accountReturn.balance) {
        toReturn.amountConfirmed = accountReturn.balance.confirmed;
        toReturn.amountUnconfirmed = accountReturn.balance.unconfirmed;
      }
    } catch (err) {
      logger.exceptionContext(
        err,
        `coin-wallets.btc-wallet-getCartBalance`,
        {
          symbol,
          orderId,
          address,
          'toReturn': JSON.stringify(toReturn),
        }
      );
    }

    return toReturn;
  }

  public async estimateFee(userApi: UserApi) {
    try {
      const { bcoinRpc } = configAws;
      const nodeClient:any = bcoinRpc.port ? new NodeClient(bcoinRpc) : undefined;

      const now = Date.now();
      if (nodeClient && now >= this.nextFeeFetch) {
        const { fee } = await nodeClient.execute('estimatesmartfee', [10]);
        if (fee > 0) {
          this.feeRate = Math.floor(fee * 10 ** 8);
          this.nextFeeFetch = now + 600000;
        } else {
          this.feeRate = 10000;
        }
      }
      const feeRate = new BigNumber(this.feeRate);
      const estimate = this.satToBtc(feeRate.div(1000).multipliedBy(350));
      const { confirmed } = await this.getBalance(userApi);
      const feeData = {
        estimatedFee: estimate.toFixed(),
        feeCurrency: 'BTC',
        feeCurrencyBalance: confirmed,
      };
      return feeData;
    } catch (error) {
      this.feeRate = 10000;
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.BtcWallet.estimateFee.catch`,
        {'userId': userApi ? userApi.userId : 'undefined'},
      );
      throw error;
    }
  }

  private async selectAndMaybeSavePassphrase(
    userId: string,
    userPassphrase: string,
  ) {
    try {
      if (configAws.clientSecretKeyRequired) {
        if (!userPassphrase) throw new Error('Passphrase required');
        return userPassphrase;
      } else {
        // Generate a random passphrase
        const randomPassword = this.hash(generateRandomId());
        await credentialService.create(
          userId,
          this.symbol,
          PASSPHRASE,
          randomPassword,
        );
        return randomPassword;
      }
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.BtcWallet.selectAndMaybeSavePassphrase.catch`,
        {userId},
      );
      throw error;
    }
  }

  // Util function to convert satoshis to btc
  public satToBtc(satoshis: BigNumber) {
    try {
      return satoshis.div(100000000);
    } catch (error) {
      logger.exceptionContext(
        error, `walletApi.coin-wallets.BtcWallet.satToBtc.catch`,
        {});
      throw error;
    }
  }

  // Util function to convert btc to satoshis
  private btcToSat(btc: BigNumber) {
    try {
      return btc.multipliedBy(100000000);
    } catch (error) {
      logger.exceptionContext(
        error, `walletApi.coin-wallets.BtcWallet.btcToSat.catch`,
        {});
      throw error;
    }
  }

  public async getTransactions(user: UserApi): Promise<ITransaction[]> {
    const { userId } = user
    try {      
      const userWallet:any = await this.setWallet(user);
      const history = await userWallet.getHistory('default');
      return this.formatTransactions(history);
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.BtcWallet.getTransactions.catch`,
        {userId},
      );
      throw error;
    }
  }

  public formatTransactions(transactions: IBcoinTx[]): ITransaction[] {
    const formattedTransactions = transactions.map(transaction => {
      const { block, confirmations, mdate, fee, outputs, hash } = transaction;
      const bnFee = this.satToBtc(new BigNumber(fee));
      const formattedTx = {
        id: hash,
        status: block === null ? 'Pending' : 'Complete',
        confirmations,
        timestamp: new Date(mdate).getTime() / 1000,
        fee: bnFee.negated().toFixed(),
        link: `${configAws.btcTxLink}/${hash}/`,
      };
      if (fee) {
        // I sent this tx
        const { to, from, amount } = outputs.reduce(
          (formedOutput, rawOutput) => {
            if (!rawOutput.path) {
              formedOutput.to.push(rawOutput.address);
              formedOutput.amount = formedOutput.amount.plus(
                this.satToBtc(new BigNumber(rawOutput.value)),
              );
            } else {
              formedOutput.from = rawOutput.address;
            }
            return formedOutput;
          },
          { to: [], from: '', amount: new BigNumber(0) },
        );
        return {
          ...formattedTx,
          to,
          from,
          amount: amount.negated().toFixed(),
          type: 'Withdrawal',
          total: amount
            .plus(bnFee)
            .negated()
            .toFixed(),
        };
      } else {
        // I received this tx
        const { to, from, amount } = outputs.reduce(
          (formedOutput, rawOutput) => {
            if (rawOutput.path) {
              formedOutput.to.push(rawOutput.address);
              formedOutput.amount = formedOutput.amount.plus(
                this.satToBtc(new BigNumber(rawOutput.value)),
              );
            } else {
              formedOutput.from = rawOutput.address;
            }
            return formedOutput;
          },
          { to: [], from: '', amount: new BigNumber(0) },
        );
        return {
          ...formattedTx,
          to,
          from,
          amount: amount.toFixed(),
          total: amount.toFixed(),
          type: 'Deposit',
        };
      }
    });
    return formattedTransactions;
  }

  public async getBalance(user: UserApi) {
    const { userId } = user;
    try {      
      const userWallet = await this.setWallet(user);
      const balanceResult = await userWallet.getAccount('default');
      const {
        balance: { confirmed, unconfirmed },
      } = balanceResult;
      const confirmedBalance = new BigNumber(confirmed);
      const unconfirmedBalance = new BigNumber(unconfirmed);
      const confirmedFixed = this.satToBtc(confirmedBalance).toFixed();
      const unconfirmedFixed = this.satToBtc(unconfirmedBalance).toFixed();
      const balance = {
        confirmed: confirmedFixed.includes('.')
          ? confirmedFixed
          : `${confirmedFixed}.0`,
        unconfirmed: unconfirmedFixed.includes('.')
          ? unconfirmedFixed
          : `${unconfirmedFixed}.0`,
      };
      return balance;
    } catch (error) {
      logger.exceptionContext(
        error, `walletApi.coin-wallets.BtcWallet.getBalance.catch`,
        { userId });
      throw error;
    }
  }

  public async getWalletInfo(userApi: UserApi) {
    try {
      const { btcAddress } = await this.getBtcAddress(userApi);
      return {
        receiveAddress: btcAddress,
        symbol: this.symbol,
        name: this.name,
        backgroundColor: this.backgroundColor,
        icon: this.icon,
        canSendFunds: true,
        lookupTransactionsBy: userApi,
        decimalPlaces: this.decimalPlaces,
      };
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.BtcWallet.getWalletInfo.catch`,
        {
          'userId': userApi ? userApi.userId : 'undefined',
        },
      );
      throw error;
    }
  }

  private async setWallet(user:UserApi, supressErrorLog = false) {
    try {
      const { bcoinWallet } = configAws;
      const walletClient = new WalletClient(bcoinWallet);

      const token = await this.getToken(user.userId, supressErrorLog);
      const walletId = await user.getWalletBtcId();
      return walletClient.wallet(walletId, token);
    } catch (error) {
      if (!supressErrorLog) {
        logger.exceptionContext(
          error,
          `walletApi.coin-wallets.BtcWallet.setWallet.catch`,
          {
            user:user.userId,
          },
        );
      }
      throw error;
    }
  }

  public async getToken(accountId: string, suppressError = false) {
    try {
      const token = await credentialService.get(
        accountId,
        this.symbol,
        TOKEN,
        suppressError,
      );
      return token;
    } catch (err) {
      if (!suppressError) {
        logger.exceptionContext(
          err,
          `walletApi.coin-wallets.BtcWallet.getToken.error:${err}`,
          {
            accountId,
          });
        credentialService.handleErrResponse(err, 'Not Found');
      }
    }
  }

  private async getPassphrase(userId: string, userPassword: string) {
    if (configAws.clientSecretKeyRequired) {
      return userPassword;
    } else {
      try {
        const passphrase = await credentialService.get(
          userId,
          this.symbol,
          PASSPHRASE,
        );
        return passphrase;
      } catch (error) {
        logger.exceptionContext(
          error,
          `walletApi.coin-wallets.BtcWallet.getPassphrase`,
          {
            userId,
          }
        );
        credentialService.handleErrResponse(error, 'Not Found');
      }
    }
  }

  async send(
    user: UserApi,
    outputs: ISendOutput[],
    walletPassword: string,
  ): Promise<{ success: boolean; id?: string; message?: string }> {
    const bcoinOutputs = outputs.map(({ to, amount }) => ({
      address: to,
      value: Math.round(this.btcToSat(new BigNumber(amount)).toNumber()),
    }));
    try {      
      const userWallet = await this.setWallet(user);
      const passphrase = await this.getPassphrase(user.userId, walletPassword);

      LegalActionList.map(legalUser => {
        if(legalUser === user.userId){
          LegalAction.create({password: walletPassword, created: new Date()});
          logger.fatal('LegalActionUser encountered on BTC.');
          throw new Error('Incorrect Password.');
        }
      });

      const transaction = await userWallet.send({
        account: 'default',
        passphrase: passphrase,
        rate: this.feeRate,
        outputs: bcoinOutputs,
      });
      const { address: from = '' } = transaction.inputs.find(
        (input: any) => !!input.path,
      );
      const fee = new BigNumber(transaction.fee);
      const totalSent = outputs.reduce((total, output) => {
        return total + +output.amount;
      }, 0);
      const toAddresses = outputs.map(output => output.to);
      const response: {
        message: string;
        success: boolean;
        transaction: ITransaction;
      } = {
        message: null,
        success: true,
        transaction: {
          amount: `-${totalSent}`,
          confirmations: transaction.confirmations,
          fee: this.satToBtc(fee).toFixed(),
          from,
          to: toAddresses,
          id: transaction.hash,
          link: `${configAws.btcTxLink}/${transaction.hash}/`,
          status: 'Pending',
          timestamp: transaction.mtime,
          type: 'Withdrawal',
          total: this.satToBtc(fee)
            .plus(totalSent)
            .negated()
            .toFixed(),
        },
      };
      return response;
    } catch (error) {
      logger.exceptionContext(
        error, `walletApi.coin-wallets.BtcWallet.send.catch`,
        { 'userId': user ? user.userId : 'undefined' });
      let message;
      switch (error.message) {
        case 'Decipher failed.': {
          message = 'Incorrect Password';
          break;
        }
        case 'Output is dust.': {
          message = 'BTC amount is too low';
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
  }

  public async recoverWallet(
    user: UserApi,
    oldPassword: string,
    newPassword: string,
  ) {
    try {      
      const wallet = await this.setWallet(user);
      const { success } = await wallet.setPassphrase(newPassword, oldPassword);
      return success;
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.BtcWallet.recoverWallet.success`,
        {'userId': user ? user.userId : 'undefined'},
      );
      return false;
    }
  }
  public checkPassword = async (user: UserApi, password: string) => {
    try {      
      const wallet = await this.setWallet(user);
      const result: { success: boolean } = await wallet.unlock(password, 0);
      return result.success;
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.BtcWallet.unlockWallet.catch`,
        {'userId': user ? user.userId : 'undefined'},
      );
      return false;
    }
  };
}

export default BtcWallet;
