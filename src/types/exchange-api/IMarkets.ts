export interface IMarketsRequest {
  uuid: string;
}

export interface IMarketsResponse {
  markets: IMarket[];
  timestamp: number;
}

export interface IMarket {
  coin: string;
  relationships: ISymbol[];
  timestamp: number;
}

export interface ISymbol {
  base: string;
  rel: string;
  symbol: string;
  decimals: number;
  precision: number;
  last: number; // rel per base
  timestamp: number;
}
