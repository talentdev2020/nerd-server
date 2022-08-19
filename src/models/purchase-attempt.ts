import { Schema, Document, model } from 'mongoose';
import { IOrderContext } from '../types';

export interface IPurchaseRequest {
  userId: string;
  quantity: number;
  coinSymbol: string;
  productId: string;
  orderId: string;
  invoiceAddress: string;
  btcValue: string;
  txHash: string;
  success: boolean;
  successMessage: string;
  lastCompletedOperation: string;
  walletPasswordExists: string;
  orderContext: IOrderContext;
  error?: string;
}

export interface IPurchaseAttemptDoc extends IPurchaseRequest, Document {}

export const purchaseAttemptSchema = new Schema(
  {
    userId: String,
    quantity: Number,
    coinSymbol: String,
    productId: String,
    orderId: String,
    txHash: String,
    success: Boolean,
    successMessage: String,
    walletPasswordExists: String,
    lastCompletedOperation: String,
    invoiceAddress: String,
    btcValue: String,
    orderContext: Object,
    error: String,
  },
  { timestamps: true },
);

export const PurchaseAttempt = model<IPurchaseAttemptDoc>(
  'purchase-attempt',
  purchaseAttemptSchema,
);
