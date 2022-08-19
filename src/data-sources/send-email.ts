const sgTransport = require('@blockbrothers/nodemailer-sendgrid-transport');
import * as nodemailer from 'nodemailer';
import { config, configAws, logger } from '../common';
import templateBuilder from '../templates/templateBuilder';
import { IUser } from '../types';
import { capitalize } from '../utils';
import { DataSource } from 'apollo-datasource';
import { Attachment, Options } from 'nodemailer/lib/mailer';
import * as mail from '@sendgrid/mail';



class SendEmail extends DataSource {
  capitalizedBrand = capitalize(config.brand);
  sendFromEmailAddress = configAws.sendGridEmailFrom;
  canSendEmail = false;
  // transport = nodemailer.createTransport(
  //   sgTransport({
  //     auth: {
  //       api_key: config.sendGridApiKey,
  //       domain: config.hostname,
  //     },
  //   }),
  //);

    protected async sendMailTemplate(
    sendTo: { email: string },
    templateId: string,
  ) {
    logger.debug(`data-sources.SendEmail.sendMail.sendTo: ${sendTo}`);
    const msg = {
      to: sendTo.email,
      from: configAws.sendGridEmailFrom,
      templateId,
    };
    
    mail.setApiKey(configAws.sendGridApiKey);
    const response = await mail.send(msg);
    return response;
  }

  public async sendMail(
    subject: string,
    sendTo: {
      email: string;
      communicationConsent: Array<{ timestamp: Date; consentGiven: boolean }>;
      emailVerified: Date;
    },
    html: string,
    attachments?: Attachment[],
  ) {
    logger.debug(`data-sources.SendEmail.sendMail.subject: ${subject}`);
    logger.debug(`data-sources.SendEmail.sendMail.sendTo: ${sendTo}`);

    if (
      !this.checkUserConsent(sendTo) ||
      !sendTo.email ||
      config.brand === 'gala'
    ) {
      return false;
    }

    try {
      const mailOptions: Options = {
        to: sendTo.email,
        from: this.sendFromEmailAddress,
        subject: subject,
        html: html,
      };
      if (attachments) {
        mailOptions.attachments = attachments;
      }

      return false;
      // const { message } = await this.transport.sendMail(mailOptions);
      // logger.debug(
      //   `data-sources.SendEmail.sendMail.message === success: ${message ===
      //     'success'}`,
      // );
      // return message === 'success';
    } catch (error) {
      logger.debug(`data-sources.SendEmail.sendMail.html: ${html}`);
      logger.debug(
        `data-sources.SendEmail.sendMail.attachments: ${JSON.stringify(
          attachments,
        )}`,
      );
      logger.error(error);
      return false;
    }
  }

  public async shareAccepted(user: IUser, referredUser: IUser) {
    logger.debug(
      `data-sources.SendEmail.shareAccepted.user: ${user && user.id}`,
    );
    logger.debug(
      `data-sources.SendEmail.shareAccepted.referredUser: ${referredUser &&
        referredUser.id}`,
    );
    if (!user || !referredUser) {
      return false;
    }
    const { html, subject } = templateBuilder.buildShareAcceptedHtml(
      user,
      referredUser,
      this.capitalizedBrand,
    );
    const userConsentsToEmailCommunication = this.checkUserConsent(user);
    if (userConsentsToEmailCommunication) {
      const emailSent = await this.sendMail(subject, user, html);
      logger.debug(
        `data-sources.SendEmail.shareAccepted.emailSent: ${emailSent}`,
      );
      return emailSent;
    } else {
      return false;
    }
  }

  public async sendSoftNodeDiscount(
    user: IUser,
    upgradeAccountName: string,
    photo: string,
    softnodeType: string,
  ) {
    logger.debug(
      `data-sources.SendEmail.sendSoftNodeDiscount.user: ${user && user.id}`,
    );

    if (!user || !this.checkUserConsent(user)) {
      return false;
    }
    if (upgradeAccountName.toLowerCase().includes('green')) {
      return;
    }
    const {
      html,
      subject,
      attachments,
    } = templateBuilder.buildSendSoftNodeDiscountHtml(
      user,
      upgradeAccountName,
      photo,
      softnodeType,
    );
    try {
      const emailSent = await this.sendMail(subject, user, html, attachments);
      logger.debug(
        `data-sources.SendEmail.sendSoftNodeDiscount.emailSent: ${emailSent}`,
      );
      return emailSent;
    } catch (err) {
      logger.error(err);
    }
  }

  public async sendRxCard(user: IUser, email: string) {    
    logger.debug(
      `data-sources.SendEmail.sendSoftNodeDiscount.user: ${user && user.id}`,
    );    

    const { html, subject } = templateBuilder.buildSendRxCardHtml(user.id.substring(user.id.length - 7).toUpperCase());

    const userConsentsToEmailCommunication = this.checkUserConsent(user);    

    if (userConsentsToEmailCommunication) {  
      const msg = {
        to: email,
        from: configAws.sendGridEmailFrom,
        subject: subject,
        html: html,             
      };
      
      mail.setApiKey(configAws.sendGridApiKey);
      const response = await mail.send(msg);
      if(response[0].statusCode === 202) {
        return true
      } else {
        return false
      }
    } else {
      return false;
    }
  }

  public async referrerActivated(user: IUser, referredUser: IUser) {
    logger.debug(
      `data-sources.SendEmail.referrerActivated.user: ${user && user.id}`,
    );
    logger.debug(
      `data-sources.SendEmail.referrerActivated.referredUser: ${referredUser &&
        referredUser.id}`,
    );
    if (!user || !referredUser) {
      return false;
    }
    const { html, subject } = templateBuilder.buildReferrerActivatedHtml(
      referredUser,
      this.capitalizedBrand,
    );
    const userConsentsToEmailCommunication = this.checkUserConsent(user);
    if (userConsentsToEmailCommunication) {
      const emailSent = await this.sendMail(subject, user, html);
      logger.debug(
        `data-sources.SendEmail.referrerActivated.emailSent: ${emailSent}`,
      );

      return emailSent;
    } else {
      return false;
    }
  }

  public checkUserConsent(user: {
    communicationConsent: Array<{ timestamp: Date; consentGiven: boolean }>;
  }) {
    if (user.communicationConsent && user.communicationConsent.length) {
      const mostRecentConsentEntry = user.communicationConsent.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
      )[0];
      return mostRecentConsentEntry.consentGiven;
    } else {
      // In the past, the user either could not create an account without explicitly consenting to communications, or implicitly consented by creating an account.
      // Therefore, if this property does not exist on the user document, they consented
      return true;
    }
  }
}

export default SendEmail;

export const emailService = new SendEmail();
