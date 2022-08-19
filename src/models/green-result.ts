import { Document, model, Schema } from 'mongoose';

export interface IGreenResult extends Document {
  id: string;
  runTime: Date;
  address: string;
  btc: number;
  efficiency: number;
  efficiencyPercent: number;
  green: {
    _hex: string;
    _isBigNumber: boolean;
  };
  greenDecimal: number;
  hashRate: number;
  hashRateEfficiency: number;
  hashRateEfficiencyPercent: number;
  hashRatePercent: number;
  lastDistributionTimecreated: Date;
  licensedTotalDuration: number;
  power: number;
  satoshiValue: number;
  totalDuration: number;
  totalGreen: number;
  unlicensedTotalDuration: number;
  userId: string;
}

export const greenResultSchema = new Schema({
  id: { type: String, unique: true, index: true, trim: true },
  runTime: Date,
  address: String,
  btc: Number,
  efficiency: Number,
  efficiencyPercent: Number,
  green: {
    _hex: String,
    _isBigNumber: Boolean,
  },
  greenDecimal: Number,
  hashRate: Number,
  hashRateEfficiency: Number,
  hashRateEfficiencyPercent: Number,
  hashRatePercent: Number,
  lastDistributionTimecreated: Date,
  licensedTotalDuration: Number,
  power: Number,
  satoshiValue: Number,
  totalDuration: Number,
  totalGreen: Number,
  unlicensedTotalDuration: Number,
  userId: String,
});

const GreenResult = model<IGreenResult>('green-result', greenResultSchema);

export default GreenResult;
