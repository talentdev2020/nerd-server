import { utils, BigNumber, providers } from 'ethers';
import * as erc1155Abi from '../common/ABI/erc1155.json';
import { IWalletTransaction, TransactionType } from '../types';
import { WalletTransaction, User } from '../models';
import {
  ethBalanceTransactionsPipeline,
  IEthBalanceTransactions,
  ITokenBalanceTransactions,
  tokenBalanceTransactionsPipeline,
  buildGalaBalanceTransactionsPipeline,
} from '../pipelines';

class TransactionService {
  erc1155Interface = new utils.Interface(erc1155Abi);
  storeDecimalsFungible = 8;
  TYPE_NF_BIT = BigInt(1) << BigInt(255);
  NF_INDEX_MASK = BigInt(~0) << BigInt(128);

  private isNonFungible = (tokenId: string) => {
    return (BigInt(tokenId) & this.TYPE_NF_BIT) === this.TYPE_NF_BIT;
  };

  private getBaseType = (tokenId: string) => {
    if (this.isNonFungible(tokenId)) {
      const token = BigInt(tokenId);
      return '0x' + (token & this.NF_INDEX_MASK).toString(16);
    }
    return tokenId;
  };

  private parseAmount = (
    tokenId: string,
    value: BigNumber,
    decimals: number,
  ) => {
    const sliceEnd = this.storeDecimalsFungible - decimals;
    const amountString = value.toString();
    const fullHexAmount = value.toHexString();
    const isNonFungible = this.isNonFungible(tokenId);
    const amount =
      !isNonFungible && sliceEnd < 0
        ? amountString.slice(0, sliceEnd)
        : amountString;
    return {
      amount,
      fullHexAmount,
      decimalsStored: isNonFungible ? 0 : this.storeDecimalsFungible,
    };
  };

  private getIndexerId(
    txHash: string,
    type: TransactionType,
    logIndex?: number,
  ) {
    const logIndexString = logIndex >= 0 ? logIndex.toString() : '';

    return utils.sha256(utils.toUtf8Bytes(`${txHash}${type}${logIndexString}`));
  }

  parseTokenId = (tokenId: string) => {
    return {
      tokenId,
      baseId: this.getBaseType(tokenId),
      nft: this.isNonFungible(tokenId),
    };
  };

  getUserIdByEthAddress = async (ethAddress: string) => {
    const user = await User.findOne({ 'wallet.ethAddress': ethAddress });

    return user?.id || null;
  };

  parseData = async (data: string, toUserId?: string) => {
    const { name, args } = this.erc1155Interface.parseTransaction({
      data,
      value: '0x0',
    });
    if (name === 'safeTransferFrom') {
      const [from, to, id, value] = args as [
        string,
        string,
        BigNumber,
        BigNumber,
      ];
      return {
        from,
        to,
        operator: from,
        fullHexAmount: value.toHexString(),
        logIndex: 0,
        contractMethod: name,
        mintTransaction: false,
        ...this.parseAmount(id.toHexString(), value, 8),
        ...this.parseTokenId(id.toHexString()),
      };
    }
  };

  saveToDatabase(tx: IWalletTransaction) {
    return WalletTransaction.create(tx);
  }

  getEthBalanceAndTransactions = async (ethAddress: string) => {
    const [result] = await WalletTransaction.aggregate(
      ethBalanceTransactionsPipeline(ethAddress),
    );

    return result
      ? result
      : ({
          transactions: [],
          pendingBalance: '0.0',
          confirmedBalance: '0.0',
        } as IEthBalanceTransactions);
  };

  getTokenBalanceAndTransactions = async (
    tokenAddress: string,
    ethAddress: string,
  ) => {
    const [result] = await WalletTransaction.aggregate(
      tokenBalanceTransactionsPipeline(tokenAddress, ethAddress),
    );

    return result
      ? result
      : ({
          transactions: [],
          pendingBalance: '0.0',
          confirmedBalance: '0.0',
        } as ITokenBalanceTransactions);
  };

  getGalaBalanceAndTransactions = async (ethAddress: string) => {
    const [result] = await WalletTransaction.aggregate(
      buildGalaBalanceTransactionsPipeline(ethAddress),
    );
    return result
      ? result
      : ({
          transactions: [],
          pendingBalance: '0.0',
          confirmedBalance: '0.0',
        } as ITokenBalanceTransactions);
  };

  savePendingErc1155Transaction = async (
    txResponse: providers.TransactionResponse,
    fromUserId: string,
    toUserId?: string,
  ) => {
    const { data, gasPrice, nonce, blockNumber, hash, timestamp } = txResponse;
    const dataValues = await this.parseData(data, toUserId);
    if (!dataValues) return;

    return this.saveToDatabase({
      indexerId: this.getIndexerId(hash, TransactionType.Erc1155, 0),
      type: TransactionType.Erc1155,
      contractName: 'Gala',
      status: blockNumber ? 'confirmed' : 'pending',
      timestamp: timestamp || Math.floor(Date.now() / 1000),
      blockNumber: blockNumber || null,
      gasPriceHex: gasPrice.toHexString(),
      gasUsedHex: '',
      gasUsed: null,
      gasPrice: gasPrice.toString(),
      gasPriceDecimals: 18,
      hash,
      nonce,
      ...dataValues,
    });
  };
}

export const transactionService = new TransactionService();
