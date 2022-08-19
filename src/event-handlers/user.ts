import {  logger } from '../common';
import { userService } from 'src/services';
import {
  ICartWatcherData,
  CartRedisKey,  
  ICartBalance,    
} from '../types';

export class UserEventHandler {
  async onOrderStatusSetToComplete(keyObj:CartRedisKey, valueObj:ICartWatcherData, balance:ICartBalance){        
    let orderInfoString;    
    
    if (valueObj.source === 'core'){
      orderInfoString = valueObj.companyAppTxData;
    } else {
      orderInfoString = valueObj.meprTxData;      
    }

    let orderInfo;
    try {
      orderInfo = JSON.parse(orderInfoString);        
    } catch (error) {
       logger.error(`Failed to parse order info from ${valueObj.source}`);
       return;
    }

    try {
      await userService.assignUserLicense(
       valueObj.source,
        orderInfo.membership.id,
        valueObj.quantity,
        valueObj.userId,
        valueObj.dbId,
        keyObj.orderId,
      );  
    } catch (error) {
      logger.error(`event-handlers.user.assignUserLicense.catch: ${error}`);      
    }    
  }
}

export default new UserEventHandler();