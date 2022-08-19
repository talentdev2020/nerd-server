import { logger, config, ResolverBase, configAws } from '../common';
import {
  Context,
  EPaywiserConstants,
  IPaywiserMerchantPaymentRequest,
  IPaywiserMerchantRequestPaymentRequest,
  IPaywiserMerchantPaymentRequestResponse,
  IPaywiserMerchantUserNotification,
} from 'src/types';

import { UserPaywiserModel } from '../models';
import { paywiserMerchantService } from '../services/paywiserMerchant';
import { withFilter } from 'apollo-server-express';
import { v4 as uuidv4 } from 'uuid';
import { paywiser as paywiserService } from '../services/paywiser';
class Resolvers extends ResolverBase {
  public getAllMerchantPurchases = async (
    parent: any,
    args: {},
    { user }: Context,
  ) => {
    this.requireAdmin(user);
    try {
      const merchantSells: IPaywiserMerchantPaymentRequest[] = await UserPaywiserModel.aggregate(
        [
          { $unwind: '$paymentRequests' },
          {
            $group: {
              _id: 0,
              paymentConfirm: { $push: '$paymentRequests' },
            },
          },
        ],
      );
      return merchantSells;
    } catch (error) {
      logger.error(
        `resolvers.paywiserMerchant.getAllMerchantPurchases.catch: ${error.stack}`,
      );
      throw error;
    }
  };

  public requestPayment = async (
    parent: any,
    args: {
      args: {
        amount: string;
        description: string;
      };
    },
    { user, wallet }: Context,
  ) => {
    this.requireAuth(user);

    try {
      const { amount, description } = args.args;
      const fiatSymbolObject = await paywiserService.getCurrencyObjectBySymbol(
        'EUR',
      );

      const amountFixed = paywiserService.normalizeAmountDecimals(
        amount,
        fiatSymbolObject.Decimals,
      );
      const userPaywiser = await UserPaywiserModel.findOne(
        { userId: user.userId },
        { 'kyc.ibanObject': 1, 'kyc.personId': 1, _id: 0 },
      )
        .lean()
        .exec();
      if (!userPaywiser) throw new Error('Paywiser user not found');
      const requestPaymentRequest: IPaywiserMerchantRequestPaymentRequest = {
        ReferenceID: uuidv4(),
        OrderID: 'orderId123',
        CustomerPersonID: userPaywiser.kyc.personId, //Should I search this? => yes
        CustomerMobileNumber: null,
        Amount: amountFixed,
        Currency: 'EUR', //userPaywiser.kyc.ibanObject.ibanCurrency,
        Description: description,
        ValidMinutes: configAws.paywiserMerchantValidMinutes,
        ValidToDateTime: null, //'validToDateTime2022/01/01',
        NumberOfPayments: null,
      };

      const responsePaymentRequest = await paywiserMerchantService.requestPayment(
        requestPaymentRequest,
      );
      if (
        responsePaymentRequest.StatusCode !==
        EPaywiserConstants.PAYWISER_STATUSCODE_OK
      )
        throw new Error(
          `Paywiser statusCode error, StatusDescription:${responsePaymentRequest.StatusDescription}`,
        );

      const paymentRequest: IPaywiserMerchantPaymentRequest = {
        orderId: requestPaymentRequest.OrderID,
        customerPersonId: userPaywiser.kyc.personId,
        amount,
        currency: userPaywiser.kyc.ibanObject.ibanCurrency,
        description,
        validMinutes: configAws.paywiserMerchantValidMinutes,
        validToDateTime: responsePaymentRequest.ValidToDateTime,
        numberOfPayments: 1,
        referenceId: responsePaymentRequest.ReferenceID,
        pendingPaymentId: responsePaymentRequest.PendingPaymentID,
        qrCodeData: responsePaymentRequest.QRCodeData,
        callerReferenceId: responsePaymentRequest.CallerReferenceID,
        customerAction: '',
        transactionStatus: '',
      };
      const updateOneResponse = await UserPaywiserModel.updateOne(
        {
          userId: user.userId,
        },
        {
          $push: {
            paymentRequests: paymentRequest,
          },
        },
      );

      const findOne = await UserPaywiserModel.findOne({
        userId: user.userId,
      })
        .lean()
        .exec();

      if (
        updateOneResponse.modifiedCount < 1 ||
        !updateOneResponse.modifiedCount
      )
        throw new Error(
          'Transaction not stored, paywiser user not found, or duplicated transaction',
        );
      const paymentRequestresponse: IPaywiserMerchantPaymentRequestResponse = {
        orderId: requestPaymentRequest.OrderID,
        amount,
        currency: userPaywiser.kyc.ibanObject.ibanCurrency,
        description,
        validToDateTime: responsePaymentRequest.ValidToDateTime,
        numberOfPayments: 1,
        qrCodeData: responsePaymentRequest.QRCodeData,
      };
      return paymentRequestresponse;
    } catch (error) {
      logger.error(
        `resolvers.paywiserMerchant.requestPayment.catch: ${error.stack}`,
      );
      throw error;
    }
  };

  public listenForPaywiserMerchantNotification = (
    _parent: any,
    _args: any,
    context: any,
  ) => {
    this.requireAuth(context?.user);

    return configAws.pubsub.asyncIterator(['PAYWISER_MERCHANT_NOTIFICATION']);
  };
}

const resolvers = new Resolvers();

export default {
  Query: {
    paywiserPaymentRequestConfirm: resolvers.getAllMerchantPurchases,
  },
  Mutation: {
    paywiserMerchantRequestPayment: resolvers.requestPayment,
  },
  Subscription: {
    paywiserMerchantGetUserNotification: {
      subscribe: withFilter(
        resolvers.listenForPaywiserMerchantNotification,
        (
          payload: IPaywiserMerchantUserNotification,
          _: any,
          context: any,
          info: any,
        ) => {
          return payload.userId === context.user.userId;
        },
      ),
      resolve: (
        payload: IPaywiserMerchantUserNotification,
        args: any,
        context: any,
        info: any,
      ) => {
        return {
          message: payload.message,
          type: payload.type,
          status: payload.status,
        };
      },
    },
  },
};
