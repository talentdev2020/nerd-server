import { model, Schema, Document } from 'mongoose';
import { ITemplate } from '../types';

export interface ITemplateDocument extends ITemplate, Document {}

const templateSchema = new Schema({
  name: { type: String, index: true },
  html: String,
  created: { type: Date, index: true },
  id: { type: String, index: true },
});

export const Template = model<ITemplateDocument>('template', templateSchema);
