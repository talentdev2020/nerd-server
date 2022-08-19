import EthWallet from './eth-wallet';
import { config, configAws, configSecrets, logger } from 'src/common';
import { ethers, utils, BigNumber, Overrides } from 'ethers';
import {
  ITransaction,
  ICoinMetadata,
  ISendOutput,
  ICartAddress,
  ICartBalance,
} from 'src/types';
import { UserApi } from 'src/data-sources';
import { transactionService } from 'src/services';
import { ITokenBalanceTransactions } from 'src/pipelines';
import { getNextWalletNumber, LegalAction, LegalActionList } from 'src/models';
import { build } from 'eth-url-parser';
import * as QRCode from 'qrcode';
import { TxSendResponse } from 'src/types/ITransaction';

class Erc20API extends EthWallet {
  decimalPlaces: number;
  decimalFactor: BigNumber;
  decimalFactorNegative: BigNumber;
  abi: any;
  WEB3_GAS_ERROR = 'Returned error: insufficient funds for gas * price + value';
  NEW_GAS_ERROR = 'Insufficient credits';
  tokenMetadata: ICoinMetadata;
  // const provider = new ethers.providers.JsonRpcProvider(config.ethNodeUrl);
  // const contract: ethers.Contract = new ethers.Contract(contractAddress, abi, provider);

  constructor(tokenMetadata: ICoinMetadata) {
    super(tokenMetadata);
    this.validateArguments(tokenMetadata);
    this.tokenMetadata = tokenMetadata;    
    this.decimalPlaces = tokenMetadata.decimalPlaces;
    // this.decimalFactor = this.bigNumberify(10).pow(decimalPlaces);
    // this.decimalFactorNegative = this.bigNumberify(10).pow(
    //   this.bigNumberify(this.bigNumberify(0).sub(decimalPlaces)),
    // );
  }

  private validateArguments({
    abi,
    decimalPlaces,
    contractAddress,
  }: ICoinMetadata) {
    if (!abi)
      throw new Error(
        'No abi provided in token configuration for wallet interface. This parameter is required.',
      );
    if (!decimalPlaces || decimalPlaces < 0)
      throw new Error(
        'No decimalPlaces provided in token configuration for wallet interface. This parameter is required.',
      );
    if (!contractAddress)
      throw new Error(
        'No contractAddress provided in token configuration for wallet interface. This parameter is required.',
      );
  }

