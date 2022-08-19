import {
  shareAccepted,
  referralActivated,
  sendSoftNodeDiscount,
  sendRxCard,
} from './handlebars';
import { IUser } from '../types';
import config from '../common/config';
import * as Handlebars from 'handlebars';
import { configAws, logger } from '../common';
import * as path from 'path';

class TemplateBuilder {
  buildShareAcceptedHtml(user: IUser, referredUser: IUser, brand: string) {
    return {
      html: Handlebars.compile(shareAccepted.html)({
        user,
        referredUser,
        brand,
        referralLink: user.wallet.shareLink,
      }),
      subject: shareAccepted.subject,
    };
  }

  buildReferrerActivatedHtml(referredUser: IUser, brand: string) {
    return {
      html: Handlebars.compile(referralActivated.html)({
        referredUserFirstName: referredUser.firstName,
        brand,
      }),
      subject: referralActivated.subject,
    };
  }

  buildSendSoftNodeDiscountHtml(
    user: IUser,
    upgradeAccountName: string,
    photo: string,
    softnodeType: string,
  ) {
    const filepath = path.join(__dirname, '/../assets/', photo);
    const cid = 'logo';
    logger.debug(
      `templates.templateBuilder.buildSendSoftNodeDiscountHtml.upgradeAccountName: ${upgradeAccountName}`,
    );

    logger.debug(
      `templates.templateBuilder.buildSendSoftNodeDiscountHtml.photo: ${photo}`,
    );
    logger.debug(
      `templates.templateBuilder.buildSendSoftNodeDiscountHtml.softnodeType: ${softnodeType}`,
    );
    logger.debug(
      `templates.templateBuilder.buildSendSoftNodeDiscountHtml.filepath: ${filepath}`,
    );

    return {
      html: Handlebars.compile(sendSoftNodeDiscount.html)({
        user,
        brand: upgradeAccountName.replace('+', ''),
        href: configAws.cartUrl,
        softnodeType,
      }),
      subject: sendSoftNodeDiscount.subject(upgradeAccountName),
      attachments: [
        {
          filename: photo,
          path: filepath,
          cid,
        },
      ],
    };
  }

  buildSendRxCardHtml(id: string) {
    return {
      html: Handlebars.compile(sendRxCard.html)({
        id,
      }),
      subject: sendRxCard.subject,
    }
  }
}

export default new TemplateBuilder();
