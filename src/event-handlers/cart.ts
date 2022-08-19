import { CartService } from 'src/blockchain-listeners/cart-service';
import { logger } from '../common';
import {
  ICartWatcherData,
  CartRedisKey,  
  ICartBalance,  
  CartStatus,
} from '../types';

export class CartEventHandler {
  private cartService = new CartService();
  onOrderStatusSetToComplete(keyObj:CartRedisKey, valueObj:ICartWatcherData, balance:ICartBalance){
    if (valueObj.source !== 'core'){
      try {            
        this.cartService.updateTransactionToMemberpressCart(
          valueObj.address,
          balance.amountUnconfirmed,
          keyObj.symbol,
          keyObj.orderId,
          CartStatus.complete,
        );
      } catch (err) {
        logger.exceptionContext(
          err,
          `PAID, but not updated in WP : ${keyObj.orderId} : ${valueObj.address} : ${balance.amountUnconfirmed}`,
          {},
        );
      }
     }
  }
}

export default new CartEventHandler();