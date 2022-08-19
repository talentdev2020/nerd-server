import * as mongoose from 'mongoose';

export interface IBlockbotRedemption {
  userId: string;
  receiveAddress: string;
  date: Date;
  status: string;
}

export interface IBlockbotRedemptionDocument
  extends IBlockbotRedemption,
    mongoose.Document {}

export const redemptionSchema = new mongoose.Schema({
  userId: String,
  receiveAddress: String,
  date: Date,
  status: String,
});

const BlockbotReportRedemptionResult = mongoose.model<
  IBlockbotRedemptionDocument
>('win-report-user-redemptions', redemptionSchema);
export default BlockbotReportRedemptionResult;
