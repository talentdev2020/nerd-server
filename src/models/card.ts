import * as mongoose from 'mongoose';
export interface ICard extends mongoose.Document {
  type: string;
  description?: string;
  details?: [string];
  price: number;
  title: string;
  ibanTypeId: string;
  cardTypeId: string;
}

export const cardSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },
  cardTypeId: {
    type: String,
    required: true,
  },
  ibanTypeId: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  details: {
    type: Array(String),
    required: false,
  },
  price: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
});

const Card = mongoose.model<ICard>('card', cardSchema, 'card-info');

export default Card;