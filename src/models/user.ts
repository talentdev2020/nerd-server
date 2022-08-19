import * as mongoose from 'mongoose';
import { IOrderContext } from '../types';
import { orderContextSchema } from './schemas';

interface IWalletShares {
  green: number;
  gala: number;
  codex: number;
  connect: number;
  [key: string]: number;
}

interface IReferrerReward {
  amount: number;
  txId: string;
}

interface IWalletUpgrade {
  activated: boolean;
  activationTxHash: string;
  btcToCompany: number;
  btcToReferrer: number;
  btcUsdPrice: number;
  amountRewarded: number;
  itemsRewarded: string[];
  rewardId: string;
  timestamp: Date;
  orderContext: IOrderContext;
  referrerReward: {
    btc: IReferrerReward;
    gala: IReferrerReward;
    winX: IReferrerReward;
    green: IReferrerReward;
  };
  galaAmount: string;
}
interface IActivatedWallets {
  green: IWalletUpgrade;
  gala: IWalletUpgrade;
  winx: IWalletUpgrade;
  [key: string]: IWalletUpgrade;
}

export interface IUserWalletDoc extends mongoose.Document {
  ethAddress?: string;
  ethBlockNumAtCreation?: number;
  cryptoFavorites?: string[];
  cryptoFavoritesSet?: boolean;
  ethNonce: number;
  btcAddress?: string;
  btcSeed?: number;
  activations: IActivatedWallets;
  shareLink?: string;
  userCreatedInWallet: boolean;
  shares: IWalletShares;
}

interface ISoftNodeLicenses {
  [key: string]: number;
}

export interface IUserIds {
  connectUserId?: string;
  arcadeUserId?: string;
  greenUserId?: string;
  codexUserId?: string;
  blueUserId?: string; // deprecated (change to galvan)
  galvanUserId?: string;
  switchUserId?: string;
  giveUserId?: string;
  libertyUserId?: string;
  elementUserId?: string;
  digUserId?: string;
  airUserId?: string;
  waterUserId?: string;
}

export interface IUpdateUserIds {
  unsetMissingUserIds: boolean;
  userIds: IUserIds;
}

export interface IUser extends mongoose.Document {
  email: string;
  firebaseUid: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: string;
  created: Date;
  utmInfo?: {
    utmCampaign?: string;
    utmMedium?: string;
    utmSource?: string;
    utmKeyword?: string;
    utmContent?: string;
    utmTerm?: string;
    utmName?: string;
    offer?: string;
    referredBy?: string;
  };
  phone: string;
  affiliateId: string;
  affiliate?: {
    affiliateId: string;
    sessionId: string;
  };
  referredBy: string;
  referredByLocked: boolean;
  permissions: string[];
  id: string;
  wallet?: IUserWalletDoc;
  language: string;
  twoFaTempSecret?: string;
  twoFaSecret?: string;
  currency?: string;
  number: string;
  softNodeLicenses: ISoftNodeLicenses;
  getNextNumber: () => string | undefined;
  profilePhotoUrl: string;
  referralContext: IOrderContext;
  unsubscriptions: Array<{ list: string; timestamp: Date }>;
  communicationConsent: {
    consentGiven: boolean;
    timestamp: Date;
  }[];
  termsAndConditionsAgreement: Array<{
    templateId: string;
    timestamp: Date;
    ipAddress: string;
  }>;
  privacyPolicyAgreement: Array<{
    templateId: string;
    timestamp: Date;
    ipAddress: string;
  }>;
  activationTermsAndConditions: {
    timestamp: Date;
    ipAddress: string;
    text: string;
  }[];
  gender?: string;
  dateOfBirth?: Date;
  country?: string;
  countryCode?: string;
  countryPhoneCode?: string;
  clinic?: string;
  careclixId?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  lastLogin: Date;
  emailVerified: Date;
  updateUserIds?: IUpdateUserIds;
  userIds: IUserIds;
}

export async function getNextNumber() {
  return new Promise((resolve, reject) => {
    mongoose.connection.db.collection('sequences').findOneAndUpdate(
      {
        name: 'users',
      },
      {
        $inc: {
          sequence: 1,
        },
      },
      {
        returnDocument: 'after',
        maxTimeMS: 5000,
      },
      (err: any, doc: any) => {
        if (err) {
          reject('collection connection error');
        } else if (!doc || !doc.value) {
          resolve('undefined');
        } else {
          const id = doc.value.sequence;
          const padded = id.toString().padStart(6, '0');

          resolve(padded);
        }
      },
    );
  });
}

const referrerRewardSchema = new mongoose.Schema(
  {
    amount: Number,
    txId: String,
  },
  { timestamps: true },
);

const activatedWalletsSchema = new mongoose.Schema({
  activated: {
    type: Boolean,
    default: false,
  },
  activationTxHash: String,
  btcToCompany: Number,
  btcToReferrer: Number,
  btcUsdPrice: Number,
  amountRewarded: Number,
  itemsRewarded: [String],
  rewardId: String,
  timestamp: Date,
  context: orderContextSchema,
  referrerReward: {
    btc: referrerRewardSchema,
    gala: referrerRewardSchema,
    winX: referrerRewardSchema,
    green: referrerRewardSchema,
  },
  galaAmount: String,
});

