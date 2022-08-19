import { relatedUsers } from 'src/multiBrand/services/relatedUsers';
import { ResolverBase, config, logger } from 'src/common';
import { Context } from 'src/types/context';
import {
  EBrands,
  ICustomGraphQLError,
  ILicenseCountAndNodesOnlineResponse,
  ILicenseTypeCountAndNodesOnlineOrError,
} from 'src/types';
import { MultiBrandClient } from 'src/multiBrand/common/multiBrandClient';
import { licenseTypeService } from 'src/services';
import { ETokenTypes } from 'src/multiBrand/types';
class MultiBrandLicenseTypeMapping extends ResolverBase {
  

  getMultiBrandLicenseCountResponseResolver = async (
    _parent: any,
    args: { brandList: { brand?: EBrands }[] },
    ctx: Context,
  ): Promise<unknown[]> => {
    if (config.brand !== 'connect') throw new Error('Not allowed');
    const { user } = ctx;
    this.requireAuth(user);
    let { brandList } = args;
    const userIds = await relatedUsers.findUserIdsFromDB(user.userId);
    const userIdsArray = relatedUsers.transformUserIdsToArray(userIds);
    const noBrandIndex = brandList.findIndex(item => !item.brand);
    if (noBrandIndex !== -1) {
      //only the first item with a not set brand, has sense. so remove others if are some.
      brandList = brandList.filter(item => !!item.brand);
      userIdsArray.forEach(relatedBrand => {
        if (!brandList.some(item => relatedBrand.brand === item.brand)) {
          brandList.push({
            brand: EBrands[relatedBrand.brand as EBrands],
          });
        }
      });
    }
    const userIsNotInBrand = brandList.filter(
      item => !userIdsArray.some(item2 => item.brand === item2.brand),
    );
    brandList = brandList.filter(item =>
      userIdsArray.some(item2 => item.brand === item2.brand),
    );
    //If the current brand is required, then splice the item for the current brand from the array
    //server might be connect due this feature is only implemented for connect.
    const connectItemIndex = brandList.findIndex(
      item => item.brand === config.brand.toUpperCase(),
    );
    let connectItem: { brand?: EBrands };
    if (connectItemIndex !== -1) {
      connectItem = brandList.splice(connectItemIndex, 1)[0];
    }

    const multiBrandClient: MultiBrandClient = new MultiBrandClient();
    const getMultiBrandLicenseCountAndNodesOnline = multiBrandClient.getMultiBrandClient<
      ILicenseTypeCountAndNodesOnlineOrError,
      null,
      { user: { userId: string } }
    >(
      'licenseCountAndNodesOnlineOrError',
      '/license/getLicenseCount',
      ETokenTypes.MULTIBRAND_USER,
    );
    const AllRequiredBrandsResponses = await getMultiBrandLicenseCountAndNodesOnline(
      brandList?.map(item => ({
        brand: item.brand,
        args: null,
        ctx: {
          user: {
            userId: userIdsArray.find(userId => {
              return item.brand === userId.brand;
            }).userId,
          },
        },
      })),
    );
    if (userIsNotInBrand.length > 0) {
      for (let i = 0, lenght = userIsNotInBrand.length; i < lenght; i++) {
        const userIsNotInBrandResponse = <ICustomGraphQLError>{
          message: `User is not related with ${userIsNotInBrand[i].brand}. Please link your account from connect or contact support.`,
          code: '',
        };
        AllRequiredBrandsResponses.push({
          brand: userIsNotInBrand[i].brand,
          licenseCountAndNodesOnlineOrError: userIsNotInBrandResponse,
        });
      }
    }
    //If the current brand is required, then retrieve the data from the current server. The actual
    //server might be connect due this feature is only implemented for connect.
    if (connectItem) {
      let connectResponse: ILicenseTypeCountAndNodesOnlineOrError;
      try {
        const LicenseTypeCountAndNodesOnlineResponse: ILicenseCountAndNodesOnlineResponse = await licenseTypeService.getLicenseTypeCountAndNodesOnline(
          user.userId,
        );
        connectResponse = {
          nodesOnline: LicenseTypeCountAndNodesOnlineResponse.nodesOnline,
          licenseCount: LicenseTypeCountAndNodesOnlineResponse.licenseCount,
        };
      } catch (error) {
        logger.exception(
          `multiBrand.resolvers.cart.getCartTransactionsHeaderReportResolver getAllCartTransactionsHeaderReport Brand CONNECT, error: ${error}`,
        );
        connectResponse = <ICustomGraphQLError>{
          message: error.message,
          code: '',
        };
      }
      AllRequiredBrandsResponses.push({
        brand: connectItem.brand,
        licenseCountAndNodesOnlineOrError: connectResponse,
      });
    }
    return AllRequiredBrandsResponses;
  };
}
const resolvers = new MultiBrandLicenseTypeMapping();
export default {
  Query: {
    getMultiBrandLicenseTypeCountsAndNodesOnline:
      resolvers.getMultiBrandLicenseCountResponseResolver,
  },
};
