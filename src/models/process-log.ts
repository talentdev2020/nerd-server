import { model, Schema, Document } from 'mongoose';

interface IProcessLog {
  processId: string;
  environment: string;
  startTime: Date;
  created: Date;
  endTime: Date;
  error?: string;
}

export interface IProcessLogDocument extends IProcessLog, Document {}

export const processLogSchema = new Schema({
  processId: { type: String, index: true },
  environment: String,
  startTime: Date,
  created: { type: Date, index: true },
  endTime: Date,
  error: String,
});

export const ProcessLog = model<IProcessLogDocument>(
  'process-logs',
  processLogSchema,
);
