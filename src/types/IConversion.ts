import { IBuySellCoin } from './IBuySellCoin';

export interface IConversion extends IBuySellCoin {
  price: number;
  fees?: number;
  expires: Date;
}
