import { Schema, model, Document } from 'mongoose';

export interface IPromotionalRewardDoc extends Document {
  rewardType: string;
  rewardName: string;
  amount: number;
  created: Date;
  userId: string;
  environmentType: string;
}

export const promotionalRewardSchema = new Schema({
  rewardName: String,
  amount: Number,
  created: Date,
  userId: String,
  rewardType: String,
  environmentType: String,
});

promotionalRewardSchema.pre('save', async function(
  this: IPromotionalRewardDoc,
  next,
) {
  const promotionalReward = this;
  if (!promotionalReward.created) {
    promotionalReward.created = new Date();
  }
  next();
});

const PromotionalRewards = model<IPromotionalRewardDoc>(
  'promotional-rewards',
  promotionalRewardSchema,
);

export default PromotionalRewards;
