import { Schema, model, Document } from 'mongoose';
import { IVaultItem } from '../types';
import {Types} from 'mongoose';

export interface IGreenCoinResultDocument extends Document {
  userId: string;
  greenDecimal: string;
  status: string;
  runTime: Date;
  dateMint?: Date;
}

export interface IVaultItemWithDbRecords {
  item: IVaultItem & {stuckBalance:number, stuckItemsIds:Types.ObjectId[]};
  dbRecords: IGreenCoinResultDocument[] | any;
}

export const greenCoinResultSchema = new Schema({
  userId: String,
  greenDecimal: String,
  status: String,
  runTime: Date,
  dateMint: Date,
});

const GreenCoinResult = model<IGreenCoinResultDocument>(
  'green-coins-result',
  greenCoinResultSchema,
);

export default GreenCoinResult;
