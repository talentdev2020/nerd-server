import { Document, model, Schema } from 'mongoose';

export interface IAffiliateAction extends Document {
  affiliateId: string;
  sessionId: string;
  url: string;
}

export const affiliateActionSchema = new Schema(
  {
    affiliateId: String,
    sessionId: String,
    url: String,
  },
  { id: false },
);

const AffiliateAction = model<IAffiliateAction>(
  'affiliate-action',
  affiliateActionSchema,
);

export default AffiliateAction;
