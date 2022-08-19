import * as mongoose from 'mongoose';
import { IWalletTransaction } from '../types';
require('mongoose-long')(mongoose);

const schemaTypes = mongoose.Schema.Types as any;

const walletTransactionSchema = new mongoose.Schema<IWalletTransaction>(
  {
    indexerId: { type: String, unique: true },
    type: String,
    status: String,
    timestamp: Number,
    to: {
      type: String,
      index: true,
    },
    from: {
      type: String,
      index: true,
    },
    amount: schemaTypes.Long,
    fullHexAmount: String,
    decimalsStored: Number,
    blockNumber: Number,
    gasPriceHex: String,
    gasUsedHex: String,
    gasPrice: schemaTypes.Long,
    gasPriceDecimals: Number,
    gasUsed: schemaTypes.Long,
    hash: {
      type: String,
      index: true,
    },
    nonce: Number,
    baseId: String,
    tokenId: String,
    logIndex: Number,
    nft: Boolean,
    contractMethod: String,
    contractName: String,
    mintTransaction: Boolean,
    assignedNode: {
      hardwareId: String,
      licenseId: String,
      ethAddress: String,
      userId: String,
    },
  },
  { timestamps: { createdAt: 'created', updatedAt: 'updated' } },
);

export const WalletTransaction = mongoose.model<
  mongoose.Document & IWalletTransaction
>('wallet-transaction', walletTransactionSchema);
