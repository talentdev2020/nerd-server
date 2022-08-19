const SibApiV3Sdk = require('sib-api-v3-sdk');
import { configAws, logger } from '../common';
import { DataSource } from 'apollo-datasource';
import { SendinblueKey } from '../models'
import { IMailParams } from '../types'
class SendInBlue extends DataSource {
  public async loadApiKey(): Promise<string> {
    const apiKey = await SendinblueKey.find({}).exec();    
    return apiKey[0].sendinblueApiKey;    
  }

  public async sendWelcomeEmail(email: string) {    
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    // Configure API key authorization: api-key
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = await this.loadApiKey();
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail(); 
    // SendSmtpEmail | Values to send a transactional email
    
    sendSmtpEmail = {
      to: [{
          email: email,          
      }],
      templateId: 49,
      params: {        
        email: email,        
      },      
    };

    
    try {      
      const data = await apiInstance.sendTransacEmail(sendSmtpEmail);      
      logger.debug(
        `data-sources.SendEmail.sibTransactionalEmail.emailSent: ${JSON.stringify(data)}`,
      );
    } catch(error) {
      logger.debug(
        `data-sources.SendEmail.sibTransactionalEmail.error: ${error}`,
      );
    }
  }  
  public async addContactList(email: string, listId: number) {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = await this.loadApiKey();
    const apiInstance = new SibApiV3Sdk.ContactsApi();
    
    const requestContactImport = new SibApiV3Sdk.RequestContactImport();

    requestContactImport.fileBody = `EMAIL\n${email}`;
    requestContactImport.listIds = [listId];
    requestContactImport.emailBlacklist = false;
    requestContactImport.smsBlacklist = false;
    requestContactImport.updateExistingContacts = true;
    requestContactImport.emptyContactsAttributes = false;
              
    try {
        const data = await apiInstance.importContacts(requestContactImport);            
        logger.debug(
          `data-sources.SendEmail.addContactList.emailAdded: ${JSON.stringify(data)}`,
        );
    } catch(error) {
        logger.debug(
          `data-sources.SendEmail.addContactList.error: ${error}`,
        );
    }
  }

  public async sibTransactionalEmail(mailParams: IMailParams) {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    // Configure API key authorization: api-key
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = await this.loadApiKey();
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail(); // SendSmtpEmail | Values to send a transactional email

    sendSmtpEmail = {
      to: [{
          email: mailParams.email,
          name: mailParams.firstName + ' ' + mailParams.lastName,
      }],
      templateId: 56,
      params: {
        TRANSACTION_NUMBER: mailParams.transactionNumber,
        DATE_AND_TIME: mailParams.dateAndTIme,
        ETHERSCAN_LINK: mailParams.etherscanLink,
        FIRSTNAME: mailParams.firstName,
        LASTNAME: mailParams.lastName,
        email: mailParams.email,
        PRODUCT_NAME: mailParams.productName,
        PRODUCT_PRICE: mailParams.productPrice,
        QUANTITY: mailParams.quantity,
        AMOUNT_RECEIVED: mailParams.amountReceived,
        COIN_SYMBOL: mailParams.coinSymbol,
      },      
    };
    
    try {
      const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
      logger.debug(
        `data-sources.SendEmail.sibTransactionalEmail.emailSent: ${JSON.stringify(data)}`,
      );
    } catch(error) {
      logger.debug(
        `data-sources.SendEmail.sibTransactionalEmail.error: ${error}`,
      );
    }
    
  }
}

export default SendInBlue;

export const sendinblueService = new SendInBlue();
