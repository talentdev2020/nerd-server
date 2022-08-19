import {
  IPaywiserKycNotification,
  IPaywiserIbanNotification,
  IPaywiserDocExpiredNotification,
  IPaywiserFiatTransferNotification,
  IPaywiserDocumentWillExpireNotification,
  IPaywiserKycOngoingNotification,
  IPaywiserTransaction,
  EPaywiserTransactionTypes,
  IPaywiserKycFundsNotification,
  IPaywiserBuyNotification,
  IPaywiserSellNotification,
  IPaywiserDocumentRequest,
  IPaywiserKycDocument,
  EPaywiserConstants,
} from 'src/types';
import { logger } from '../common';
import { IbanStatus, UserIban, UserIbanStatus, UserPaywiserModel } from 'src/models';
import { paywiser } from '../../src/services/paywiser';
import { v4 as uuidv4 } from 'uuid';
import { userIbanService } from './user-iban';

class NotificationHandlerService {
  public handleKycNotification = async (
    notification: IPaywiserKycNotification,
  ) => {
    try {
      // find the "user-paywiser" entry
      const userPaywiser = await UserPaywiserModel
        .findOne({ 'kyc.referenceNumber': notification.ReferenceNumber })
        .lean()
        .exec();

      if (!userPaywiser) {
        throw new Error('Info not recorded - user with provided reference number not found');
      }

      const res = await UserPaywiserModel.updateOne(
        { 'kyc.referenceNumber': notification.ReferenceNumber },
        {
          $set: {
            'kyc.personId': notification.PersonID,
            'kyc.kycId': notification.KycID,
            'kyc.kycStatus': notification.KycStatus,
            'kyc.verificationStatus': notification.VerificationStatus,
          },
        },
      );
      if (res.matchedCount < 1) {
        throw new Error('KYC record not found!');
      }

      if (
        notification.KycStatus === 'Successful' &&
        notification.VerificationStatus === 'Accepted'
      ) {
        const requestDocumentData: IPaywiserDocumentRequest = {
          PersonID: notification.PersonID,
          KycID: notification.KycID,
          ReferenceID: uuidv4(),
        };
        const response = await paywiser.GetPersonDocumentData(
          requestDocumentData,
        );
        if (response.StatusCode === EPaywiserConstants.PAYWISER_STATUSCODE_OK) {
          const document: IPaywiserKycDocument = {
            documentId: response.Document.ID,
            type: response.Document.Type,
            issuer: response.Document.Issuer,
            expiryDate: response.Document.ExpiryDate,
            willExpire: response.Document.WillExpire,
            expired: response.Document.Expired,
            documentNumber: response.Document.DocumentNumber,
            subject: {
              firstName: response.Document.Subject.FirstName,
              lastName: response.Document.Subject.LastName,
              birthDate: response.Document.Subject.BirthDate,
              gender: response.Document.Subject.Gender,
              nationality: response.Document.Subject.Nationality,
              personalNumber: response.Document.Subject.PersonalNumber,
            },
          };
          await UserPaywiserModel.updateOne(
            {
              'kyc.personId': notification.PersonID,
              'kyc.documents': {
                $not: {
                  $elemMatch: { documentId: document.documentId },
                },
              },
            },
            {
              $push: {
                'kyc.documents': document,
              },
            },
          );
        } else {
          logger.error(`Could not retrieve KYC documents for userid ${userPaywiser.userId}`);
        }

        // create IBAN if conditions are met
        await userIbanService.tryCreateIbanForUser(userPaywiser.userId);
      }
    } catch (error) {
      logger.error(
        `services.notificationHandler.handleKycNotification. notification: ${notification} error: ${error}`,
      );
      throw error;
    }
  };

