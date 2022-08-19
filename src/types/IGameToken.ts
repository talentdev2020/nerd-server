export interface IAcquiredGameToken {
  id: string;
  lootBoxId: string;
  gameItemId: string;
  dateAquired: number;
  aquisitionType: string;
}

export interface IGameToken {
  id: string;
  game: string;
  description: string;
  image: string;
  icon: string;
  coin: string;
  galaFee: number;
  tradeWaitTime: number;
  withdrawalWaitTime: number;
  items: IAcquiredGameToken[];
}
