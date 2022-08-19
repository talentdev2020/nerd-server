export interface IOrderbookRequest {
  base: string; // base currency of a pair
  rel: string; // "related" currency, also can be called "quote currency" according to exchange terms
  tokenId?: string;
}

export interface IOrderbookResponse {
  bids: IOrderResponse[]; // an array of objects containing outstanding bids
  asks: IOrderResponse[]; // an array of objects containing outstanding asks
  numbids: number; // the number of outstanding bids
  numasks: number; // the total number of asks
  base: string; // the name of the coin the user desires to receive
  rel: string; // 	the name of the coin the user will trade
  netid: number; // the id of the network on which the request is made (default is 0)
  timestamp: number; // the timestamp of the orderbook request
  expires: number; // timestamp of how long these prices are good for
}

export interface IOrderResponse {
  coin: string; // the name of the base coin; the user desires this
  address: string; // the address offering the trade
  price: number; // the price in rel the user is willing to pay per one unit of the base coin
  price_rat: string; // the price in rational representation
  maxvolume: number; // the maximum amount of base coin the offer provider is willing to sell
  max_volume_rat: string; // the max volume in rational representation
  pubkey?: string; // the pubkey of the offer provider
  userId: string;
  age: number; // the age of the offer (in seconds)
  zcredits: number; // the zeroconf deposit amount
  nftBaseId: string;
  tokenId: string;
  uuid: string;
}
