import { Types } from 'mongoose';
import { IOrderContext } from './IOrderContext';

export interface IGameOrder {
  userId: string;
  quantity: number;
  perUnitPriceUsd: number;
  gameProductId: Types.ObjectId | string;
  galaUsdPrice: number;
  totalGala: number;
  txHash: string;
  isUpgradeOrder: boolean;
  itemsReceived: string[];
  created: Date;
  context: IOrderContext;
}
