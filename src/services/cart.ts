import { logger } from '../common';
import {
  CartTransaction,
  CartFiatTransaction,
  ICartFiatTransaction,
  UserIban,
  UserIbanStatus,
} from '../models';
import {
  cartTransactionsHeaderReport,
  cartTransactionsDetailReport,
} from '../pipelines';
import {
  ICartTransactionsReportHeaderResponse,
  ICartTransactionsReportDetail,
} from '../types';

import cryptoAPI from './crypto-api';
import { userIbanService } from './user-iban';

export class CartService {
  async getAllCartTransactionsHeaderReport(
    startDate: Date,
    endDate: Date,
  ): Promise<ICartTransactionsReportHeaderResponse> {
    const pipeline = cartTransactionsHeaderReport(startDate, endDate);
    const report = await CartTransaction.aggregate<
      ICartTransactionsReportHeaderResponse
    >(pipeline);
    return (
      report[0] || {
        grandTotalRevenueUsdSum: '0',
        productsByCategory: [],
      }
    );
  }

  async getAllCartTransactionsDetailReport(
    startDate: Date,
    endDate: Date,
  ): Promise<ICartTransactionsReportDetail[]> {
    const { BTC: BTCPrice, ETH: ETHPrice } = await cryptoAPI.getFiatPrices(
      'BTC,ETH',
      'USD',
    );
    const pipeline = cartTransactionsDetailReport(
      startDate,
      endDate,
      BTCPrice.price,
      ETHPrice.price,
    );
    const report = await CartTransaction.aggregate<
      ICartTransactionsReportDetail
    >(pipeline);
    return report || [];
  }

  async createFiatTransaction(fiatCartTransaction: ICartFiatTransaction) {
    try {
      const response = await CartFiatTransaction.create(fiatCartTransaction);
      if (response) {
        // Create UserIban entry for this purchase if it does not already exist
        const cardType = fiatCartTransaction.productId;

        const countIbans = await UserIban.countDocuments({ userId: fiatCartTransaction.userId }).exec();
        if (countIbans === 0) {
          const userIban = new UserIban({
            userId: fiatCartTransaction.userId,
            packageName: cardType,
            status: UserIbanStatus.Purchased,
          });
          await userIban.save();
          await userIbanService.tryCreateIbanForUser(fiatCartTransaction.userId);
          logger.info(`Saved debit card purchase (UserIban) for user ${fiatCartTransaction.userId}`)
        } else {
          logger.error(`IBAN for the user ${fiatCartTransaction.userId} already exists!`)
        }

        return { success: true };
      }
    } catch (error) {
      logger.error(`services.cart.createFiatTransaction: ${error}`);
      return { success: false, message: error };
    }
  }
}

export const cartService = new CartService();
export default cartService;
