import axios from 'axios';
import { configAws, logger } from 'src/common';

class WalletServerCoreService {
  private axiosTimeout = 10_000;
  private markPaidUrl = `${configAws.coreUrl}/api/webhooks/invoices/mark-paid`;
  private lincesesGrantedUrl = `${configAws.coreUrl}/api/webhooks/invoices/grant-license`;

  private headers = {
    'X-API-KEY': configAws.coreAPIKey,
    'Content-Type': 'application/json',
  };

  private config = {
    headers: this.headers,
    timeout: this.axiosTimeout,
  };

  async notifyOrderStatusSetToComplete(orderId: string, userId:string, email:string) {
    const data = { 
      orderId,
      userId,
      email,      
    };

    try {
      await axios.put(this.markPaidUrl, data, this.config);
    } catch (error) {
      logger.error(
        `unable to nofify to Core that order:${orderId} is complete: ${error?.message}`,
      );
    }
  }

  async notifyOrderLicensesGranted(orderId: string, userId:string, email:string) {
    const data = {
       orderId,
       userId,
       email,
    };    

    try {
      await axios.put(this.lincesesGrantedUrl, data, this.config);
    } catch (error) {
      logger.error(
        `unable to nofify to Core that licenses have been granted for order:${orderId}: ${error?.message}`,
      );
    }
  }
}

//Remove this empty function when we move to event pattern.
function emptyFunction(...args:any):any{
  return;
};

const walletServerCoreService = new WalletServerCoreService();

if (!configAws.coreUrl || !configAws.coreAPIKey){  
  walletServerCoreService.notifyOrderLicensesGranted = emptyFunction;
  walletServerCoreService.notifyOrderStatusSetToComplete = emptyFunction;
  logger.criticalContext("Core invoices API not enabled due missconfiguration",{coreUrl:configAws.coreUrl,  coreAPIKey:configAws.coinMarketCapAPIKey});
}

export default walletServerCoreService;


