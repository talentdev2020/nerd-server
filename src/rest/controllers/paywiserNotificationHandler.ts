import { Request, Response } from 'express';
import { logger } from '../../common';
import { IPaywiserUserNotification } from 'src/types';
import { paywiserNotificationHandler } from '../../services';
import PaywiserNotificationListener from '../notifications/paywiser';

class NotificationHandlerController {
  public async postUpdate(req: Request, res: Response) {
    // res.setHeader('Content-Type', 'application/json');
    const bodyData = req.body.Data;
    const notification: IPaywiserUserNotification = {
      message: '',
      type: 'PAYWISER_' + req.body.Type,
      status: 'success',
      userId: 'userId',
    };
    try {
      switch (req.body.Type) {
        case 'KYC': {
          await paywiserNotificationHandler.handleKycNotification(bodyData);
          notification.message = `KYC status:${bodyData.KycStatus} with verification status:${bodyData.VerificationStatus}`;
          break;
        }
        case 'DOCUMENT_WILL_EXPIRE': {
          const documentType = await paywiserNotificationHandler.handleDocumentWillExpire(
            bodyData,
          );
          notification.message = `Document:${documentType
            .split(/(?=[A-Z])/)
            .join(' ')} will expire on ${bodyData.ExpirationDate}`;
          break;
        }
        case 'DOCUMENT_EXPIRED': {
          const documentType = await paywiserNotificationHandler.handleDocExpiredNotification(
            bodyData,
          );
          notification.message = `Document:${documentType
            .split(/(?=[A-Z])/)
            .join(' ')} expired on ${bodyData.ExpirationDate}`;

          break;
        }
        case 'FUNDS': {
          return res.status(501).send();
          break;
        }
        case 'KYC_ONGOING': {
          await paywiserNotificationHandler.handleKycOngoingNotification(
            bodyData,
          );
          notification.message = `KYC data verification status:${bodyData.VerificationStatus}`;
          break;
        }
        case 'IBAN': {
          await paywiserNotificationHandler.handleIbanNotification(bodyData);
          notification.message = `Your IBAN was successfully created`;
          break;
        }

        case 'BUYCRYPTO': {
          await paywiserNotificationHandler.handleBuyCryptoNotification(
            bodyData,
          );
          notification.message = `Buy crypto transaction ${bodyData.TransactionID} status:${bodyData.TransactionStatusDescription}`;
          break;
        }

        case 'SELLCRYPTO': {
          await paywiserNotificationHandler.handleSellCryptoNotification(
            bodyData,
          );
          notification.message = `Sell crypto transaction ${bodyData.TransactionID} status:${bodyData.TransactionStatusDescription}`;
          break;
        }

        case 'FIATTRANSFER': {
          await paywiserNotificationHandler.handleFiatTransferNotification(
            bodyData,
          );
          notification.message = `Fiat transer of transaction ${bodyData.TransactionID} status:${bodyData.FiatTransferStatus}`;
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
        `notificationController.paywiser.${req.body.Type}.catch: error handling notification ${err.stack}`,
      );
      return res.status(400).send();
    }
    try {
      notification.userId = await paywiserNotificationHandler.getUserID(
        bodyData,
      );
      PaywiserNotificationListener.publishNewPaywiserNotification(notification);
    } catch (error) {
      logger.error(
        `notificationController.paywiser.getUser.catch: error Getting User ${error.stack}`,
      );
    }
  }
}

export default new NotificationHandlerController();
