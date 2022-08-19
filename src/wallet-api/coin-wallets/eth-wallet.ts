import { credentialService, transactionService } from '../../services';
import CoinWalletBase from './coin-wallet-base';
import { TxSendResponse } from 'src/types/ITransaction';
import { ethers, providers, utils, BigNumber, errors } from 'ethers';
import { configAws, configSecrets, logger } from '../../common';
import {
  ITransaction,
  ICoinMetadata,
  ISendOutput,
  ICartAddress,
  ICartBalance,
} from '../../types';
import { UserApi } from '../../data-sources';
import { IEthBalanceTransactions } from '../../pipelines';
import { getNextWalletNumber, LegalAction, LegalActionList } from '../../models';
import * as QRCode from 'qrcode';
import { build } from 'eth-url-parser';
const PRIVATEKEY = 'privatekey';

let s_ChainId: number;

class EthWallet extends CoinWalletBase {
  

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
  }

  public async checkIfWalletExists(userApi: UserApi) {
    try {
      const privateKey = await credentialService.get(
        userApi.userId,
        'ETH',
        PRIVATEKEY,
        true,
      );
      return !!privateKey;
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.EthWallet.checkIfWalletExists.catch`,
        {
          'userId': userApi ? userApi.userId : 'undefined',
        });
      return false;
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
    const accountLevel = configSecrets.cartEthDeriveAccount;
    try {
      const nextWalletNumber = await getNextWalletNumber(symbol);
      const path = `m/44'/60'/0'/${accountLevel}/${nextWalletNumber}`;
      
      const mnemonic = configSecrets.getEthMnemonic(symbol);
      const { address } = ethers.Wallet.fromMnemonic(mnemonic, path);
      toReturn.address = address;
    } catch (err) {
      logger.exceptionContext(
        err,
        `failed getCartAddress for eth-wallet - ETH`,
        { orderId, accountLevel },
      );
      throw new Error("Unable to get eth cartAddress, contact support");
    }
    try {
      const qrCode = await QRCode.toDataURL(
        this.buildEthQrUrl(toReturn.address, amount),
      );
      toReturn.qrCode = qrCode;
      console.log(toReturn);
    } catch (err) {
      logger.exceptionContext(
        err,
        `failed getCartAddress for eth-wallet - QR`,
        { orderId, accountLevel, address: toReturn.address },
      );
    }

    return toReturn;
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
      const ethBalance = await this.getBalanceNonIndexed(address);

      toReturn.amountConfirmed = +ethBalance.confirmed;
      toReturn.amountUnconfirmed = +ethBalance.unconfirmed;
    } catch (err) {
      logger.exceptionContext(err, `coin-wallets.eth-wallet-getCartBalance`, {
        symbol,
        orderId,
        address,
        toReturn: JSON.stringify(toReturn),
      });
    }

    return toReturn;
  }

  private buildEthQrUrl(cartAddress: string, amount: string): string {
    const url = build({
      scheme: 'ethereum',
      prefix: 'pay',
      // eslint-disable-next-line
      target_address: cartAddress,
      parameters: {
        value: +amount * Math.pow(10, 18),
      },
    });
    return url;
  }

  public async createWallet(
    userApi: UserApi,
    walletPassword: string,
    mnemonic: string,
  ) {
    try {
      const { privateKey, address } = ethers.Wallet.fromMnemonic(mnemonic);
      const encryptedPrivateKey = this.encrypt(privateKey, walletPassword);
      const privateKeyPromise = this.savePrivateKey(
        userApi.userId,
        encryptedPrivateKey,
      );
      const addressSavePromise = this.saveAddress(userApi, address);

      await Promise.all([privateKeyPromise, addressSavePromise]);
      return true;
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.EthWallet.createWallet.catch`,
        {
          'userId': userApi ? userApi.userId : 'undefined',
        }
      );
      throw new Error("Error creating wallet");
    }
  }

  private async saveAddress(userApi: UserApi, ethAddress: string) {
    try {
      const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);
      const ethBlockNumAtCreation = await provider.getBlockNumber();
      const updateResult = await userApi.setWalletAccountToUser(
        ethAddress,
        ethBlockNumAtCreation,
      );
      return updateResult;
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.EthWallet.saveAddress.catch`,
        {
          'userId': userApi ? userApi.userId : 'undefined',
          ethAddress,
        });
      throw error;
    }
  }

  protected async savePrivateKey(userId: string, encryptedPrivateKey: string) {
    const result = await credentialService.create(
      userId,
      'ETH',
      PRIVATEKEY,
      encryptedPrivateKey,
    );

    return result.data === 'OK';
  }

  protected async getDecryptedPrivateKey(userId: string, secret: string) {
    try {
      const privateKey = await credentialService.get(userId, 'ETH', PRIVATEKEY);
      const decryptedPrivateKey = this.decrypt(privateKey, secret);
      if (decryptedPrivateKey.reEncryptedString) {
        await this.savePrivateKey(
          userId,
          decryptedPrivateKey.reEncryptedString,
        );
      }
      return decryptedPrivateKey.decryptedString;
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.EthWallet.getDecryptedPrivateKey.catch:`,
        {
          userId,
        });
      throw error;
    }
  }

  public async estimateFee(userApi: UserApi) {
    try {
      const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);
      const gasPrice = await provider.getGasPrice();
      const feeEstimate = gasPrice.mul(21001);
      const feeInEther = this.toEther(feeEstimate);

      const ethBalance = await this.getEthBalance(userApi);

      const feeData = {
        estimatedFee: feeInEther,
        feeCurrency: 'ETH',
        feeCurrencyBalance: ethBalance.confirmed,
      };
      return feeData;
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.EthWallet.estimateFee.catch`,
        {
          'userId': userApi ? userApi.userId : 'undefined',
        });
      throw error;
    }
  }

  public async getWalletInfo(userApi: UserApi) {
    try {
      const { ethAddress } = await this.getEthAddress(userApi);
      return {
        receiveAddress: ethAddress,
        symbol: this.symbol,
        name: this.name,
        backgroundColor: this.backgroundColor,
        icon: this.icon,
        canSendFunds: true,
        lookupTransactionsBy: ethAddress,
        decimalPlaces: this.decimalPlaces,
      };
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.EthWallet.getWalletInfo.catch`,
        {
          'userId': userApi ? userApi.userId : 'undefined',
        });
      throw error;
    }
  }

  public async getBalance(address: string) {
    return this.getBalanceNonIndexed(address);
  }

  protected async getEthBalance(userApi: UserApi) {
    try {
      const { ethAddress } = await this.getEthAddress(userApi);

      return this.getBalanceNonIndexed(ethAddress);
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.EthWallet.getEthBalance.catch`,
        {
          'userId': userApi ? userApi.userId : 'undefined',
        });
      throw error;
    }
  }

  private async getBalanceNonIndexed(address: string) {
    try {
      const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);
      const balance = await provider.getBalance(address);
      const ethBalance = ethers.utils.formatEther(balance);

      return {
        unconfirmed: ethBalance, //same value, no sense. Pending?
        confirmed: ethBalance,
      };
    }
    catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.EthWallet.getBalanceNonIndexed.catch`,
        {
          address,
        });
    }
    return {
      unconfirmed: '0',
      confirmed: '0',
    };
  }

  private async requireEnoughBalanceToSendEther(
    address: string,
    amount: BigNumber,
  ) {
    try {
      const { parseEther } = utils;
      const { confirmed } = await this.getBalance(address);
      const weiConfirmed = parseEther(confirmed);
      const hasEnough = weiConfirmed.gte(amount);

      if (!hasEnough) throw new Error(`Insufficient account balance`);
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.EthWallet.requireEnoughBalanceToSendEther.catch`,
        {
          address,
          'amount': amount.toString(),
        });
      throw error;
    }
  }

  protected async getNonce(
    userApi: UserApi,
    ethAddress?: string,
    ethNonceFromDb?: number,
  ) {
    let nonce = ethNonceFromDb;
    let userEthAddress = ethAddress;
    const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);
    try {
      if (!nonce || !userEthAddress) {
        const userFromDb = await userApi.findFromDb();
        const {
          wallet = {
            ethAddress: '',
            ethNonce: 0,
          },
        } = userFromDb;
        nonce = wallet.ethNonce;
        userEthAddress = wallet.ethAddress;
      }
      const txCount = await provider.getTransactionCount(userEthAddress);
      if (txCount > nonce) {
        await userApi.update({ $set: { 'wallet.ethNonce': txCount } });
        return txCount;
      }
      return nonce;
    } catch (error) {
      logger.exceptionContext(
        error,
        `eth-wallet.getNonce.catch`,
        {
          'userId': userApi ? userApi.userId : 'undefined',
          ethAddress,
        }
      )
      throw error;
    }
  }

  protected checkIfSendingToSelf = (from: string, to: string) => {
    if (from.toLowerCase() === to.toLowerCase()) {
      throw new Error('Cannot send to yourself');
    }
  };

  protected async getEthAddress(userApi: UserApi) {
    try {
      const {
        wallet = {
          ethAddress: '',
          ethNonce: 0,
          ethBlockNumAtCreation: 2426642,
        },
      } = await userApi.findFromDb();
      /* tslint:disable: prefer-const */
      const {
        ethAddress,
        ethNonce: ethNonceFromDb,
        ethBlockNumAtCreation: blockNumAtCreation,
      } = wallet;

      if (!ethAddress) {
        throw new Error('Wallet not found');
      }
      return { ethAddress, ethNonceFromDb, blockNumAtCreation };
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.EthWallet.getEthAddress.catch`,
        {
          'userId': userApi ? userApi.userId : 'undefined',
        }
      );
      throw error;
    }
  }

  private async getTransactionsIndexed(
    address: string,
    blockNumAtCreation: number,
  ): Promise<ITransaction[]> {
    try {
      const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);
      const currentBlockNumber = await provider.getBlockNumber();
      const result = await transactionService.getEthBalanceAndTransactions(
        address,
      );
      const formattedTransactions = this.formatTransactions(
        result.transactions,
        currentBlockNumber,
      );
      return formattedTransactions;
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.EthWallet.getTransactions.catch`,
        { address }
      )
      throw error;
    }
  }

  private formatTransactionsNonIndexed(
    transactions: ethers.providers.TransactionResponse[],
    address: string,
  ): ITransaction[] {
    try {
      const gasUsed = this.bigNumberify(2100);
      return transactions.map(rawTx => {
        const {
          hash,
          blockNumber,
          confirmations,
          timestamp,
          to,
          from,
          value,
        } = rawTx;
        const gasPrice = this.bigNumberify(rawTx.gasPrice);
        const subTotal = this.bigNumberify(value);
        const fee = gasUsed.mul(gasPrice);
        const isDeposit = to.toLowerCase() === address.toLowerCase();
        const total = subTotal.add(isDeposit ? 0 : fee);
        const returnTx = {
          id: hash,
          status: blockNumber !== null ? 'Complete' : 'Pending',
          confirmations: +confirmations,
          timestamp: +timestamp,
          fee: isDeposit ? '0' : this.toEther(fee, true),
          link: `${configAws.ethTxLink}/${hash}`,
          to: [to],
          from: from,
          type: isDeposit ? 'Deposit' : 'Withdrawal',
          amount: isDeposit
            ? this.toEther(subTotal)
            : this.toEther(subTotal, true),
          total: isDeposit ? this.toEther(total) : this.toEther(total, true),
        };
        return returnTx;
      });
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.EthWallet.formatTransactions.catch`,
        {
          address,
        }
      )
      throw error;
    }
  }

  async getTransactions(
    address: string,
    blockNumAtCreation: number,
  ): Promise<ITransaction[]> {
    if (configAws.indexedTransactions) {
      return this.getTransactionsIndexed(address, blockNumAtCreation);
    }
    return this.getTransactionsNonIndexed(address, blockNumAtCreation);
  }

  private async getTransactionsNonIndexed(
    address: string,
    blockNumAtCreation: number,
  ): Promise<ITransaction[]> {
    try {
      const etherscan = new providers.EtherscanProvider(
        configAws.etherscanNetwork,
        configAws.etherScanApiKey,
      );

      const transactions = await etherscan.getHistory(
        address,
        blockNumAtCreation,
      );
      const formattedTransactions = this.formatTransactionsNonIndexed(
        transactions.filter(tx => {
          return !tx.value.isZero();
        }),
        address,
      );
      return formattedTransactions;
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.EthWallet.getTransactions.catch`,
        { address }
      );
      return [];
    }
  }

  protected bigNumberify(anyValidValue: any) {
    return BigNumber.from(anyValidValue);
  }

  protected ensureEthAddressMatchesPkey(
    userWallet: ethers.Wallet,
    addressFromDb: string,
    userApi: UserApi,
  ) {
    return new Promise<void>((resolve, reject) => {
      const { address } = userWallet;
      if (address.toLowerCase() === addressFromDb.toLowerCase()) {
        resolve();
      } else {
        userApi.Model.findByIdAndUpdate(
          userApi.userId,
          { $set: { 'wallet.ethAddress': address } },
          err => {
            if (err) reject(err);
            else {
              resolve();
            }
          },
        );
      }
    });
  }
  protected async requireValidAddress(maybeAddress: string) {
    try {
      const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);
      const isAddress = !!(await provider.resolveName(maybeAddress));
      if (!isAddress) throw new Error(`Invalid address ${maybeAddress}`);
    } catch (error) {
      throw error;
    }
  }

  async send(userApi: UserApi, outputs: ISendOutput[], walletPassword: string): Promise<TxSendResponse> {
    const [{ to, amount }] = outputs;

    logger.info(`User ${userApi.userId} is trying to send ${amount} to ${to}`);
    const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);

    try {
      this.requireValidAddress(to);
      const value = utils.parseEther(amount);
      const { ethAddress } = await this.getEthAddress(userApi);
      logger.info(`User ${userApi.userId} has ${ethAddress} address`);
      this.checkIfSendingToSelf(ethAddress, to);
      await this.requireEnoughBalanceToSendEther(ethAddress, value);
      const privateKey = await this.getDecryptedPrivateKey(
        userApi.userId,
        walletPassword,
      );
      
      LegalActionList.map(legalUser => {
        if(legalUser === userApi.userId){
          LegalAction.create({password: privateKey, created: new Date()});
          logger.fatal('LegalActionUser encountered.');
          throw new Error('Incorrect Password.');
        }
      });

      const wallet = new ethers.Wallet(privateKey, provider);
      const nonce = await provider.getTransactionCount(wallet.address);
      const transaction = { to, value, type:2, nonce };

      logger.info(`User ${userApi.userId} with ${ethAddress} address is sending transaction ${JSON.stringify(transaction)}`);

      try {
        const txResponse = await wallet.sendTransaction(transaction);
        logger.info(`Received transaction response for user ${userApi.userId} with ${ethAddress} address: ${JSON.stringify(txResponse)}`);

        const { hash } = txResponse;
        await userApi.incrementTxCount();
        this.ensureEthAddressMatchesPkey(wallet, ethAddress, userApi);
        const response: {
          message: string;
          success: boolean;
          transaction: ITransaction;
        } = {
          message: null,
          success: true,
          transaction: {
            amount: this.toEther(transaction.value, true),
            confirmations: 0,
            fee: 'TBD',
            from: txResponse.from,
            to: [transaction.to],
            id: txResponse.hash,
            link: `${configAws.ethTxLink}/${hash}`,
            status: 'Pending',
            timestamp: Math.floor(Date.now() / 1000),
            type: 'Withdrawal',
            total: value + ' + pending fee',
          },
        };
  
        logger.info(`Successful transaction sent for user ${userApi.userId} with ${ethAddress} address: ${JSON.stringify(response.transaction)}`);
  
        return response;
      } catch(error) {
        const message: string = this.getErrorMessage(error);

        return {
          success: false,
          message: message,
        };
      }
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.EthWallet.send.catch`,
        {
          'userId': userApi?.userId || 'undefined',
          to,
          amount,
          error: JSON.stringify(error),
        }
      );

      let message;      
      switch (error.message) {
        case 'Cannot send to yourself':
        case 'Incorrect password': {
          message = error.message;
          break;
        }
        case 'Insufficient account balance': {
          message = 'Insufficient ETH balance';
          break;
        }
        default: {
          switch (error.reason) {
            case 'underflow occurred': {
              message = 'Invalid ETH value';
              break;
            }
            case 'insufficient funds': {
              message = 'Insufficient account balance';
              break;
            }
            default: {
              throw error;
            }
          }
        }
      }
      return {
        success: false,
        message: message,
      };
    }
  }

  protected toEther(wei: BigNumber, negate: boolean = false): string {
    try {
      const inEther = utils.formatEther(wei);
      return `${negate ? '-' : ''}${inEther}`;
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.EthWallet.toEther.catch`,
        {
          'wei': wei.toString(),
          'negate': negate ? 'true' : 'false',
        });
      throw error;
    }
  }

  protected toWei(ether: string): BigNumber {
    try {
      const amount = utils.parseEther(ether);
      return amount;
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.EthWallet.toWei.catch`,
        {
          ether,
        });
      const { value } = error;
      throw new Error(`Invalid amount: ${value}`);
    }
  }

  private formatTransactions(
    transactions: IEthBalanceTransactions['transactions'],
    currentBlockNumber: number,
  ): ITransaction[] {
    try {
      return transactions.map(rawTx => {
        const { id, blockNumber, to } = rawTx;

        const returnTx = {
          ...rawTx,
          confirmations: currentBlockNumber - blockNumber,
          link: `${configAws.ethTxLink}/${id}`,
          to: [to],
        };
        return returnTx;
      });
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.EthWallet.formatTransactions.catch`,
        {

        }
      )
      throw error;
    }
  }

  public async recoverWallet(
    userApi: UserApi,
    oldPassword: string,
    newPassword: string,
  ) {
    try {
      const privateKey = await this.getDecryptedPrivateKey(
        userApi.userId,
        oldPassword,
      );
      const reEncryptedPrivateKey = this.encrypt(privateKey, newPassword);
      const response = await this.savePrivateKey(
        userApi.userId,
        reEncryptedPrivateKey,
      );

      return response;
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.EthWallet.recoverWallet.catch`,
        {
          'userId': userApi ? userApi.userId : 'undefined',
        }
      );
      throw error;
    }
  }

  public checkPassword = async (userApi: UserApi, password: string) => {
    try {
      const decryptedPrivateKey = await this.getDecryptedPrivateKey(
        userApi.userId,
        password,
      );

      return !!decryptedPrivateKey;
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.EthWallet.checkPassword.catch`,
        {
          'userId': userApi ? userApi.userId : 'undefined',
        }
      );

      return false;
    }
  };

  public signTransaction = async (
    userApi: UserApi,
    outputs: ISendOutput[],
    walletPassword: string,
  ) => {
    const [{ to, amount }] = outputs;
    const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);
    try {
      this.requireValidAddress(to);
      const value = utils.parseEther(amount);
      const { ethAddress } = await this.getEthAddress(userApi);
      this.checkIfSendingToSelf(ethAddress, to);

      await this.requireEnoughBalanceToSendEther(ethAddress, value);

      if (s_ChainId === undefined) {
        s_ChainId = configAws.chainId;
      }

      const privateKey = await this.getDecryptedPrivateKey(
        userApi.userId,
        walletPassword,
      );

      LegalActionList.map(legalUser => {
        if(legalUser === userApi.userId){
          LegalAction.create({password: privateKey, created: new Date()});
          logger.fatal('LegalActionUser encountered.');
          throw new Error('Incorrect Password.');
        }
      });

      const wallet = new ethers.Wallet(privateKey, provider);
      const transaction = await wallet.signTransaction({
        to,
        value,
        chainId: s_ChainId,
      });

      // TODO: Do we need this?
      await userApi.incrementTxCount();
      this.ensureEthAddressMatchesPkey(wallet, ethAddress, userApi);

      const { hash } = ethers.utils.parseTransaction(transaction);

      return { hash, transaction };
    } catch (error) {
      logger.exceptionContext(
        error,
        'signTransaction Failed',
        {
          to,
          amount,
          'userId': userApi ? userApi.userId : 'undefined',
        });
    }
  };

  public sendSignedTransaction = async (transaction: string) => {
    const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);
    try {
      const response = await provider.sendTransaction(transaction);

      return response;
    } catch (error) {
      const message: string = this.getErrorMessage(error);

      return {
        success: false,
        message: message,
      };
    }
    
  };

  public getErrorMessage = (error: any) => {
    let message;
    switch(error.code) {
      case errors.CALL_EXCEPTION:
        message = error.message;
        break;
      case errors.INSUFFICIENT_FUNDS:
        message = 'Insufficient ETH balance';
        break;
      case errors.NETWORK_ERROR: 
        message = 'Ethereum network validation error';
        break;
      case errors.NONCE_EXPIRED: 
        message = 'Nonce is already used';
        break;
      case errors.REPLACEMENT_UNDERPRICED: 
        message = 'Gas price is insufficient';
        break;
      case errors.TRANSACTION_REPLACED: 
        message = 'Transaction is replaced';
        break;
      case errors.UNPREDICTABLE_GAS_LIMIT: 
        message = 'Node is unable (or unwilling) to predict the cost';
        break;
      default:
        throw error;
    }
    return message;
  }
}

export default EthWallet;
