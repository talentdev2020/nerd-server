import { EBrands } from 'src/types';
import IRelatedUser from 'src/multiBrand/types/IRelatedUser';
import { User, IUserIds } from 'src/models';
import { logger } from 'src/common';

class RelateUsersService {
  private mapUserIds = new Map<string, string>([
    ['connectUserId', EBrands.CONNECT],
    // ['arcadeUserId', EBrands.ARCADE],
    ['greenUserId', EBrands.GREEN],
    // ['codexUserId', EBrands.CODEX],
    ['blueUserId', EBrands.BLUE], // deprecated
    ['galvanUserId', EBrands.GALVAN],
    ['switchUserId', EBrands.SWITCH],
    ['elementUserId', EBrands.ELEMENT],
    ['digUserId', EBrands.ELEMENT],
    // ['airUserId', EBrands.AIR],
    // ['waterUserId', EBrands.WATER],
    ['giveUserId', EBrands.GIVE],
    ['libertyUserId', EBrands.LIBERTY],
  ]);

  public transformUserIdsToArray(userIds: IUserIds): IRelatedUser[] {
    const relatedUserArray: IRelatedUser[] = [];
    if (userIds) {
      this.mapUserIds.forEach((brand: string, field: string) => {
        if (userIds.hasOwnProperty(field))
          relatedUserArray.push({
            brand,
            userId: userIds[field as keyof IUserIds],
          });
      });
    }
    return relatedUserArray;
  }

  public findUserIdsFromDB = async (userId: string): Promise<IUserIds> => {
    try {
      const user = await User.findOne({ id: userId }, { userIds: 1, _id: 0 })
        .lean()
        .exec();
      if (!user.userIds) user.userIds = { connectUserId: null };
      if (!user.userIds.connectUserId) user.userIds.connectUserId = userId;
      return user.userIds;
    } catch (error) {
      logger.warn(`data-sources.user.findFromDB.catch(${{ userId }}):${error}`);
      throw error;
    }
  };

  public compareUserIdsAndBrands(
    userIds: IRelatedUser[],
    brands: EBrands[],
  ): { usersIntersectBrands: IRelatedUser[]; BrandsExceptUsers: EBrands[] } {
    if (!brands)
      return { usersIntersectBrands: [...userIds], BrandsExceptUsers: [] };

    const usersIntersectBrands: IRelatedUser[] = [];
    const BrandsExceptUsers = [...brands];
    userIds.forEach((relatedUser: IRelatedUser) => {
      const index = BrandsExceptUsers.findIndex(
        brand => relatedUser.brand === brand,
      );
      if (index >= 0) {
        usersIntersectBrands.push(relatedUser);
        BrandsExceptUsers.splice(index, 1);
      }
    });
    return { usersIntersectBrands, BrandsExceptUsers };
  }
}

export const relatedUsers = new RelateUsersService();
export default relatedUsers;
