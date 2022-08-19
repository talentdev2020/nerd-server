import { Document, model, Schema } from 'mongoose';
import { TGetCartAddressSource } from 'src/types';

export interface ICartTransaction {
  source?:TGetCartAddressSource;
  wp_id: string;
  userId: string;
  status: string;
  currency: string;
  discountAmtUsd: string;
  totalUsd: string;
  totalCrypto: string;
  totalCryptoReceived: string;
  conversionRate: string;
  remainingCrypto: string;
  address: string;
  name: string;
  email?: string;
  memberId: string;
  data: string;
  created: Date;
  redisKey: string;
  redisValue: string;
  productId: string;
  productName: string;
  quantity: number;
  nodeLicenseType?: string;
  linkedTransactions?: ICartTransactionLinkedTransaction[];
  revenueUsd: number;
  revenueCrypto: number;
  isCommissionable: boolean;
}

export interface ICartTransactionLinkedTransaction {
  brand: string;
  cartTransactionId: string;
}

export interface ICartTransactionDoc extends ICartTransaction, Document {}

export const cartTransactionSchema = new Schema({
  source:String,
  wp_id: String,
  userId: String,
  status: String,
  currency: String,
  discountAmtUsd: String,
  totalUsd: String,
  totalCrypto: String,
  totalCryptoReceived: String,
  conversionRate: String,
  remainingCrypto: String,
  address: String,
  name: String,
  memberId: String,
  data: String,
  created: Date,
  productId: String,
  productName: String,
  quantity: Number,
  nodeLicenseType: String,
  linkedTransactions: [
    {
      brand: String,
      cartTransactionId: String,
    },
  ],
  revenueUsd: Number,
  revenueCrypto: Number,
  isCommissionable: Boolean,
});

const CartTransaction = model<ICartTransactionDoc>(
  'cart-transaction',
  cartTransactionSchema,
);

export default CartTransaction;

export interface ICartFiatTransaction extends ICartTransaction {
  orderId: string;
  checkReferenceId: string; // Maps to paywiser purchase (ordernumber+reference counter)
}

export const CartFiatTransaction = CartTransaction.discriminator(
  'fiat-transaction',
  new Schema(
    {
      orderId: String,
      checkReferenceId: String,
    },
    { discriminatorKey: 'kind' },
  ),
);
