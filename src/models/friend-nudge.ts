import { model, Schema, Document } from 'mongoose';

interface IFriendNudgeDoc extends Document {
  code: string;
  userId: string;
  friend: string;
  created: Date;
  updated: Date;
}

export const friendNudgeSchema = new Schema(
  {
    code: { type: String, index: true, required: true },
    userId: { type: String, index: true, required: true },
    friend: { type: String, index: true, required: true },
  },
  { timestamps: { createdAt: 'created', updatedAt: 'updated' } },
);

export const FriendNudge = model<IFriendNudgeDoc>(
  'friend-nudges',
  friendNudgeSchema,
);
