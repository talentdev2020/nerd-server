import { Types } from 'mongoose';
import { IOrderContext } from './IOrderContext';

export interface IGameOrderBtc {
  userId: string;
  quantity: number;
  perUnitPriceUsd: number;
  gameProductId: Types.ObjectId | string;
  btcUsdPrice: number;
  totalBtc: number;
  txHash: string;
  isUpgradeOrder: boolean;
  itemsReceived: string[];
  created: Date;
  context: IOrderContext;
}
