interface IFiatPrice {
  changePercent24Hour: number;
  imageUrl: string;
  marketCap: number;
  price: string;
  supply: number;
}

export default interface IFiatPrices {
  [key: string]: IFiatPrice;
}
