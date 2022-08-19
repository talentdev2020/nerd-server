import connections from './connections';
import { Types } from 'mongoose';
import { cryptoCompareService } from './cryptoCompare';
import { logger } from 'src/common';

interface ILootBoxOrder {
  isUpgradeOrder: boolean;
  itemsReceived: string[];
  quantity: number;
  totalBtc: number;
  txHash: string;
  userId: string;
  created: Date;
}

interface IGameOrder extends ILootBoxOrder {
  btcUsdPrice: number;
  gameProductId: Types.ObjectId;
  perUnitPriceUsd: number;
  migrated: boolean;
}

const fetchPrice = (
  offset: number,
  lootBoxOrder: ILootBoxOrder,
): Promise<IGameOrder> =>
  new Promise((resolve, reject) => {
    const timeout = offset * 250;
    setTimeout(() => {
      const gameProductId = new Types.ObjectId('5e6ac731a8dad001ef268b81');
      const time = Math.floor(lootBoxOrder.created.getTime() / 1000);
      cryptoCompareService
        .getHistoricalPriceHour('BTC', time)
        .then(btcUsdPrice => {
          const convertedOrder: IGameOrder = {
            ...lootBoxOrder,
            btcUsdPrice,
            gameProductId,
            perUnitPriceUsd: 10,
            migrated: true,
          };
          resolve(convertedOrder);
        });
    }, timeout);
  });

void (async () => {
  const cnx = await connections.arcade.prod.connect();
  const LootBoxOrder = cnx.collection('loot-box-orders');
  const GameOrder = cnx.collection('game-orders');
  const lootBoxOrders = ((await LootBoxOrder.find(
    {},
  ).toArray()) as unknown) as ILootBoxOrder[];
  logger.info(`lootBoxOrders.length`);
  const gameOrders = await Promise.all(
    lootBoxOrders.map((order, i) => fetchPrice(i, order)),
  );
  const insertResult = await GameOrder.insertMany(gameOrders);
  logger.JSON.info(insertResult);
})();
