import { model, Schema, Document } from 'mongoose';
import { ICartAddress, TGetCartAddressSource } from 'src/types/ICartAddress';

export interface ICartAddressRequest {
  source:TGetCartAddressSource;
  userId: string;
  coinSymbol: string;
  amountUsd?: string;
  amountCrypto?: string;
  quantity: number;
  orderId: string;
  affiliateId: string;
  affiliateSessionId: string;
  utmVariables: string;
  created: Date;
  expires: Date;
  addresses: ICartAddress[];
  nodeLicenseType?: string;
}

export interface ICartAddressRequestDocument
  extends Required<ICartAddressRequest>,
    Document {}

export const cartAddressSchema = new Schema({
  coinSymbol: String,
  address: String,
  qrCode: String,
});

export const cartAddresRequestSchema = new Schema({
  source:String,
  userId: String,
  coinSymbol: String,
  amountCrypto: String,
  amountUsd: String,
  quantity: Number,
  orderId: String,
  affiliateId: String,
  affiliateSessionId: String,
  utmVariables: String,
  created: Date,
  expires: Date,
  addresses: [cartAddressSchema],
  nodeLicenseType: { type: String, required: false },
});

const cartAddresRequestModel = model<ICartAddressRequestDocument>(
  'Cart-address-request',
  cartAddresRequestSchema,
);

export default cartAddresRequestModel;
