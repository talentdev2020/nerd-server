export enum gameProductCoins {
  BTC = 'BTC',
}

export enum gameOptions {
  townStar = 'Town Star',
}

export interface IGameProduct {
  name: string;
  coin: gameProductCoins;
  game: gameOptions;
  baseId?: string;
  priceUsd: number;
  basePriceUsd: number;
  description?: string;
  image: string;
  quantities: number[];
  rarity?: {
    icon: string;
    label: string;
    supplyLimit: number;
    hexcode: string;
  };
}
