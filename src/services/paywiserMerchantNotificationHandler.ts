import {
  IPaywiserMerchantPaymentRequestNotification,
  IPaywiserMerchantPaymentNotification,
} from 'src/types';
import { logger } from '../common';
import { UserPaywiserModel } from 'src/models';

class NotificationHandlerService {
  public handlePaymentRequest = async (
    notification: IPaywiserMerchantPaymentRequestNotification,
  ) => {
    try {
      const res = await UserPaywiserModel.updateOne(
        {
          paymentRequests: {
            $elemMatch: {
              pendingPaymentId: notification.PendingPaymentID,
            },
          },
        },
        {
          $set: {
            'paymentRequests.$.customerAction': notification.CustomerAction,
            'paymentRequests.$.transactionStatus':
              notification.TransactionStatus,
          },
        },
      );
      if (res.modifiedCount < 1) {
        throw new Error('Info no recorded');
      }
    } catch (error) {
      logger.error(
        `services.notificationHandler.handleKycNotification. notification: ${notification} error: ${error}`,
      );
      throw error;
    }
  };

  handlePayment = async (
    notification: IPaywiserMerchantPaymentNotification,
  ) => {
    try {
      const res = await UserPaywiserModel.updateOne(
        {
          paymentRequests: {
            $elemMatch: {
              pendingPaymentId: notification.PendingPaymentID,
            },
          },
        },
        {
          $set: {
            'paymentRequests.$.transactionStatus':
              notification.TransactionStatus,
          },
        },
      );
      if (res.modifiedCount < 1) {
        throw new Error('Info no recorded');
      }
    } catch (error) {
      logger.error(
        `services.notifcationHandler.handleDocumentWillExpire. error . notification: ${notification} error: ${error}`,
      );
      throw error;
    }
  };

  public async getUserID(bodyData: any) {
    let userPaywiser;
    if (bodyData.PendingPaymentID) {
      userPaywiser = await UserPaywiserModel.findOne(
        {
          paymentRequests: {
            $elemMatch: {
              pendingPaymentId: bodyData.PendingPaymentID,
            },
          },
        },
        {
          userId: 1,
          _id: 0,
        },
      )
        .lean()
        .exec();
    } else {
      throw new Error('Body data does not match');
    }
    //@ts-ignore
    return userPaywiser.userId;
  }
}

export const paywiserMerchantNotificationHandler = new NotificationHandlerService();