  handleDocumentWillExpire = async (
    notification: IPaywiserDocumentWillExpireNotification,
  ): Promise<String> => {
    if (!notification) throw new Error('notification required');
    if (!notification.PersonID) throw new Error('PersonId required');
    if (!notification.DocumentID) throw new Error('DocumentID required');
    if (!notification.ExpirationDate)
      throw new Error('ExpirationDate required');
    try {
      const res = await UserPaywiserModel.findOneAndUpdate(
        {
          'kyc.personId': notification.PersonID,
          'kyc.documents.documentId': notification.DocumentID,
        },
        {
          $set: {
            'kyc.documents.$.willExpire': true,
          },
        },
        { projection: { 'kyc.documents.type.$': 1 } },
      )
        .lean()
        .exec();
      return res.kyc.documents[0].type;
    } catch (error) {
      logger.error(
        `services.notifcationHandler.handleDocumentWillExpire. error . notification: ${notification} error: ${error}`,
      );
      throw error;
    }
  };

  public handleDocExpiredNotification = async (
    notification: IPaywiserDocExpiredNotification,
  ): Promise<String> => {
    try {
      const res = await UserPaywiserModel.findOneAndUpdate(
        {
          'kyc.personId': notification.PersonID,
          'kyc.documents.documentId': notification.DocumentID,
        },
        {
          $set: {
            'kyc.documents.$.expired': true,
          },
        },
        { projection: { 'kyc.documents.type.$': 1 } },
      )
        .lean()
        .exec();
      return res.kyc.documents[0].type;
    } catch (error) {
      logger.error(
        `services.notificationHandler.handleDocExpiredNotification. notification: ${notification} error: ${error}`,
      );
      throw error;
    }
  };

  public handleKycFundsNotification = async (
    notification: IPaywiserKycFundsNotification,
  ) => {
    //seems to be Important. Notify admins, ensure they notice.
    //Store funds. This funds seems to be the account funds;
    // FUNDS
    // This type of notification will be sent in case whitelabel account balance drops below the set limit, providing the limit was set on the account.
    // Once available funds are exhausted, no further KYCs will be performed.

    try {
      notification.CurrentFunds;
    } catch (error) {
      logger.error(
        `services.notificationHandler.handleKycFundsNotification. notification: ${notification} error: ${error}`,
      );
      throw error;
    }
  };

  public handleKycOngoingNotification = async (
    notification: IPaywiserKycOngoingNotification,
  ) => {
    try {
      const res = await UserPaywiserModel.updateOne(
        { 'kyc.personId': notification.PersonID },
        {
          $set: {
            'kyc.verificationStatus': notification.VerificationStatus,
            'kyc.additionalDescription': notification.AdditionalDescription,
          },
        },
      );
      if (res.modifiedCount < 1) throw new Error('Paywiser KYC information not recorded');
    } catch (error) {
      logger.error(
        `services.notificationHandler.handleKycOngoingNotification. notification: ${notification} error: ${error}`,
      );
      throw error;
    }
  };

  public handleIbanNotification = async (
    notification: IPaywiserIbanNotification,
  ) => {
    // find the "user-paywiser" entry
    const userPaywiser = await UserPaywiserModel
      .findOne({ 'kyc.personId': notification.PersonID })
      .lean()
      .exec();

    if (!userPaywiser) {
      throw new Error('Info not recorded - user with provided PersonID not found');
    }

    try {
      const iban = {
        personId: notification.PersonID,
        documentId: notification.DocumentID,
        ibanId: notification.IbanID,
        ibanCurrency: notification.IbanCurrency,
        ibanTypeId: notification.IbanTypeID,
        cardTypeId: notification.CardTypeID,
      };
      const res = await UserPaywiserModel.updateOne(
        { '_id': userPaywiser._id },
        {
          $set: {
            'kyc.ibanObject': iban,
          },
        },
      );
      if (res.matchedCount < 1) throw new Error('Info no recorded');
    } catch (error) {
      logger.error(
        `services.notificationHandler.handleKycNotification. notification: ${notification} error: ${error}`,
      );
      throw error;
    }

    // Store the IBAN on the UserIban model
    try {
      // get the IBAN details from IBAN API
      const listIbansResult = await paywiser.listIbans(notification.PersonID);
      if (listIbansResult?.StatusCode !== EPaywiserConstants.PAYWISER_STATUSCODE_OK) {
        const msg = `Can not list IBANs for personId ${notification.PersonID}`;
        logger.error(msg);
        throw new Error(msg);
      }

      // find the first active IBAN and store it
      if (!listIbansResult.IBANs || listIbansResult.IBANs.length === 0) {
        logger.error(`No IBAN has been created for person ${notification.PersonID}`);
        return;
      }
      const iban = listIbansResult.IBANs.find(i => i.ID === notification.IbanID);
      if (!iban) {
          throw new Error(`IBAN with ID ${notification.IbanID} not found for personID  ${notification.PersonID}`);
      }

      const userIban = await UserIban.findOne({ userId: userPaywiser.userId }).lean().exec();

      await UserIban.updateOne({ _id: userIban._id }, {
        $set: {
          status: UserIbanStatus.IbanCreated,
          iban: {
            status: iban.Status as IbanStatus,
            paywiserIbanId: iban.ID,
            ibanNumber: iban.Iban,
            currency: iban.Currency,
          },
        },
      });
    } catch (error) {
      logger.error(
        `services.notificationHandler.handleKycNotification. notification: ${notification} error: ${error}`,
      );
      throw error;
    }
  };

