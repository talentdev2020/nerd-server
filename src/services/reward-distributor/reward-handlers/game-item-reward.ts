import { gameItemService } from '../../game-item';

class GameItemsReward {
  sendItemByTokenId = async (
    userId: string,
    userEthAddress: string,
    tokenId: string,
    quantity: number,
  ) => {
    const result = await gameItemService.assignItemToUserByTokenId(
      userId,
      userEthAddress,
      tokenId,
      quantity,
    );
    return result;
  };

  getUserItems = async (userId: string) => {
    const result = await gameItemService.getUserItems(userId);

    return result;
  };

  getQuantityOwned = async (userId: string, tokenId: string) => {
    const itemsOwned = await this.getUserItems(userId);
    const item = itemsOwned.find(ownedItem => ownedItem.baseId === tokenId);
    if (!item) return 0;
    return item.balance.confirmed;
  };
}

export const gameItemsReward = new GameItemsReward();
