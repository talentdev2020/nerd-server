import { model, Schema, Document } from 'mongoose';
import { ISimplexOrder, SimplexOrderStatus } from '../types';

export interface SimplexOrderDocument extends ISimplexOrder, Document {
  created?: Date;
  updated?: Date;
}

const simplexOrderSchema = new Schema(
  {
    userId: { type: String, index: true },
    simplexPaymentId: { type: String, index: true },
    status: {
      type: String,
      index: true,
      enum: Object.values(SimplexOrderStatus),
    },
    fiatAmount: {
      amount: Number,
      currency: String,
    },
    cryptoAmount: {
      amount: Number,
      currency: String,
    },
    transactionHash: { type: String, index: true },
  },
  {
    timestamps: { createdAt: 'created', updatedAt: 'updated' },
  },
);

export const SimplexOrder = model<SimplexOrderDocument>(
  'simplex-order',
  simplexOrderSchema,
);
