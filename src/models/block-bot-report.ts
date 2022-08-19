import * as mongoose from 'mongoose';

export interface IBlockbotActivation {
  Name: string;
  ActiveCount: number;
  ActivationsCount: number;
  Rewards: number;
  RewardsAllTime: number;
}

export interface IBlockbotMemory {
  TotalBlockbotsNow: number;
  TotalBlockbotsPrevious: number;
  TotalRewardsCoin: number;
  TotalRewardsUsd: number;
  AverageUsdPerBlockbot: number;
  AveragePercentDifference: number;
  Memory: string;
  WinPoints: number;
  MainRewards : DirectReward[];
  NodeRewards : NodeReward[];
}

export interface DirectReward {
  Time: Date;
  Description: string;
  Points: number;
  RewardAmount: number;
}

export interface NodeReward {
  Time: Date;
  Description: string;
  Points: number;
  RewardAmount: number;
  AmountDistributeEven: number;
  AmountDistributionProportion: number;
}

export interface IBlockbotReport {
  UserId: string;
  DatePrepared: number;
  TotalBlockbots: number;
  WinScore: number;
  WinRewards: number;
  AvailableBalance: number;
  Day: IBlockbotMemory;
  Week: IBlockbotMemory;
  Month: IBlockbotMemory;
  Year: IBlockbotMemory;
  Quarter: IBlockbotMemory;
  All: IBlockbotMemory;
  PendingDirectPaymentsETH?: number;
}

export interface IBlockbotReportDocument
  extends IBlockbotReport,
    mongoose.Document {}

export const directSchame = new mongoose.Schema({
  Time: Date,
  Description: String,
  Points: Number,
  RewardAmount: Number,
});

export const nodeSchema = new mongoose.Schema({
  Time: Date,
  Description: String,
  Points: Number,
  RewardAmount: Number,
  AmountDistributeEven: Number,
  AmountDistributionProportion: Number,
});

export const memorySchema = new mongoose.Schema({

  TotalBlockbotsNow: Number,
  TotalBlockbotsPrevious: Number,
  TotalRewardsCoin: Number,
  TotalRewardsUsd: Number,
  AverageUsdPerBlockbot: Number,
  AveragePercentDifference: Number,
  Memory: String,
  WinPoints: Number,
  MainRewards : [directSchame],
  NodeRewards : [nodeSchema],
});

export const winReportBlockbot = new mongoose.Schema({
  UserId: String,
  DatePrepared: Number,
  TotalBlockbots: Number,
  WinScore: Number,
  WinRewards: Number,
  AvailableBalance: Number,
  Day: memorySchema,
  Week: memorySchema,
  Month: memorySchema,
  Year: memorySchema,
  Quarter: memorySchema,
  All: memorySchema,
});

const BlockbotReportResult = mongoose.model<IBlockbotReportDocument>(
  'win-report-blockbots',
  winReportBlockbot,
);
export default BlockbotReportResult;
