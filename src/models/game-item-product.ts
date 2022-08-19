import { Schema, model, Document } from 'mongoose';

interface IGameItemProduct {
  name: string;
  hdPath: string;
  invoiceAddress: string;
  game: string;
  price: number;
  basePrice: number;
  baseId: string;
}

export interface IGameItemProductDoc extends IGameItemProduct, Document {}

const gameItemProductSchema = new Schema({
  name: {
    type: String,
    requried: true,
  },
  hdPath: {
    type: String,
    required: true,
  },
  invoiceAddress: {
    type: String,
    required: true,
    unique: true,
  },
  price: {
    type: Number,
    required: true,
  },
  basePrice: {
    type: Number,
    required: true,
  },
  baseId: {
    type: String,
    required: true,
    index: true,
  },
});

export const GameitemProduct = model<IGameItemProductDoc>(
  'game-item-product',
  gameItemProductSchema,
);