const walletsActivated = new mongoose.Schema({
  green: activatedWalletsSchema,
  winx: activatedWalletsSchema,
  gala: activatedWalletsSchema,
});

const walletShareSchema = new mongoose.Schema({
  green: Number,
  gala: Number,
  connect: Number,
  codex: Number,
  localhost: Number,
});

const walletSchema = new mongoose.Schema(
  {
    ethAddress: String,
    ethBlockNumAtCreation: Number,
    cryptoFavorites: [String],
    cryptoFavoritesSet: Boolean,
    ethNonce: {
      type: Number,
      default: 0,
    },
    btcAddress: String,
    btcSeed: Number,
    shareLink: String,
    userCreatedInWallet: Boolean,
    activations: {
      type: walletsActivated,
      default: {},
    },
    shares: {
      type: walletShareSchema,
      default: {},
    },
  },
  { timestamps: true },
);

const utmSchema = new mongoose.Schema({
  utmCampaign: String,
  utmMedium: String,
  utmSource: String,
  utmKeyword: String,
  utmContent: String,
  utmName: String,
  utmTerm: String,
  offer: String,
});

export const userIdsSchema = new mongoose.Schema({
  connectUserId: { type: String, required: false, default: undefined },
  arcadeUserId: { type: String, required: false, default: undefined },
  greenUserId: { type: String, required: false, default: undefined },
  codexUserId: { type: String, required: false, default: undefined },
  blueUserId: { type: String, required: false, default: undefined }, // deprecated (change to galvan)
  galvanUserId: { type: String, required: false, default: undefined },
  switchUserId: { type: String, required: false, default: undefined },
  giveUserId: { type: String, required: false, default: undefined },
  libertyUserId: { type: String, required: false, default: undefined },
  elementUserId: { type: String, required: false, default: undefined },
  digUserId: { type: String, required: false, default: undefined },
  airUserId: { type: String, required: false, default: undefined },
  waterUserId: { type: String, required: false, default: undefined },
});

export const userSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    displayName: { type: String, unique: true, index: true, trim: true },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    secondaryEmail: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      index: true,
      default: 'member',
    },
    phone: String,
    phoneCountry: String,
    affiliateId: { type: String, index: true },
    referredBy: { type: String, index: true },
    affiliate: {
      affiliateId: String,
      sessionId: String,
    },
    referredByLocked: Boolean,
    language: String,
    created: { type: Date, index: true },
    id: { type: String, index: true },
    firebaseUid: {
      type: String,
      unique: true,
      index: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    twoFaTempSecret: String,
    twoFaSecret: String,
    walletAddresses: Array,
    number: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    wallet: walletSchema,
    softNodeLicenses: {
      green: Number,
      codex: Number,
      arcade: Number,
      connect: Number,
    },
    profilePhotoUrl: String,
    utmInfo: {
      type: utmSchema,
      default: {},
    },
    unsubscriptions: [
      {
        list: {
          type: String,
          index: true,
        },
        timestamp: Date,
      },
    ],
    communicationConsent: [
      {
        consentGiven: false,
        timestamp: Date,
      },
    ],
    termsAndConditionsAgreement: [
      {
        timestamp: Date,
        templateId: String,
        ipAddress: String,
      },
    ],
    privacyPolicyAgreement: [
      {
        timestamp: Date,
        templateId: String,
        ipAddress: String,
      },
    ],
    activationTermsAndConditions: [
      {
        timestamp: Date,
        text: String,
        ipAddress: String,
      },
    ],
    gender: String,
    dateOfBirth: Date,
    country: String,
    countryCode: String,
    countryPhoneCode: String,
    clinic: String,
    careclixId: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    lastLogin: Date,
    emailVerified: Date,
    userIds: { type: userIdsSchema, required: false, default: undefined },
  },
  { id: false },
);

userSchema.pre('save', async function (this: IUser, next) {
  const user = this;
  if (user.email) {
    user.email = user.email.toLowerCase();
    user.affiliateId =
      user.affiliateId || new mongoose.Types.ObjectId().toHexString();
  }
  if (!user.created) {
    user.created = new Date();
  }
  next();
});

userSchema.post('save', async function (doc: IUser, next: any) {
  if (!doc._id) {
    return;
  }
  const id = doc._id.toString();
  if (doc.id !== id) {
    doc.id = id;
    try {
      doc.save();
    } catch (err) {
      next(err);
    }
  }
});

userSchema.post('insertMany', async function (doc: IUser, next: any) {
  if (!doc._id) {
    return;
  }
  const id = doc._id.toString();
  if (doc.id !== id) {
    doc.id = id;
    try {
      doc.save();
    } catch (err) {
      next(err);
    }
  }
});

const User = mongoose.model<IUser>('user', userSchema);

export default User;
