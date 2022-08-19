import { logger } from "src/common";
import { Card, IbanStatus, UserIban, UserIbanStatus, UserPaywiserModel } from "src/models";
import { EPaywiserConstants } from "src/types";
import { paywiser as paywiserService } from "./paywiser";

export class UserIbanService {
    /**
     * Check the conditions and create an IBAN account for the user if they conditions are met
     * @param userId the id of the user
     * @returns void
     */
    async tryCreateIbanForUser(userId: string) {
        // check if the user is KYC-ed
        const userPaywiser = await UserPaywiserModel.findOne({ userId });

        if (!userPaywiser || !userPaywiser.kyc) {
            // user hasn't been KYC-ed yet
            return;
        }

        // Check KYC status
        if (userPaywiser.kyc.kycStatus !== "Successful" || userPaywiser.kyc.verificationStatus !== "Accepted") {
            // the KYC is procedure is either not complete or not succesful
            return;
        }

        // Retrieve PersonID
        const personId = userPaywiser.kyc.personId;
        if (!personId) {
            logger.error(`KYC PersonID for user ${userId} is not available`);
            return;
        }

        // check if the user has purchased a debit card (UserIban entry exists with status Purchased)
        const userIban = await UserIban.findOne({ userId: userId });
        if (!userIban) {
            // the debit card (IBAN) hasn't been purchased yet
            return;
        }

        // check if the IBAN is not yet created
        if (userIban.iban) {
            // The IBAN has already been created
            // N.B.: if Switch will ever allow multiple IBANs, this is where it needs to be handled
            return;
        }

        // ensure that the UserIban is in status "Purchased"
        if (userIban.status !== UserIbanStatus.Purchased) {
            logger.error(`The UserIban for user is not in status ${UserIbanStatus.Purchased} while IBAN is not created!`);
            return;
        }

        // retrieve the ibanType
        const allCards = await Card.find();
        const purchasedCard = allCards.find(c => c.type === userIban.packageName);
        if (!purchasedCard) {
            logger.error(`The UserIban for user references an unknown debit card package!`);
            return;
        }
        const ibanTypeId = purchasedCard.ibanTypeId;
        const cardTypeId = purchasedCard.cardTypeId;
        if (!ibanTypeId || !cardTypeId) {
            logger.error(`The IBAN TypeId or Card TypeId could not be determined!`);
            return;
        }

        // create an IBAN for that user
        // NB: the iban will be created when the Paywiser service sends webhook notification
        // with type "IBAN"
        // see paywiserNotificationHandler
        const result = await paywiserService.createPaywiserIban(personId, ibanTypeId, cardTypeId);
        if (result.StatusCode !== EPaywiserConstants.PAYWISER_STATUSCODE_OK) {
            logger.error(`Could not create IBAN for user ${userId} with personId ${personId}. StatusCode: ${result.StatusCode} ${result.StatusDescription}`);
            return;
        }

        logger.info(`IBAN has been requested for user ${userId}`);
    }
}

export const userIbanService = new UserIbanService();