  public handleBuyCryptoNotification = async (
    notification: IPaywiserBuyNotification,
  ) => {
    try {
      const res = await UserPaywiserModel.updateOne(
        {
          cryptoTransactions: {
            $elemMatch: {
              transactionId: notification.TransactionID,
              type: EPaywiserTransactionTypes.BUY,
            },
          },
        },
        {
          $set: {
            'cryptoTransactions.$.transactionStatus':
              notification.TransactionStatus,
            'cryptoTransactions.$.endAmount': notification.Amount,
          },
        },
      );
      if (res.modifiedCount < 1) throw new Error('Info no recorded');
    } catch (error) {
      logger.error(
        `services.notificationHandler.handleBuyCryptoNotification. notification: ${notification} error: ${error}`,
      );
      throw error;
    }
  };

  public handleSellCryptoNotification = async (
    notification: IPaywiserSellNotification,
  ) => {
    try {
      const res = await UserPaywiserModel.updateOne(
        {
          cryptoTransactions: {
            $elemMatch: {
              transactionId: notification.TransactionID,
              type: EPaywiserTransactionTypes.SELL,
            },
          },
        },
        {
          $set: {
            'cryptoTransactions.$.transactionStatus':
              notification.TransactionStatus,
            'cryptoTransactions.$.endAmount': notification.Amount,
          },
        },
      );
      if (res.modifiedCount < 1) throw new Error('Info no recorded');
    } catch (error) {
      logger.error(
        `services.notificationHandler.sellCryptoNotification: ${notification} error: ${error}`,
      );
      throw error;
    }
  };

  public handleFiatTransferNotification = async (
    notification: IPaywiserFiatTransferNotification,
  ) => {
    //We need the documentation for this handler.
    try {
      // await user.updateOne({
      //   paywiser: notification.TransactionID,
      // },
      // {
      //   $set: {
      //     'paywiser.fiatTransfer.WhitelabelReferenceID':
      //      notification.WhitelabelReferenceID,
      //     'paywiser.fiatTransfer.TransactionID': notification.TransactionID,
      //     'paywiser.fiatTransfer.TransactionStatus':
      //       notification.TransactionStatus,
      //     'paywiser.fiatTransfer.Amount': notification.Amount,
      //   },
      // });
      notification;
    } catch (error) {
      logger.error(
        `services.notificationHandler.handleFiatTransferNotification: ${notification} error: ${error}`,
      );
      throw error;
    }
  };

  public async getUserID(bodyData: any) {
    let userPaywiser;
    if (bodyData.PersonID) {
      userPaywiser = await UserPaywiserModel.findOne(
        { 'kyc.personId': bodyData.PersonID },
        { userId: 1, _id: 0 },
      )
        .lean()
        .exec();
    } else if (bodyData.TransactionID) {
      userPaywiser = await UserPaywiserModel.findOne(
        {
          cryptoTransactions: {
            $elemMatch: {
              transactionId: bodyData.TransactionID,
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
    return userPaywiser.userId;
  }
}

export const paywiserNotificationHandler = new NotificationHandlerService();
