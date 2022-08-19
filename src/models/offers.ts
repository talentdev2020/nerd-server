import { model, Schema, Document } from 'mongoose';

interface IOfferDoc extends Document {
  name: string;
  enabled: boolean;
  title: string;
  templateId: string;
  emailTemplateId: string;
  image: string;
  created: Date;
  resourceURL: string;
  directMarketingURL: string;
  DMTitle: string;
  DMDesc: string;
  DMImage: string;
}

export const offersSchema = new Schema({
  name: {
    required: true,
    type: String,
  },
  enabled: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  templateId: {
    type: String,
    default: '',
  },
  emailTemplateId: {
    type: String,
    default: '',
  },
  image: {
    type: String,
    default: '',
  },
  created: { type: Date, default: Date.now },
  resourceURL: {
    type: String,
    default: '',
  },
  directMarketingURL: {
    type: String,
    default: '',
  },
  DMTitle: {
    type: String,
    default: '',
  },
  DMDesc: {
    type: String,
    default: '',
  },
  DMImage: {
    type: String,
    default: '',
  },
});

export default model<IOfferDoc>('offer', offersSchema);
