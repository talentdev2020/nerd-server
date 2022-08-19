import { Document, model, Schema } from 'mongoose';

export interface IAffiliateLinkUser extends Document {
  id: string;
  userId: string;
  affiliateLinkId: string;
  bitlyLink: string;
  longLink: string;
  created: Date;
}

export const affiliateLinkUserSchema = new Schema(
  {
    id: String,
    userId: String,
    affiliateLinkId: String,
    bitlyLink: String,
    longLink: String,
    created: Date,
  },
  { id: false },
);

affiliateLinkUserSchema.post('save', async function(
  affiliateLinkUser: IAffiliateLinkUser,
  next: any,
) {
  setId(affiliateLinkUser, next);
});

affiliateLinkUserSchema.post('insertMany', async function(
  affiliateLinkUser: IAffiliateLinkUser,
  next: any,
) {
  setId(affiliateLinkUser, next);
});

function setId(affiliateLinkUser: IAffiliateLinkUser, next: any) {
  if (!affiliateLinkUser._id) {
    return;
  }

  const id = affiliateLinkUser._id.toString();

  if (affiliateLinkUser.id !== id) {
    affiliateLinkUser.id = id;

    try {
      affiliateLinkUser.save();
    } catch (err) {
      next(err);
    }
  }
}

const AffiliateLinkUser = model<IAffiliateLinkUser>(
  'affiliate-link-user',
  affiliateLinkUserSchema,
);

export default AffiliateLinkUser;
