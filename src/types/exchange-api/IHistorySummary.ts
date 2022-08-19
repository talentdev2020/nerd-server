export interface IGetHistorySummaryResponse {
  base: string;
  rel: string;
  nftId: string;
  avgSold: number;
  highSold: number;
  lowSold: number;
  since: number;
  currHighOnBook: number;
  currLowOnBook: number;
  currVolumeOnBook: number;
  timestamp: number;
  volume: number;
}