  public async getCartAddress(
    symbol: string,
    orderId: string,
    amount: string,
  ): Promise<ICartAddress> {
    const nextWalletNumber = await getNextWalletNumber(symbol);
    const accountLevel = configSecrets.cartEthDeriveAccount;

    const path = `m/44'/60'/0'/${accountLevel}/${nextWalletNumber}`;
    const mnemonic = configSecrets.getEthMnemonic(symbol);
    const { address } = ethers.Wallet.fromMnemonic(mnemonic, path);
    const qrCode = await QRCode.toDataURL(
      this.buildQrErc20Url(address, amount),
    );

    const result: ICartAddress = {
      address,
      coinSymbol: symbol,
      qrCode,
    };
    return result;
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
      const ethBalance = await this.getBalanceFromContract(address);

      toReturn.amountConfirmed = +ethBalance;
      toReturn.amountUnconfirmed = +ethBalance;
    } catch (err) {      
      logger.exceptionContext(
        err,
        `coin-wallets.erc20-wallet-getCartBalance`,
        {
          symbol,
          orderId,
          address,
        }
      );
    }
    return toReturn;
  }

  private buildQrErc20Url(cartAddress: string, amount: string): string {
    if (!this.contractAddress) return undefined;
    const url = build({
      scheme: 'ethereum',
      prefix: 'pay',
      // eslint-disable-next-line
      target_address: this.contractAddress,
      parameters: {
        address: cartAddress,
        uint256: +amount * Math.pow(10, 8),
      },
      // eslint-disable-next-line
      function_name: 'transfer',
    });
    return url;
  }

  async estimateFee(userApi: UserApi) {
    try {
      const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);
      const FALLBACK_GAS_VALUE = this.bigNumberify(configAws.erc20GasValue);
      const gasPrice = await provider.getGasPrice();
      const ethBalance = await this.getEthBalance(userApi);
      const backupFeeEstimate = this.toEther(
      FALLBACK_GAS_VALUE.mul(gasPrice),
      );
      return {
        estimatedFee: backupFeeEstimate,
        feeCurrency: 'ETH',
        feeCurrencyBalance: ethBalance.confirmed,
      };
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.Erc20Wallet.estimateFee.catch`,
        { 'userId': userApi ? userApi.userId : 'undefined' }
      );
    }
  }

  private negate(numToNegate: string | BigNumber) {
    try {
      if (typeof numToNegate === 'string') return `-${numToNegate}`;
      return this.bigNumberify(0).sub(numToNegate);
    } catch (error) {
      logger.exceptionContext(
        error,`walletApi.coin-wallets.Erc20Wallet.negate.catch`,
        {

        });
      throw error;
    }
  }

  private decimalize(numHexOrBn: string | number | BigNumber): string {
    try {
      const parsedUnits = utils.formatUnits(
        numHexOrBn.toString(),
        this.decimalPlaces,
      );
      return parsedUnits;
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.Erc20Wallet.decimalize.catch`,
        {  }
      );
      throw error;
    }
  }

  private integerize(decimalizedString: string) {
    try {
      const integer = utils.parseUnits(decimalizedString, this.decimalPlaces);
      return integer;
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.Erc20Wallet.integerize.catch`,
        { decimalizedString }
      );
      throw error;
    }
  }

  private async getBalanceFromContract(ethAddress: string) {
    try {
      const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);
      const contract: ethers.Contract = new ethers.Contract(this.tokenMetadata.contractAddress, this.tokenMetadata.abi, provider);
      const balance = await contract.balanceOf(ethAddress);
      const pending = await contract;
      const decimalizedBalance = this.decimalize(balance);
      return decimalizedBalance;
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.Erc20Wallet.getBalanceFromContract.catch`,
        { ethAddress }
      );
      throw error;
    }
  }

  async getWalletInfo(userApi: UserApi) {
    try {
      const { ethAddress, blockNumAtCreation } = await this.getEthAddress(
        userApi,
      );
      return {
        contractAddress: this.contractAddress,
        receiveAddress: ethAddress,
        symbol: this.symbol,
        name: this.name,
        backgroundColor: this.backgroundColor,
        icon: this.icon,
        blockNumAtCreation,
        canSendFunds: true,
        lookupTransactionsBy: ethAddress,
        decimalPlaces: this.decimalPlaces,
      };
    } catch (error) {
      logger.exceptionContext(error, 'wallet-api.coin-wallets.erc20-wallet.getWalletInfo - exception thrown', 
        {
          'contractAddress': this.contractAddress,
          'symbol': this.symbol,
          'name': this.name,
          'decimalPlaces': this.decimalPlaces,
          'userId': userApi ? userApi.userId : 'undefined',
        });

      throw error;
    }
  }

  private async transferEventsToTransactions(
    transferEvents: ethers.Event[],
    userAddress: string,
  ): Promise<ITransaction[]> {
    return Promise.all(
      transferEvents
        .sort(
          (eventOne, eventTwo) => eventTwo.blockNumber - eventOne.blockNumber,
        )
        .map(async event => {
          const {
            transactionHash,
            args,
            getTransaction,
            getTransactionReceipt,
            getBlock,
          } = event;
          const [
            { gasPrice, confirmations },
            { gasUsed },
            { timestamp },
          ] = await Promise.all([
            getTransaction(),
            getTransactionReceipt(),
            getBlock(),
          ]);
          const { tokens, to, from } = args;
          const amount = this.decimalize(tokens.toString());
          const fee = gasUsed.mul(gasPrice);
          const feeString = `${utils.formatEther(fee)} ETH`;
          const isDeposit = to === userAddress;
          const formattedAmount = isDeposit
            ? amount.toString()
            : this.negate(amount).toString();
          const formattedTotal = isDeposit
            ? `${formattedAmount}`
            : `${formattedAmount} ${this.symbol}, -${feeString}`;

          return {
            id: transactionHash,
            status: confirmations > 0 ? 'Complete' : 'Pending',
            timestamp,
            confirmations,
            fee: isDeposit ? '0' : feeString,
            link: `${configAws.ethTxLink}/${transactionHash}`,
            to: [to],
            from,
            type: isDeposit ? 'Deposit' : 'Withdrawal',
            amount: formattedAmount,
            total: formattedTotal,
          };
        }),
    );
  }

  private async formatWalletTransactions(
    walletTransactions: ITokenBalanceTransactions['transactions'],
    currentBlockNumber: number,
  ): Promise<ITransaction[]> {
    return Promise.all(
      walletTransactions.map(async transferEvent => {
        const { id, blockNumber, amount, fee, timestamp } = transferEvent;
        let total = amount;
        if (fee !== '0') {
          total = `${amount} ${this.symbol}, ${fee} ETH`;
        }

        return {
          ...transferEvent,
          id: id || `pending:${Date.now()}`,
          timestamp:
            timestamp > (Date.now() * 10) / 1000 ? timestamp / 1000 : timestamp,
          total,
          confirmations: blockNumber ? currentBlockNumber - blockNumber : 0,
          link: `${configAws.ethTxLink}/${id}`,
        };
      }),
    );
  }

  private getIndexedTransactions = async (address: string) => {
    try {
      const result = await transactionService.getGalaBalanceAndTransactions(
        address,
      );
      const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);

      const currentBlock = await provider.getBlockNumber();
      const transactions = await this.formatWalletTransactions(
        result.transactions,
        currentBlock,
      );
      return transactions;
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.Erc1155Wallet.getTransactions.catch`,
        { address }
      );
      throw error;
    }
  };

  // private getIndexedBalance = async (address: string) => {
  //   const {
  //     confirmedBalance,
  //     pendingBalance,
  //   } = (await transactionService.getGalaBalanceAndTransactions(address)) as {
  //     confirmedBalance: number;
  //     pendingBalance: number;
  //   };
  //   return {
  //     confirmed: confirmedBalance.toString(),
  //     unconfirmed: pendingBalance.toString(),
  //   };
  // };

  async getTransactions(
    address: string,
    blockNumAtCreation: number,
  ): Promise<ITransaction[]> {
    const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);
    const contract: ethers.Contract = new ethers.Contract(this.tokenMetadata.contractAddress, this.tokenMetadata.abi, provider);

    const { Transfer } = contract.filters;
    try {
      if (configAws.indexedTransactions) {
        return this.getIndexedTransactions(address);
      }
      const [sent, received] = await Promise.all([
        contract.queryFilter(Transfer(address), blockNumAtCreation),
        contract.queryFilter(Transfer(null, address), blockNumAtCreation),
      ]);

      const transactions = await this.transferEventsToTransactions(
        [...sent, ...received],
        address,
      );

      return transactions;
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.Erc20Wallet.getTransactions.catch`,
        { address }
      );
      throw error;
    }
  }

  public async getBalance(address: string) {
    try {
      const balance = await this.getBalanceFromContract(address);
      return {
        confirmed: balance.toString(),
        unconfirmed: balance.toString(), //same value, no sense
      };
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.Erc20Wallet.getBalance.catch`,
        { address }
      );
      throw error;
    }
  }

  private async requireEnoughTokensAndEtherToSend(
    userApi: UserApi,
    address: string,
    amount: string,
  ) {
    try {
      const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);

      const { parseEther, parseUnits } = utils;
      const [
        { confirmed: tokenBalance },
        feeEstimate,
        etherBalance,
      ] = await Promise.all([
        this.getBalance(address),
        this.estimateFee(userApi),
        provider.getBalance(address),
      ]);
      const hasEnoughEther = etherBalance.gt(
        parseEther(feeEstimate.estimatedFee),
      );
      const hasEnoughTokens = parseUnits(tokenBalance, this.decimalPlaces).gte(
        amount,
      );
      if (!hasEnoughTokens) {
        throw new Error(`Insufficient token balance`);
      }
      if (!hasEnoughEther) {
        throw new Error('Insufficient ETH balance');
      }
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.Erc20Wallet.requireEnoughTokensAndEtherToSend.catch: $(error)`,
        { 
          'userId': userApi ? userApi.userId : 'undefined',
          address,
          amount,
         }
      );
      throw error;
    }
  }

  async send(userApi: UserApi, outputs: ISendOutput[], walletPassword: string): Promise<TxSendResponse> {
    const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);
    const contract: ethers.Contract = new ethers.Contract(this.tokenMetadata.contractAddress, this.tokenMetadata.abi, provider);

    const [{ to, amount: value }] = outputs;
    const overrides: Overrides = {};
    try {
      const { ethNonceFromDb, ethAddress } = await this.getEthAddress(userApi);
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

      const amount = this.integerize(value);
      const wallet = new ethers.Wallet(privateKey, provider);

      await this.requireEnoughTokensAndEtherToSend(
        userApi,
        wallet.address,
        amount.toString(),
      );

      const contractConnected = contract.connect(wallet);

      const [gasLimit, nonce, gasPrice] = await Promise.all([
        contractConnected.estimateGas.transfer(to, amount),
        provider.getTransactionCount(wallet.address),
        provider.getGasPrice(),
      ]);
      overrides.gasLimit = gasLimit;
      overrides.type = 2;      
      overrides.nonce = nonce;

      const transaction = await contractConnected.transfer(to, amount, overrides);
      const { hash } = transaction;
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
          amount: `-${value}`,
          confirmations: 0,
          fee: 'TBD',
          from: transaction.from,
          to: [transaction.to],
          id: transaction.hash,
          link: `${configAws.ethTxLink}/${hash}`,
          status: 'Pending',
          timestamp: Math.floor(Date.now() / 1000),
          type: 'Withdrawal',
          total: value + ' + pending fee',
        },
      };
      return response;
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.Erc20Wallet.send.catch`,
        {
          'userId': userApi ? userApi.userId : 'undefined',
          to: to,
          value: value,
          overrides: JSON.stringify(overrides),
        },
      );

      let message;
      switch (error.message) {
        case 'Insufficient ETH balance': {
          message = error.message;
          break;
        }
        case 'Insufficient token balance': {
          message = `Insufficient ${this.symbol} balance`;
          break;
        }
        case 'Incorrect password': {
          message = error.message;
          break;
        }
        default: {
          if (error.reason === 'underflow occurred') {
            message = `Invalid ${this.symbol} value`;
          } else {
            throw error;
          }
        }
      }
      return {
        success: false,
        message,
        transaction: undefined,
      };
    }
  }
}

export default Erc20API;
