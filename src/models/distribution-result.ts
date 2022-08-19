import * as mongoose from 'mongoose';

export interface IDistributionResult {
  baseId: string;
  userId: string;
  address: string;
  quantity: number;
  nodeSelectionId: string;
  transactionHash: string;
  created: Date;
  updated: Date;
}

export interface DistributionResultDocument
  extends IDistributionResult,
    mongoose.Document {}

export const distributionResultSchema = new mongoose.Schema(
  {
    baseId: { type: String, index: true },
    userId: { type: String, index: true },
    address: { type: String, index: true },
    quantity: Number,
    nodeSelectionId: String,
    transactionHash: { type: String, index: true },
  },
  {
    timestamps: { updatedAt: 'updated', createdAt: 'created' },
  },
);

export const DistributionResult = mongoose.model<DistributionResultDocument>(
  'distribution-results',
  distributionResultSchema,
);
