import coreAPI from 'src/services/wallet-server-core';
import { logger } from '../common';
import {  
  ICartWatcherData,
  CartRedisKey,  
  ICartBalance,  
  TGetCartAddressSource,
} from '../types';

class WalletServerCoreEventHandler {
  onOrderStatusSetToComplete(
    keyObj: CartRedisKey,
    valueObj: ICartWatcherData,
    _balance: ICartBalance,
  ) {
    if (valueObj.source === 'core') {
      let companyAppData;
      try {
        companyAppData = JSON.parse(valueObj.companyAppTxData);
      } catch (error) {
        logger.warn('company app data failed to be parsed');
      }
      coreAPI.notifyOrderStatusSetToComplete(
        keyObj.orderId,
        valueObj.userId,
        companyAppData?.member?.email,
      );
    }
  }

  onOrderLicensesGranted(transactionSource:TGetCartAddressSource, orderId:string, userId:string, email:string){
    if (transactionSource === 'core'){
      coreAPI.notifyOrderLicensesGranted(orderId,userId,email);
    }
  }
}

export default new WalletServerCoreEventHandler();