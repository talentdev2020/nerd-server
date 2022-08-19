import { model, Schema, Document } from 'mongoose';
import { IErc1155Token } from '../types';
export interface IErc1155TokenDocument extends IErc1155Token, Document {}
const erc1155TokenSchema = new Schema({
  createdBy: String,
  tokenId: String,
  uri: String,
  name: String,
  description: String,
  image: String,
  decimals: String,
  baseId: String,
  properties: {
    rarity: {
      icon: String,
      label: String,
      hexcode: String,
      supplyLimit: Number,
    },
    game: String,
  },

  localization: {
    uri: String,
    default: String,
    locales: [String],
  },
});

export const Erc1155Token = model<IErc1155TokenDocument>(
  'erc1155-token',
  erc1155TokenSchema,
);
