import { model, Schema, Document } from 'mongoose';

export interface IRedemptionCode {
  code: string;
  isActive: boolean;
  // if value exists then it is only valid for that customer otherwise it can be used by anyone and multiple times
  redeemableBy?: string;
  value?: number;
  description?: string;
  created: Date;
  updated: Date;
}

export interface IUserCodeRedemption {
  code: string;
  userId: string;
  created: Date;
  updated: Date;
}

export interface IUserRedemptionCode extends IRedemptionCode {
  redemptions: IUserCodeRedemption[];
}

interface IRedemptionCodesDocument extends IRedemptionCode, Document {}

const redemptionCodesSchema = new Schema(
  {
    code: { 
      type: String, 
      required: true,
      unique: true,
      index: true,
    },
    isActive: { 
      type: Boolean, 
      required: true,
    },
    redeemableBy: {
      type: String,
      required: false,
    },
    value: {
      type: Number, 
      required: false, 
    },
    description: { 
      type: String, 
      required: false,
    },
  },
  { timestamps: { createdAt: 'created', updatedAt: 'updated' } },
);

export const RedemptionCodes = model<IRedemptionCodesDocument>(
  'redemption-codes',
  redemptionCodesSchema,
);

interface IUserCodeRedemptionsDocument extends IUserCodeRedemption, Document {}

const userCodeRedemptionsSchema = new Schema(
  {
    code: { 
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
  },
  { timestamps: { createdAt: 'created', updatedAt: 'updated' } },
);

export const UserCodeRedemptions = model<IUserCodeRedemptionsDocument>(
  'user-code-redemptions',
  userCodeRedemptionsSchema
)