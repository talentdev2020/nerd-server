import { ethers, utils, constants, BigNumber } from 'ethers';
import EthWallet from './eth-wallet';
import { config, configAws, logger } from '../../common';
import { ITransaction, ICoinMetadata, ISendOutput } from '../../types';
import { UserApi } from '../../data-sources';
//import nodeSelector from '../../services/node-selector';
import { transactionService } from '../../services';
import { ITokenBalanceTransactions } from '../../pipelines';
import { TxSendResponse } from 'src/types/ITransaction';


let s_ChainId: number;

class Erc1155API extends EthWallet {
  contract: ethers.Contract;
  decimalPlaces: number;
  decimalFactor: BigNumber;
  decimalFactorNegative: BigNumber;
  abi: any;
  WEB3_GAS_ERROR = 'Returned error: insufficient funds for gas * price + value';
  NEW_GAS_ERROR = 'Insufficient credits';
  FALLBACK_GAS_VALUE = this.bigNumberify(36254);
  tokenId: string;

  constructor(tokenMetadata: ICoinMetadata) {
    super(tokenMetadata);
    this.validateArguments(tokenMetadata);
        
    this.decimalPlaces = tokenMetadata.decimalPlaces;
    this.decimalFactor = this.bigNumberify(10).pow(tokenMetadata.decimalPlaces);
    this.decimalFactorNegative = this.bigNumberify(10).pow(
      this.bigNumberify(this.bigNumberify(0).sub(tokenMetadata.decimalPlaces)),
    );
    this.tokenId = tokenMetadata.tokenId;
  }

  private validateArguments({
    abi,
    decimalPlaces,
    contractAddress,
    tokenId,
  }: ICoinMetadata) {
    if (!abi)
      throw new Error(
        'No abi provided in token configuration for wallet interface. This parameter is required.',
      );
    if (!(decimalPlaces >= 0))
      throw new Error(
        'No decimalPlaces provided in token configuration for wallet interface. This parameter is required.',
      );
    if (!contractAddress)
      throw new Error(
        'No contractAddress provided in token configuration for wallet interface. This parameter is required.',
      );
    if (!tokenId)
      throw new Error(
        'No tokenId provided in token configuration for wallet interface. This parameter is required.',
      );
  }

  async estimateFee(userApi: UserApi) {
    const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);
    
