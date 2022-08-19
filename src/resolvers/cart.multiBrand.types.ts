import {
  TCartTransactionsHeaderReportOrError,
  TCartTransactionsDetailReportOrError,
} from 'src/types';

class Resolvers {
  CartTransactionsHeaderReportOrError(
    obj: TCartTransactionsHeaderReportOrError,
  ) {
    if (obj.hasOwnProperty('grandTotalRevenueUsdSum'))
      return 'CartTransactionsHeaderReportResponse';
    if (obj.hasOwnProperty('message')) return 'ErrorResponse';
    return null;
  }

  CartTransactionsDetailReportOrError(
    obj: TCartTransactionsDetailReportOrError,
  ) {
    if (obj.hasOwnProperty('cartTransactions'))
      return 'CartTransactionsDetailReportResponse';
    if (obj.hasOwnProperty('message')) return 'ErrorResponse';
    return null;
  }
}
const resolvers = new Resolvers();
export default {
  CartTransactionsHeaderReportOrError: {
    __resolveType: resolvers.CartTransactionsHeaderReportOrError,
  },
  CartTransactionsDetailReportOrError: {
    __resolveType: resolvers.CartTransactionsDetailReportOrError,
  },
};
