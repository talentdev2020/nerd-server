import { Schema, Document, model } from 'mongoose';

export interface IRewardAudit {
  userId?: string;
  rewardName?: string;
  txHash?: string;
  amountSent?: string;
  amountToUser?: string;
  amountToReferrer?: string;
  userEthAddress?: string;
  rewardWalletAddress?: string;
  rewardType?: string;
  contractAddress?: string;
  decimalPlaces?: number;
  valueRequiredUser?: number;
  valueRequiredReferrer?: number;
  valueSent?: number;
  error?: string;
}

export interface IRewardAuditDoc extends IRewardAudit, Document {}

export const rewardAuditSchema = new Schema(
  {
    userId: String,
    rewardName: String,
    txHash: String,
    amountSent: String,
    amountToUser: String,
    amountToReferrer: String,
    userEthAddress: String,
    rewardWalletAddress: String,
    rewardType: String,
    contractAddress: String,
    decimalPlaces: Number,
    valueRequiredUser: Number,
    valueRequiredReferrer: Number,
    valueSent: Number,
    error: String,
  },
  { timestamps: true },
);

export const RewardAudit = model<IRewardAuditDoc>(
  'reward-audit',
  rewardAuditSchema,
);
