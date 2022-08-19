import * as mongoose from 'mongoose';

export interface IEnvironmentModel extends mongoose.Document {
  created: Date;
  descriptionMeta: string;
  domain: string;
  etherscanApiKey: string;
  favicon: string;
  permissions: string[];
  keywordsMeta: string;
  myDomain: string;
  newsFeedUrl: string;
  primaryColor: string;
  publicPort: number;
  signedTemplates: string[];
  referralLinkPath: string;
  referralUrl: string;
  sendEmailFrom: string;
  sendGridApiKey: string;
  webpageTitle: string;
  defaultUserId: string;
  terms: string[];
  userAgreements: string[];
  widgetsShown: string[];
  walletCompanyFee: number;
  walletReferrerReward: number;
  walletRewardAmount: number;
  walletRewardCurrency: string;
  walletShareLimit: number;
  walletUserBalanceThreshold: number;
  availablePoolTypes: string[];
  demoUserEmail: string;
  walletsShown: string[];
  bitlyApiKey: string;
  defaultReferredBy: string;
}

export const environmentSchema = new mongoose.Schema({
  domain: { type: String, index: true },
  myDomain: { type: String, index: true },
  referralUrl: String,
  sendEmailFrom: String,
  sendGridApiKey: String,
  webpageTitle: String,
  publicPort: Number,
  descriptionMeta: String,
  keywordsMeta: String,
  created: { type: Date, index: true },
  id: { type: String, index: true },
  availablePoolTypes: [String],
  signedTemplates: [String],
  newsFeedUrl: String,
  favicon: String,
  primaryColor: String,
  referralLinkPath: String,
  etherscanApiKey: String,
  defaultUserId: String,
  terms: [String],
  userAgreements: Array,
  walletCompanyFee: Number,
  walletReferrerReward: Number,
  walletRewardAmount: Number,
  walletRewardCurrency: String,
  walletShareLimit: Number,
  walletUserBalanceThreshold: Number,
  demoUserEmail: String,
  walletsShown: Array,
  firebaseConfigs: Array,
  bitlyApiKey: String,
  defaultReferredBy: String,
});

const Environment = mongoose.model<IEnvironmentModel>(
  'environments',
  environmentSchema,
);

export default Environment;
