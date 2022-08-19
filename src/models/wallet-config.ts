import { Schema, model, Document } from 'mongoose';

export interface IWalletConfig extends Document {
  backgroundColor: string;
  icon: string;
  accentColor: string;
  textColor: string;
  referrerReward: number;
  companyFee: number;
  rewardCurrency: string;
  rewardAmount: number;
  userBalanceThreshold: number;
  shareLimits: {
    upgradedAccount: number;
    softnodeLicense: {
      softnodeType: string;
      sharesPerLicense: number;
    };
  };
  shareLinkBase: string;
  upgradeBenefits: string[];
  basicWalletBenefits: string[];
  upgradeAccountName: string;
  coupon: {
    photo: string;
    softnodeType: string;
  };
  galaToUsdRatio: number;
  decimalPlaces: number;
}

export const walletConfigSchema = new Schema({
  brand: {
    type: String,
    enum: ['localhost', 'green', 'gala', 'codex', 'connect'],
  },
  referrerReward: {
    type: Number,
    required: true,
  },
  companyFee: {
    type: Number,
    required: true,
  },
  rewardCurrency: {
    type: String,
    required: true,
  },
  rewardAmount: {
    type: Number,
    required: true,
  },
  userBalanceThreshold: {
    type: Number,
    required: true,
  },
  shareLimits: {
    upgradedAccount: Number,
    softnodeLicense: {
      softnodeType: String,
      sharesPerLicense: Number,
    },
  },
  shareLinkBase: {
    type: String,
    required: true,
  },
  backgroundColor: {
    type: String,
    required: true,
  },
  backgroundColorNew: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  accentColor: {
    type: String,
    required: true,
  },
  textColor: {
    type: String,
    required: true,
  },
  upgradeBenefits: [String],
  basicWalletBenefits: [String],
  upgradeAccountName: String,
  coupon: {
    photo: {
      type: String,
    },
    softnodeType: {
      type: String,
    },
  },
  galaToUsdRatio: Number,
});

export default model<IWalletConfig>('wallet-config', walletConfigSchema);
