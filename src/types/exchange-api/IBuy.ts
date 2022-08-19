export interface IBuyRequest {
  base: string; // the name of the coin the user desires to receive
  rel: string; // the name of the coin the user desires to sell
  tokenId: string;
  quantityBase?: number; // the amount of coins the user is willing to receive of the base coin
  quantityRel?: number;
  price?: number; // the price in rel the user is willing to pay per one unit of the base coin
}

export interface IBuyResponse {
  action: string; // the action of the request (Buy)
  base: string; // the base currency of request
  baseAmount: string; // the resulting amount of base currency that will be received if the order matches (in decimal representation)
  base_amount_rat: number; // the resulting amount of base currency that will be received if the order matches (in rational representation)
  rel: string; // the rel currency of the request
  relAmount: string; // the maximum amount of rel coin that will be spent to buy the base_amount (according to price, in decimal representation)
  rel_amount_rat: number; // the maximum amount of rel coin that will be spent to buy the base_amount (according to price, in rational representation)
  method: string; // this field is used for internal P2P interactions; the value is always equal to "request"
  dest_pub_key: string; // reserved for future use. dest_pub_key will allow the user to choose the P2P node that will be eligible to match with the request. This value defaults to a "zero pubkey", which means anyone can be a match
  sender_pubkey: string; // 	the public key of this node
  uuid: string; // the request uuid -- supposedly this corresponds to the swap uuid, does it correspond to an order uuid?
  price: string;
  status: string;
  startedAt: number;
}
export interface IBuyError {
  error: string /* Two different types:
  "rpc:278] utxo:884] REL balance 12.88892991 is too low, required 21.15"
  "rpc:275] lp_ordermatch:665] The WORLD amount 40000/3 is larger than available 47.60450107, balance: 47.60450107, locked by swaps: 0.00000000"
  */;
}
export function isBuyError(
  data: { result: IBuyResponse } | IBuyError,
): data is IBuyError {
  return (data as IBuyError).error !== undefined;
}
