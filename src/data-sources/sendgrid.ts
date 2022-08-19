import { RESTDataSource } from 'apollo-datasource-rest';
import { config, configAws } from '../common';
import * as sgMail from '@sendgrid/mail';
import * as sgClient from '@sendgrid/client';

export class SendGrid extends RESTDataSource {
  constructor(
    private isOkToSendEmail: boolean,
    private isOkToAddContacts: boolean,
  ) {
    super();
  }

  protected sendEmail = async (
    sendToEmailAddress: string,
    emailVerified: boolean,
    templateId: string,
    unsubscribeGroupId: number,
    templateVariables?: { [key: string]: string },
  ) => {
    //TODO : this is called over and over in server.ts as part of the datasource. 
    sgMail.setApiKey(configAws.sendGridApiKey);
    sgClient.setApiKey(configAws.sendGridApiKey);

    if (this.isOkToSendEmail && emailVerified) {
      sgMail.send({
        from: {
          email: configAws.sendGridEmailFrom,
          name: 'Gala Support',
        },
        to: sendToEmailAddress,
        templateId,
        asm: {
          groupId: unsubscribeGroupId,
        },
        dynamicTemplateData: templateVariables,
      });
    }
  };

  public addContact = (
    firstName: string,
    lastName: string,
    email: string,
    emailVerified: boolean,
    lists: string[],
  ) => {
    //TODO : this is called over and over in server.ts as part of the datasource. 
    sgMail.setApiKey(configAws.sendGridApiKey);
    sgClient.setApiKey(configAws.sendGridApiKey);


    if (!this.isOkToAddContacts || !emailVerified) {
      return Promise.resolve();
    }
    return sgClient.request({
      method: 'PUT',
      url: '/v3/marketing/contacts',
      body: {
        list_ids: lists,
        contacts: [
          {
            first_name: firstName,
            last_name: lastName,
            email,
          },
        ],
      },
    });
  };
}
