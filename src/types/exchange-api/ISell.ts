export interface ISellRequest {
  base: string; // the name of the coin the user desires to sell
  rel: string; // the name of the coin the user desires to receive
  tokenId: string;
  price?: number; // the price in rel the user is willing to receive per one unit of the base coin
  quantityBase?: number; // the amount of coins the user is willing to sell of the base coin
  quantityRel?: number;
}

export interface ISellResponse {
  action: string; // the action of the request (Sell)
  base: string; // the base currency of request
  base_amount: string; // the resulting amount of base currency that will be received if the order matches (in decimal representation)
  base_amount_rat: number; // the resulting amount of base currency that will be received if the order matches (in rational representation)
  rel: string; // the rel currency of the request
  rel_amount: string; // the maximum amount of rel coin that will be spent to buy the base_amount (according to price, in decimal representation)
  rel_amount_rat: number; // the maximum amount of rel coin that will be spent to buy the base_amount (according to price, in rational representation)
  method: string; // this field is used for internal P2P interactions; the value is always equal to "request"
  dest_pub_key: string; // reserved for future use. dest_pub_key will allow the user to choose the P2P node that will be eligible to match with the request. This value defaults to a "zero pubkey", which means anyone can be a match
  sender_pubkey: string; // 	the public key of this node
  uuid: string; // the request uuid -- supposedly this corresponds to the swap uuid, does it correspond to an order uuid?
}
export interface ISellError {
  error: string; // example: "rpc:278] utxo:884] BASE balance 12.88892991 is too low, required 21.15"
}
export function isSellError(
  data: { result: ISellResponse } | ISellError,
): data is ISellError {
  return (data as ISellError).error !== undefined;
}
