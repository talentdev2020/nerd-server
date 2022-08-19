import { Schema, model, Document } from 'mongoose';

export interface ILicenseOtherBrand {
  licenseTypeId: string;
  cartTransactionId:string;
  destinationBrand: string;
  destinationLicenseTypeId: string;
  userId: string;
}

export interface ILicense extends Document {
  licenseTypeId: string;
  cartTransactionId:string;
  userId: string;
  created: Date;
  inUse: boolean;
  ownershipHistory: {
    receivedReason: string;
    received: Date;
  }[];
  linkedLicense: {
    otherBrand: string;
    otherLicenseId: string;
  }
}

export const licenseSchema = new Schema({
  licenseTypeId: { type: String, index: true },
  cartTransactionId:String,
  userId: { type: String, index: true },
  created: Date,
  inUse: Boolean,
  ownershipHistory: [
    {
      receivedReason: String,
      received: Date,
    },
  ],
  linkedLicense: {
    otherBrand: String,
    otherLicenseId: String,
  },
});

const License = model<ILicense>('license', licenseSchema);

export default License;
