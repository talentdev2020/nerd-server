import { Schema, Document, model } from 'mongoose';

export interface IRewardDistributer extends Document {
  nonce: number;
}

export const rewardDistributerConfigSchema = new Schema({
  walletAddress: {
    type: String,
    required: true,
  },
  nonce: {
    type: Number,
    required: true,
  },
});

export default model<IRewardDistributer>(
  'reward-distributor-config',
  rewardDistributerConfigSchema,
);
