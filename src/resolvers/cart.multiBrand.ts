import { EPermissions } from './../types/context';
import { ResolverBase, config, logger } from 'src/common';
import { Context } from 'src/types/context';
import {
  ICartTransactionsReportHeaderResponse,
  EBrands,
  TCartTransactionsHeaderReportOrError,
  ICustomGraphQLError,
  ICartTransactionsReportDetailResponse,
  TCartTransactionsDetailReportOrError,
} from 'src/types';
import { cartService } from 'src/services';

import {MultiBrandClient} from 'src/multiBrand/common/multiBrandClient';

import { ETokenTypes } from 'src/multiBrand/types';

class Resolvers extends ResolverBase {
  
  getCartTransactionsHeaderReportResolver = async (
    _parent: any,
    args: { brandList: { brand?: EBrands; startDate: Date; endDate: Date }[] },
    ctx: Context,
  ): Promise<unknown[]> => {
    if (config.brand !== 'connect') throw new Error('Not allowed');

    const multiBrandClient: MultiBrandClient = new MultiBrandClient();
    const multiBrandCartTransactionsHeaderReportClient = multiBrandClient.getMultiBrandClient<
      ICartTransactionsReportHeaderResponse,
      { startDate: Date; endDate: Date },
      null
    >(
      'headerReportOrError',
      '/cart/getHeaderReport',
      ETokenTypes.MULTIBRAND_ADMIN,
    );

    const { user } = ctx;
    this.requirePermissionOrAdmin(user, EPermissions.CLIMB_VIEW_ACCOUNTING);
    let { brandList } = args;

    //if exists an item in brandList where its brand is not set,
    //then take this as all remaining brands in the array.
    const noBrandIndex = brandList.findIndex(item => !item.brand);
    if (noBrandIndex !== -1) {
      const remainingBrandsFields = brandList.splice(noBrandIndex, 1)[0];
      //only the first item with a not set brand, has sense. so remove others if are some.
      brandList = brandList.filter(item => !!item.brand);
      Object.values(EBrands).forEach(value => {
        if (!brandList.some(item => value === item.brand)) {
          brandList.push({
            brand: value,
            startDate: remainingBrandsFields.startDate,
            endDate: remainingBrandsFields.endDate,
          });
        }
      });
    }

    //If the current brand is required, then splice the item for the current brand from the array
    //server might be connect due this feature is only implemented for connect.
    const connectItemIndex = brandList.findIndex(
      item => item.brand === config.brand.toUpperCase(),
    );
    let connectItem: { brand?: EBrands; startDate: Date; endDate: Date };
    if (connectItemIndex !== -1) {
      connectItem = brandList.splice(connectItemIndex, 1)[0];
    }

    const AllRequiredBrandsResponses = await multiBrandCartTransactionsHeaderReportClient(
      brandList?.map(item => ({
        brand: item.brand,
        args: { startDate: item.startDate, endDate: item.endDate },
      })),
    );

    //If the current brand is required, then retrieve the data from the current server. The actual
    //server might be connect due this feature is only implemented for connect.
    if (connectItem) {
      let connectResponse: TCartTransactionsHeaderReportOrError;
      try {
        connectResponse = await cartService.getAllCartTransactionsHeaderReport(
          connectItem.startDate,
          connectItem.endDate,
        );
      } catch (error) {
        logger.exception(
          `multiBrand.resolvers.cart.getCartTransactionsHeaderReportResolver getAllCartTransactionsHeaderReport Brand CONNECT, error: ${error}`,
        );
        connectResponse = <ICustomGraphQLError>{
          message: error.message,
          code: '',
        };
      }
      // AllRequiredBrandsResponses.push({
      //   brand: connectItem.brand,
      //   headerReportOrError: connectResponse,
      // });
    }
    return AllRequiredBrandsResponses;
  };

  getCartTransactionsDetailReportResolver = async (
    _parent: any,
    args: { brandList: { brand?: EBrands; startDate: Date; endDate: Date }[] },
    ctx: Context,
  ): Promise<unknown[]> => {
    const multiBrandClient: MultiBrandClient = new MultiBrandClient();

    const multiBrandCartTransactionsDetailReportClient = multiBrandClient.getMultiBrandClient<
      ICartTransactionsReportDetailResponse,
      { startDate: Date; endDate: Date },
      null
    >(
      'detailReportOrError',
      '/cart/getDetailReport',
      ETokenTypes.MULTIBRAND_ADMIN,
    );

    if (config.brand !== 'connect') throw new Error('Not allowed');

    const { user } = ctx;
    this.requirePermissionOrAdmin(user, EPermissions.CLIMB_VIEW_ACCOUNTING);
    let { brandList } = args;

    //if exists an item in brandList where its brand is not set,
    //then take this as all remaining brands in the array.
    const noBrandIndex = brandList.findIndex(item => !item.brand);
    if (noBrandIndex !== -1) {
      const remainingBrandsFields = brandList.splice(noBrandIndex, 1)[0];
      //only the first item with a not set brand, has sense. so remove others if are some.
      brandList = brandList.filter(item => !!item.brand);
      Object.values(EBrands).forEach(value => {
        if (!brandList.some(item => value === item.brand)) {
          brandList.push({
            brand: value,
            startDate: remainingBrandsFields.startDate,
            endDate: remainingBrandsFields.endDate,
          });
        }
      });
    }

    //If the current brand is required, then splice the item for the current brand from the array
    //server might be connect due this feature is only implemented for connect.
    const connectItemIndex = brandList.findIndex(
      item => item.brand === config.brand.toUpperCase(),
    );
    let connectItem: { brand?: EBrands; startDate: Date; endDate: Date };
    if (connectItemIndex !== -1) {
      connectItem = brandList.splice(connectItemIndex, 1)[0];
    }

    const AllRequiredBrandsResponses = await multiBrandCartTransactionsDetailReportClient(
      brandList?.map(item => ({
        brand: item.brand,
        args: { startDate: item.startDate, endDate: item.endDate },
      })),
    );

    //If the current brand is required, then retrieve the data from the current server. The actual
    //server might be connect due this feature is only implemented for connect.
    if (connectItem) {
      let connectResponse: TCartTransactionsDetailReportOrError;
      try {
        const cartTransactions = await cartService.getAllCartTransactionsDetailReport(
          connectItem.startDate,
          connectItem.endDate,
        );
        connectResponse = { cartTransactions };
      } catch (error) {
        logger.exception(
          `multiBrand.resolvers.cart.getCartTransactionsDetailReportResolver getAllCartTransactionsDetailReport Brand CONNECT, error: ${error}`,
        );
        connectResponse = <ICustomGraphQLError>{
          message: error.message,
          code: '',
        };
      }
      // AllRequiredBrandsResponses.push({
      //   brand: connectItem.brand,
      //   detailReportOrError: connectResponse,
      // });
    }
    return AllRequiredBrandsResponses;
  };
}

const resolvers = new Resolvers();
export default {
  Query: {
    multiBrandGetCartTransactionsHeaderReport:
      resolvers.getCartTransactionsHeaderReportResolver,
    multiBrandGetCartTransactionsDetailReport:
      resolvers.getCartTransactionsDetailReportResolver,
  },
};
