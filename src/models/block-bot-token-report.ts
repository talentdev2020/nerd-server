import * as mongoose from 'mongoose';

export interface IBlockbotReward {
  name: string;
  isActive: boolean;
  isDroid: boolean;
  purchased: Date;
  rewards: number;
  brand: string;
}

export interface IBrandTokenRewards {
  brand: string;
  rewards: IBlockbotReward[];
}

export interface IBlockbotMemoryToken {
  totalBlockbotsNow: number;
  totalBlockbotsPrevious: number;
  totalRewardsCoin: number;
  totalRewardsUsd: number;
  memory: string;
  brandRewards?: IBrandTokenRewards[];
}

export interface IBlockbotTokenReport {
  userId: string;
  datePrepared: number;
  totalBlockbots: number;
  day: IBlockbotMemoryToken;
  week: IBlockbotMemoryToken;
  month: IBlockbotMemoryToken;
  year: IBlockbotMemoryToken;
  quarter: IBlockbotMemoryToken;
  all: IBlockbotMemoryToken;
}

export interface IBlockbotTokenReportDocument
  extends IBlockbotTokenReport,
    mongoose.Document {}

export const tokenReward = new mongoose.Schema({
  name: String,
  isActive: Boolean,
  isDroid: Boolean,
  purchased: Date,
  rewards: Number,
  brand: String,
  licenseId: String,
});

export const brandTokenSchema = new mongoose.Schema({
  brand: String,
  rewards: [tokenReward],
});

export const memoryTokenSchema = new mongoose.Schema({
  totalBlockbotsNow: Number,
  totalBlockbotsPrevious: Number,
  totalRewardsCoin: Number,
  totalRewardsUsd: Number,
  memory: String,
  brandsRewards: [brandTokenSchema],
});

export const winReportTokenBlockbot = new mongoose.Schema({
  userId: String,
  datePrepared: Number,
  totalBlockbots: Number,
  day: memoryTokenSchema,
  week: memoryTokenSchema,
  month: memoryTokenSchema,
  year: memoryTokenSchema,
  quarter: memoryTokenSchema,
  all: memoryTokenSchema,
});

const BlockbotTokenReportResult = mongoose.model<IBlockbotTokenReportDocument>(
  'win-report-token-blockbots',
  winReportTokenBlockbot,
);
export default BlockbotTokenReportResult;
