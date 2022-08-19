import { model, Schema, Document } from 'mongoose';

interface IUnclaimedWalletRewardDoc extends Document {
  userId: string;
  btcValue: string;
  created: Date;
  updated: Date;
  hasWalletProperty: boolean;
}

export const unclaimedWalletRewardSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    btcValue: {
      type: String,
      required: true,
    },
    hasWalletProperty: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true },
);

export default model<IUnclaimedWalletRewardDoc>(
  'UnclaimedWalletReward',
  unclaimedWalletRewardSchema,
);
