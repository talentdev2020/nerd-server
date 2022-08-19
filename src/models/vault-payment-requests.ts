import { Document, model, Schema } from 'mongoose';

export interface IVaultDirectPaymentRequest {
  userId: string;
  status: string;
  symbol: string;
  amountRequested: string;
  toWalletAddress: string;
  created: Date;
}

export interface IVaultDirectPaymentRequestDoc extends IVaultDirectPaymentRequest, Document {}

export const vaultDirectPaymentRequestSchema = new Schema({
  userId: String,
  status: String,
  symbol: String,
  amountRequested: String,
  toWalletAddress: String,
  created: Date,
});

const VaultDirectPaymentRequests = model<IVaultDirectPaymentRequestDoc>(
  'vault-direct-payment-requests',
  vaultDirectPaymentRequestSchema,
);

export default VaultDirectPaymentRequests;
