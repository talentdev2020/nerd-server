import * as mongoose from 'mongoose';

export interface IMiningRecord {
  userId: string;
  hardwareId: string;
  start: Date;
  stop: Date | null;
  startEpochTime: number;
  stopEpochTime: number;
  lastCheckIn: {
    time: Date;
    epochTime: number;
    hashrate: number;
  };
}

export interface IMiningRecordDocument
  extends IMiningRecord,
    mongoose.Document {}

export const miningRecordSchema = new mongoose.Schema({
  userId: String,
  hardwareId: String,
  start: Date,
  stop: Date,
  startEpochTime: String,
  stopEpochTime: String,
  lastCheckIn: {
    time: Date,
    epochTime: String,
    hashrate: Number,
  },
});

export const MiningRecord = mongoose.model<IMiningRecordDocument>(
  'miningRecord',
  miningRecordSchema,
);
