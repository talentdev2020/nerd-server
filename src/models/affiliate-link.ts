import { Document, model, Schema } from 'mongoose';

export interface IAffiliateLink extends Document {
  id: string;
  pageUrl: string;
  name: string;
  brand: string;
}

export const affiliateLinkSchema = new Schema(
  {
    id: { type: String, unique: true, index: true, trim: true },
    pageUrl: String,
    name: String,
    brand: String,
  },
  { id: false },
);

affiliateLinkSchema.post('save', async function(
  affiliateLink: IAffiliateLink,
  next: any,
) {
  setId(affiliateLink, next);
});

affiliateLinkSchema.post('insertMany', async function(
  affiliateLink: IAffiliateLink,
  next: any,
) {
  setId(affiliateLink, next);
});

function setId(affiliateLink: IAffiliateLink, next: any) {
  if (!affiliateLink._id) {
    return;
  }

  const id = affiliateLink._id.toString();

  if (affiliateLink.id !== id) {
    affiliateLink.id = id;

    try {
      affiliateLink.save();
    } catch (err) {
      next(err);
    }
  }
}

export const AffiliateLink = model<IAffiliateLink>(
  'affiliate-link',
  affiliateLinkSchema,
);
