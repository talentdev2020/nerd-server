import { Schema, Document, model } from 'mongoose';

export interface IClickDoc extends Document {
  userId: string;
  offerId: string;
  type: string;
  created: Date;
}

export const clicksSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  offerId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: 'click',
  },
  created: Date,
});

clicksSchema.pre('save', function(this: IClickDoc, next) {
  const doc = this;
  doc.created = new Date();
  next();
});

export default model<IClickDoc>('click', clicksSchema);
