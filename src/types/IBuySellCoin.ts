export interface IBuySellCoin {
  buyOrSell: string;
  base: string;
  quantityBase?: number;
  quantityRel?: number;
  tokenId?: string;
  rel: string;
  price?: number;
}
