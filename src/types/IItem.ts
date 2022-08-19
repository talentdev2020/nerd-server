import { IWalletTransaction } from './IWalletTransaction';
import { IUniqueItem } from './IUniqueItem';

export interface IItem {
  description: string;
  image: string;
  name: string;
  game: string;
  baseId: string;
  properties: {
    farmbot: { requiredQty: number };
    rarity: { icon: string; label: string; supplyLimit: number };
  };
  walletTransaction?: IWalletTransaction;
}
export enum SortBy {
  price = 'price',
  date = 'DATE',
  nftBaseId = 'NFT-BASE-ID',
  quantity = 'quantity',
  rarity = 'rarity',
  // quantity = 'QUANTITY',
}
export enum HighOrLow {
  high = 1,
  low = -1,
}
export enum SortDirection {
  ascending = 'ascending',
  descending = 'descending',
}
export enum RarityLabel {
  Common = 1,
  Uncommon,
  Rare,
  Epic,
  Legendary,
}
export interface IItemQueryInput {
  base: string;
  rel: string;
  nftBaseId?: string;
  tokenId?: string;
  userId?: string;
  sortBy?: SortBy;
  highOrLow?: HighOrLow;
  direction?: SortDirection;
}
export interface IGetItemsResponse {
  nftBaseId: string;
  coin: string;
  tokenId: string;
  seller: string;
  timestamp: number;
  listPrice: number;
}
export interface IGetAggregatedItemsResponse {
  nftBaseId: string;
  coin: string;
  quantity: number;
  avgPrice: number;
}

export interface IExchangeItem {
  id: string;
  game: string;
  name: string;
  nftBaseId?: string;
  coin: string;
  description?: string;
  image: string;
  properties: {
    rarity?: {
      icon: string;
      label: keyof typeof RarityLabel;
      supplyLimit: number;
    };
  };

  quantity: number;
  avgPrice: number;
  items: IUniqueItem[];
}
