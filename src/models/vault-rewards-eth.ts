import { Document, model, Schema } from 'mongoose';

export interface IVaultRewardsEth extends Document {
  userId: string;
  distributionDate: Date;
  dateAvailable: Date;
  symbol: string;
  amount: string;
  rewardCategory: string;
  description: string;
  sqlDistributionId: string;
  dateCreated: Date;
  signature: string;
}

export const vaultRewardsEthSchema = new Schema(
  {
    userId: String,
    distributionDate: Date,
    dateAvailable: Date,
    symbol: String,
    amount: String,
    rewardCategory: String,
    description: String,
    sqlDistributionId: String,
    dateCreated: Date,
    signature: String,
  },
  { id: false },
);

const VaultRewardsEth = model<IVaultRewardsEth>(
  'vault-rewards-eth',
  vaultRewardsEthSchema,
);

export default VaultRewardsEth;
