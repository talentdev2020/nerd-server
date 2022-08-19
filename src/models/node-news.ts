import { Schema, model, Document } from 'mongoose';
import { INodeNews } from '../types';

export interface INodeNewsDocument
  extends Omit<INodeNews, '_id'>,
  Document { }

export const NodeNewsSchema = new Schema({
  text: String,
  link: String,
  date: Date,
});

const NodeNewsModel = model<INodeNewsDocument>(
  'node-news',
  NodeNewsSchema,
);

export default NodeNewsModel;