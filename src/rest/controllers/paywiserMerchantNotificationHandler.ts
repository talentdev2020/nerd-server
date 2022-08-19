import { Request, Response } from 'express';
import { IPaywiserMerchantUserNotification } from 'src/types';
import { paywiserMerchantNotificationHandler } from '../../services';
import PaywiserMerchantNotificationListener from '../notifications/paywiserMerchant';
import { logger } from '../../common';
class NotificationHandlerController {
  public async postUpdate(req: Request, res: Response) {
    // res.setHeader('Content-Type', 'application/json');
    const bodyData = req.body.Data;
    const notification: IPaywiserMerchantUserNotification = {
      message: '',
      type: req.body.Type,
      status: 'success',
      userId: 'userId',
    };

    try {
      switch (req.body.Type) {
        case 'PAYMENTREQUEST': {
          await paywiserMerchantNotificationHandler.handlePaymentRequest(
            bodyData,
          );
          notification.message = `PendingPaymentID: ${bodyData.PendingPaymentID} status:${bodyData.TransactionStatus} has been ${bodyData.CustomerAction}`;
          break;
        }
        case 'PAYMENT': {
          await paywiserMerchantNotificationHandler.handlePayment(bodyData);
          notification.message = `PendingPaymentID: ${bodyData.PendingPaymentID} status:${bodyData.TransactionStatus}`;
          break;
        }
        default: {
          logger.error(
            `notificationController.paywiser.${
              req.body.Type
            }.catch: unknown notification ${JSON.stringify(req.body)}`,
          );
          return res.status(200).send();
        }
      }
      res.status(200).send();
    } catch (err) {
      logger.error(
        `notificationController.paywiserMerchant.${req.body.Type}.catch: error ${err.stack}`,
      );
      return res.status(400).send();
    }
    try {
      notification.userId = await paywiserMerchantNotificationHandler.getUserID(
        bodyData,
      );
      PaywiserMerchantNotificationListener.publishNewPaywiserMerchantNotification(
        notification,
      );
    } catch (error) {
      logger.error(
        `notificationController.paywiser.getUser.catch: error Getting User ${error.stack}`,
      );
    }
  }
}

export default new NotificationHandlerController();
