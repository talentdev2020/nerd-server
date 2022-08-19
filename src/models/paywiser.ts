import { Schema, model, Document } from 'mongoose';

import { IPaywiserTransaction, IPaywiserKyc } from 'src/types/IPaywiser';

import { IPaywiserMerchantPaymentRequest } from 'src/types/IPaywiserMerchant';

export const PaywiserKycDocumentSchema = new Schema({
  documentId: String,
  type: String,
  issuer: String,
  expiryDate: String,
  willExpire: Boolean,
  expired: Boolean,
  documentNumber: String,
  subject: {
    firstName: String,
    lastName: String,
    birthDate: String,
    gender: String,
    nationality: String,
    personalNumber: String,
  },
});

export const PaywiserKycIbanSchema = new Schema({
  documentId: String,
  ibanId: String,
  ibanCurrency: String,
  ibanTypeId: String,
});

export const PaywiserKycSchema = new Schema({
  kycId: String,
  personId: { type: String, index: true, unique: true, sparse: true },
  referenceNumber: String,
  referenceId: String,
  kycStart: Date,
  KycEnd: Date,
  kycStatus: String,
  verificationStatus: String,
  ibanStatus: String,
  ibanObject: PaywiserKycIbanSchema,
  additionalDescription: String,
  documents: [PaywiserKycDocumentSchema],
});

export const PaywiserTransactionSchema = new Schema({
  referenceId: String,
  transactionId: String,
  amount: String,
  cryptoSymbol: String,
  transactionStatus: Number,
  depositAddress: String,
  depositMemo: String,
  type: { type: String, enum: ['BUY', 'SELL'], index: true },
  convertedAmount: String,
  endAmount: String,
  rate: String,
  fiatSymbol: String,
  validTo: String,
  rateDecimals: Number,
});

export const PaywiserMerchantPaymentRequestSchema = new Schema({
  orderId: String,
  customerPersonId: String,
  customerMobileNumber: String,
  amount: String,
  currency: String,
  description: String,
  validMinutes: Number,
  validToDateTime: String,
  numberOfPayments: Number,
  referenceId: String,
  pendingPaymentId: String,
  qrCodeData: String,
  callerReferenceId: String,
  customerAction: String,
  transactionStatus: String,
});

export const UserPaywiserSchema = new Schema(
  {
    userId: { type: String, index: true, unique: true },
    kyc: PaywiserKycSchema,
    cryptoTransactions: [PaywiserTransactionSchema],
    paymentRequests: [PaywiserMerchantPaymentRequestSchema],
  },
  { id: false },
);

UserPaywiserSchema.index(
  { 'cryptoTransactions.transactionId': 1 },
  {
    unique: true,
    partialFilterExpression: {
      'cryptoTransactions.transactionId': { $exists: true },
    },
  },
);

export interface IUserPaywiser {
  userId: string;
  kyc: IPaywiserKyc;
  cryptoTransactions: [IPaywiserTransaction];
  paymentRequests: [IPaywiserMerchantPaymentRequest];
}

export interface IUserPaywiserDocument extends IUserPaywiser, Document {}

const UserPaywiserModel = model<IUserPaywiserDocument>(
  'user-paywiser',
  UserPaywiserSchema,
  'user-paywiser',
);
export default UserPaywiserModel;