    const gasPrice = await provider.getGasPrice();
    const ethBalance = await this.getEthBalance(userApi);
    try {
      const feeEstimate = this.toEther(this.FALLBACK_GAS_VALUE.mul(gasPrice));
      return {
        estimatedFee: feeEstimate,
        feeCurrency: 'ETH',
        feeCurrencyBalance: ethBalance.confirmed,
      };
    } catch (error) {
      if (!error.message.includes('always failing transaction')) {
        logger.exceptionContext(error,
          `walletApi.coin-wallets.Erc1155Wallet.estimateFee.catch`, 
          {
            'userId': userApi ? userApi.userId : 'undefined',
          },
        );
      }
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
      logger.exceptionContext(error,
        `walletApi.coin-wallets.Erc1155Wallet.decimalize.catch`, 
        {},
      );
      throw error;
    }
  }

  private integerize(decimalizedString: string) {
    try {
      const integer = utils.parseUnits(
        decimalizedString.toString(),
        this.decimalPlaces,
      );
      return integer;
    } catch (error) {
      logger.exceptionContext(error,
        `walletApi.coin-wallets.Erc1155Wallet.integerize.catch`, 
        {
          decimalizedString,
        },
      );
      throw error;
    }
  }

  private async getBalanceFromContract(ethAddress: string) {
    try {
      const balance = await this.contract.balanceOf(ethAddress, this.tokenId);
      const decimalizedBalance = this.decimalize(balance);
      return decimalizedBalance;
    } catch (error) {
      logger.exceptionContext(error,
        `walletApi.coin-wallets.Erc1155Wallet.getBalanceFromContract.catch`, 
          {
            ethAddress,
          },
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
      logger.exceptionContext(error,
        `walletApi.coin-wallets.Erc1155Wallet.getWalletInfo.catch`, 
          {
            'userId': userApi ? userApi.userId : 'undefined',
          },
      );
      throw error;
    }
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

  async getTransactions(
    address: string,
    blockNumAtCreation: number,
  ): Promise<ITransaction[]> {
    const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);
    

    try {
      const result = await transactionService.getTokenBalanceAndTransactions(
        this.tokenId,
        address,
      );
      const currentBlock = await provider.getBlockNumber();
      const transactions = await this.formatWalletTransactions(
        result.transactions,
        currentBlock,
      );
      return transactions;
    } catch (error) {
      logger.exceptionContext(error,
        `walletApi.coin-wallets.Erc1155Wallet.getTransactions.catch`, 
          {address},
      );
      throw error;
    }
  }

  public async getBalance(address: string) {
    try {
      const balance = await this.getBalanceFromContract(address);
      return {
        confirmed: balance.toString(),
        unconfirmed: balance.toString(), //same value, no sense. Pending?
      };
    } catch (error) {
      logger.exceptionContext(error,
        `walletApi.coin-wallets.Erc1155Wallet.getBalance.catch`, 
          {address},
      );
      throw error;
    }
  }

  private async ownsToken(
    address: string,
    tokenId: BigNumber,
    amountSending: BigNumber,
  ) {
    const tokensHeld = await this.contract.balanceOf(address, tokenId);

    return tokensHeld.gte(amountSending);
  }

  private async requireEnoughTokensAndEtherToSend(
    userApi: UserApi,
    address: string,
    amount: string,
  ) {
    try {
      const { parseEther, parseUnits } = utils;
      const [
        { confirmed: tokenBalance },
        feeEstimate,
        { pendingBalance: etherBalance },
      ] = await Promise.all([
        this.getBalance(address),
        this.estimateFee(userApi),
        transactionService.getEthBalanceAndTransactions(address),
      ]);
      const hasEnoughEther = parseEther(etherBalance).gt(
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
        `walletApi.coin-wallets.Erc1155Wallet.requireEnoughTokensAndEtherToSend.catch`,
        {
          'userId': userApi ? userApi.userId : 'undefined',
          address,
          amount,
        }
      );
      throw error;
    }
  }

  private async requireItemsAndEtherToSend(
    userApi: UserApi,
    address: string,
    tokenIds: BigNumber[],
    amounts: BigNumber[],
  ) {
    const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);
    
    try {
      const { parseEther } = utils;
      const [feeEstimate, etherBalance, ownsTokens] = await Promise.all([
        this.estimateFee(userApi),
        provider.getBalance(address),
        Promise.all(
          tokenIds.map((tokenId, i) =>
            this.ownsToken(address, tokenId, amounts[i]),
          ),
        ),
      ]);

      const totalFee = parseEther(feeEstimate.estimatedFee).mul(
        tokenIds.length,
      );
      const hasEnoughEther = etherBalance.gt(totalFee);

      const ownsAllTokens = ownsTokens.every(ownsToken => ownsToken);

      if (!ownsAllTokens) {
        throw new Error(`Does not own specified token`);
      }
      if (!hasEnoughEther) {
        throw new Error('Insufficient ETH balance');
      }
    } catch (error) {
      logger.exceptionContext(
        error,
        `walletApi.coin-wallets.Erc1155Wallet.requireEnoughTokensAndEtherToSend.catch`,
        {
          'userId': userApi ? userApi.userId : 'undefined',
          address,

        }
      );
      throw error;
    }
  }

  async transferFungibleTokens(
    userApi: UserApi,
    outputs: ISendOutput[],
    walletPassword: string,
  ) {
    
    const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);
    
    const [{ to }] = outputs;
    if (outputs.some(output => output.to !== to)) {
      throw new Error('Can only transfer to a single address');
    }
    const groupedOutputs = outputs.reduce((group, { tokenId, amount }) => {
      if (!group[tokenId]) {
        group[tokenId] = constants.Zero;
      }
      group[tokenId] = group[tokenId].add(amount);

      return group;
    }, {} as { [key: string]: BigNumber });

    const [tokenIds, amounts] = Object.entries(groupedOutputs).reduce(
      ([ids, amts], [tokenId, amount]) => {
        ids.push(BigNumber.from(tokenId));
        amts.push(amount);
        return [ids, amts];
      },
      [[], []] as [BigNumber[], BigNumber[]],
    );

    try {
      const [{ ethNonceFromDb, ethAddress }, privateKey] = await Promise.all([
        this.getEthAddress(userApi),
        this.getDecryptedPrivateKey(userApi.userId, walletPassword),
      ]);
      this.checkIfSendingToSelf(ethAddress, to);
      const nonce = await this.getNonce(userApi, ethAddress, ethNonceFromDb);

      const wallet = new ethers.Wallet(privateKey, provider);
      await this.requireItemsAndEtherToSend(
        userApi,
        ethAddress,
        tokenIds,
        amounts,
      );
      if (s_ChainId === undefined)
        s_ChainId = (await provider.getNetwork()).chainId;

      const data = this.contract.interface.encodeFunctionData(
        'safeBatchTransferFrom',
        [ethAddress, to, tokenIds, amounts, '0x'],
      );

      const rawTransaction = await wallet.signTransaction({
        to: this.contract.address,
        data,
        gasLimit: 150000,
        value: '0x0',
        nonce,
        chainId: s_ChainId,
      });

      //const { hash } = utils.parseTransaction(rawTransaction);

      //await nodeSelector.assignNodeToMineTransaction(hash);
      try {
        const transaction = await provider.sendTransaction(rawTransaction);

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
            amount: '0',
            confirmations: 0,
            fee: 'TBD',
            from: ethAddress,
            to: [to],
            id: transaction.hash,
            link: `${configAws.ethTxLink}/${transaction.hash}`,
            status: 'Pending',
            timestamp: Math.floor(Date.now() / 1000),
            type: 'Withdrawal',
            total: 'Pending fee',
          },
        };

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
        `walletApi.coin-wallets.Erc1155Wallet.transferFungibleTokens.catch`,
        {
          'userId': userApi ? userApi.userId : 'undefined',
        }
      );
      let message = '';
      switch (error.message) {
        case 'Does not own specified token':
        case 'Incorrect password':
        case 'Cannot send to yourself':
        case 'Insufficient ETH balance': {
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
  }

  async send(userApi: UserApi, outputs: ISendOutput[], walletPassword: string): Promise<TxSendResponse> {
    const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);
    
    const [{ to, amount: value }] = outputs;
    try {
      const [{ ethNonceFromDb, ethAddress }, privateKey] = await Promise.all([
        this.getEthAddress(userApi),
        this.getDecryptedPrivateKey(userApi.userId, walletPassword),
      ]);

      const amount = this.integerize(value);
      const wallet = new ethers.Wallet(privateKey, provider);
      await this.requireEnoughTokensAndEtherToSend(
        userApi,
        wallet.address,
        amount.toString(),
      );
      const { chainId } = provider.network;

      const contractMethod = this.contract.interface.encodeFunctionData(
        'safeTransferFrom',
        [ethAddress, to, this.tokenId, amount, '0x'],
      );
      const nonce = await this.getNonce(userApi, ethAddress, ethNonceFromDb);

      const rawTransaction = await wallet.signTransaction({
        to: this.contract.address,
        data: contractMethod,
        gasLimit: 150000,
        value: '0x0',
        nonce,
        chainId,
      });

      //const { hash } = utils.parseTransaction(rawTransaction);

      //await nodeSelector.assignNodeToMineTransaction(hash);
      try {
        const transaction = await provider.sendTransaction(rawTransaction);

        await userApi.incrementTxCount();
        this.ensureEthAddressMatchesPkey(wallet, ethAddress, userApi);

        const response: TxSendResponse = {
          message: null,
          success: true,
          transaction: {
            amount: `-${value}`,
            confirmations: 0,
            fee: 'TBD',
            from: transaction.from,
            to: [transaction.to],
            id: transaction.hash,
            link: `${configAws.ethTxLink}/${transaction.hash}`,
            status: 'Pending',
            timestamp: Math.floor(Date.now() / 1000),
            type: 'Withdrawal',
            total: value + ' + pending fee',
          },
        };

        return response;
      }
      catch(error) {
        const message: string = this.getErrorMessage(error);

        return {
          success: false,
          message: message,
        };
      }
    } catch (error) {
      logger.exceptionContext(
        error, 
        `walletApi.coin-wallets.Erc1155Wallet.send.catch`,
        {
          'userId': userApi ? userApi.userId : 'undefined',
        });
      let message;
      switch (error.message) {
        case 'Incorrect password':
        case 'Insufficient ETH balance':
        case 'Cannot send to yourself': {
          message = error.message;
          break;
        }
        case 'Insufficient token balance': {
          message = `Insufficient ${this.symbol} balance`;
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
      };
    }
  }
}

export default Erc1155API;
