import * as mongoose from 'mongoose';

export interface IWinReportUserDistribution {
  UserId: string;
  Date: Date;
  DateToDistribute: Date;
  TotalWinScore: number;
  TotalDirectRewardsCrypto: number;
  RewardDetailsJson: string;
  TotalNodeSupportRewardsCrypto: number;
  Status: string;
  DateMint: Date;
}

export interface IBlockbotReportUserDistributions
  extends IWinReportUserDistribution,
    mongoose.Document {}

export const userDistributionSchema = new mongoose.Schema({
  UserId: String,
  Date: Date,
  DateToDistribute: Date,
  TotalWinScore: Number,
  TotalDirectRewardsCrypto: Number,
  TotalNodeSupportRewardsCrypto: Number,
  RewardDetailsJson: String,
  Status: String,
  DateMint: Date,
});

const BlockbotReportUserDistributions = mongoose.model<
  IBlockbotReportUserDistributions
>('win-report-user-distributions', userDistributionSchema);
export default BlockbotReportUserDistributions;
