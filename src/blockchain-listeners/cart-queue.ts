import { walletApi } from '../wallet-api';
import { logger, config, configAws } from '../common';
import * as RedLock from 'redlock';
import {
  CartType,
  ICartWatcherData,
  CartRedisKey,
  CartStatus,
  ICartBalance,
  IMailParams,
} from '../types';
import {
  CartTransaction,
  ICartTransaction,
  ICartTransactionDoc,
  UserIban,
  UserIbanStatus,
} from '../models';
import { sendinblueService } from '../data-sources/sendinblue'
const cron = require('node-cron');
const redis = require('redis');
const { promisifyAll } = require('bluebird');
import axios from 'axios';
import { subMinutes } from 'date-fns';
import { userIbanService } from 'src/services/user-iban';
import coreEventHandler from 'src/event-handlers/wallet-server-core';
import cartEventHandler from 'src/event-handlers/cart';
import userEventHandler from 'src/event-handlers/user';

class CartQueue {
  private client: any;
  private cronTask: any;
  private coinsToWatch: string[] = ['BTC', 'ETH', 'GALA', 'GREEN'];
  private redlock: RedLock;
  private LOCK_KEY = `CART_QUEUE_LOCK_${config.brand.toUpperCase()}`;
  private LOCK_KEY_TTL = 25_000;    
  
  constructor(redisInfo: any) {    
    promisifyAll(redis);
    this.client = redis.createClient(redisInfo);

    this.redlock = new RedLock([this.client], { driftFactor: 0.01, retryCount: 0 });

    this.cronTask = cron.schedule('*/30 * * * * *', async () => {
      const lock = await this.acquireLock();
      if (lock) { 
        this.coinsToWatch.forEach(coin => {
          this.lookAtTransactionsBySymbol(coin);
        });
      }
    });

    this.cronTask.start();
  }

  async acquireLock() { 
    let lock: RedLock.Lock | null = null;
    try {
      lock = await this.redlock.lock(this.LOCK_KEY, this.LOCK_KEY_TTL);
      // logger.info('lock acquired to run cart-queue');
      // ^ commented to limit sentry logs - 42k in 90 days
    } catch (e) { 
      if (e instanceof RedLock.LockError) {
        logger.info('failed to acquire lock to run cart-queue');
      } else {
        throw e;
      }
    }
    return lock;
  }

  async setCartWatcher(
    symbol: string,
    orderId: string,
    data: ICartWatcherData,    
  ) {
   const keyToAdd: string = this.formatKey(symbol, orderId);
   const valueToAdd: string = JSON.stringify(data);
    try {
      await this.client.setAsync(keyToAdd, valueToAdd);     
    } catch (error) {
      throw new Error("Unable to create order - server error"); 
    }  
    return { keyToAdd, valueToAdd: data };
  }

  async replaceCartWatcher(key: string, data: ICartWatcherData) {
    const valueToAdd: string = JSON.stringify(data);

    try {
      const result = await this.client.setAsync(key, valueToAdd);
      if (result?.toString() !== 'OK') {
        throw new Error("Unexpected result in replaceCartWatcher")
      }
    } catch(error) {
      logger.error('cart queue replace error');
      
      throw error;
    }
  }

  async getCartWatcher(symbol: string) {
    const brand = config.brand;
    const currTime = new Date();
    const currTimeNative = currTime.valueOf();

    const allKeys = await this.client.keysAsync(`${symbol}.${brand}.*`);
    //const allKeys = await this.client.keysAsync(`*`);

    // console.log('------------------ HOW MANY KEYS?? ---------------')
    // console.log(allKeys);
    // console.log('-/end----------------- HOW MANY KEYS?? ---------------')
    
    let valueObj: ICartWatcherData = undefined;
    let keyObj: CartRedisKey = undefined;
    for (const key of allKeys) {
      try {
        valueObj = await this.getTransactionFromKey(key);
        //console.log('valueObj', valueObj);
        keyObj = this.parseKey(key);
      } catch (er) {
        logger.exceptionContext(
          er,
          'Could not parse the keyObj or valueObj from the REDIS call',
          { key },
        );
      }

      if (!valueObj) {
        logger.criticalContext(`Failed to get valueObj in cartQueue`, { key });
        continue;
      }

      //Skipping other brands
      if (keyObj.brand !== brand) {
        logger.warnContext(
          `Got other brands in our queue, we shouldn't get this`,
          { key },
        );
        continue;
      }

      const thisExp = new Date(valueObj.exp);

      //Purging from REDIS if it has been more than 3.5 hrs
      const threeAndHalfHoursAgo = subMinutes(currTime, 210).valueOf();
      if (thisExp.valueOf() < threeAndHalfHoursAgo) {
        await this.deleteCartWatcher(key);
        continue;
      }

      //Skipping values
      if (
        valueObj.status === CartStatus[CartStatus.complete] ||
        valueObj.status === CartStatus[CartStatus.late]
      ) {
        continue;
      }

      const thisSymbol = keyObj.symbol;

      // Query Blockchain for balance
      const coin = walletApi.coin(thisSymbol);
      const balance: ICartBalance = await coin
        .getCartBalance(thisSymbol, keyObj.orderId, valueObj.address)
        .then(
          a => a,
          er2 => {
            logger.error(
              `FAILED WHEN TRYING TO FIND ${keyObj.orderType
              } CART : ${thisSymbol}/${key.orderId}/${JSON.stringify(
                valueObj,
              )} | error: ${er2}`,
            );
            throw er2;
          },
        );            

      if (!balance) {
        continue;
      }

      if (valueObj.status === CartStatus[CartStatus.expired]) {
       await this.handleExpiredTransactions(valueObj, keyObj, key, balance);
       continue;
      }

      //Check if the object is expired
      if (thisExp.valueOf() < currTimeNative) {
        valueObj.status = CartStatus[CartStatus.expired];
        
        const savingStatus = await this.trySaveData(valueObj, keyObj, key, +balance.amountConfirmed, true);
        if (!savingStatus) {
          continue;
        }
        
        if (brand === 'galvan') {
          if (valueObj.meprTxData) {
            const orderObj = JSON.parse(valueObj.meprTxData);
            //  add them to the list “Abandoned Cart” — ID #31 when transaction is marked as 'expired'
            sendinblueService.addContactList(orderObj.member.email, 31);
          }          
        }
        
        continue;
      }      

      const acceptableBalance = this.computeAcceptableBalance(valueObj.usdAmount,valueObj.crytoAmount,balance.amountConfirmed);      

      if (valueObj.status === CartStatus[CartStatus.confirming]) {
        if (acceptableBalance >= valueObj.crytoAmount) {
          //Update the DB
          valueObj.status = CartStatus[CartStatus.complete];
          valueObj.crytoAmountRemaining = 0;
          
          const savingStatus = await this.trySaveData(valueObj, keyObj, key, +balance.amountConfirmed, false);
          if (!savingStatus) {
            continue;
          }

          this.emitOrderStatusSetToComplete(keyObj, valueObj, balance);

          try {
            if (valueObj.meprTxData) {
              const orderInfo = JSON.parse(valueObj.meprTxData);
              if(brand === 'galvan') {
                // When someone completes a purchase for a product, they need to receive a receipt that has all the details for their purchase
                const mailParams: IMailParams = {
                  transactionNumber: keyObj.orderId,
                  dateAndTIme: orderInfo.created_at ?? '',
                  etherscanLink: valueObj.address,
                  firstName: orderInfo.member?.first_name ?? '',
                  lastName: orderInfo.member?.last_name ?? '',
                  email: orderInfo.member?.email ?? '',
                  productName: orderInfo.membership?.title ?? '',
                  productPrice: orderInfo.total,
                  quantity: valueObj.quantity,
                  amountReceived: balance.amountConfirmed,
                  coinSymbol: keyObj.symbol,
                }

                sendinblueService.sibTransactionalEmail(mailParams);

                // When Someone Makes a Purchase, Automatically Add Them to Certain Email Lists
                if(orderInfo.membership.title === 'Smart Node') {                  
                  // If someone purchases a Galvan Smart Node, add them to the “Smart Node Owners” list — ID #16
                  sendinblueService.addContactList(orderInfo.member.email, 16);                                                     
                  // AND “All Node Owners” list — ID #4
                  sendinblueService.addContactList(orderInfo.member.email, 4);                  
                }

                if(orderInfo.membership.title === 'Lite Node') {                  
                  // If someone purchases a Galvan Lite Node, add them to the “Lite Node Owners” list — ID #17
                  sendinblueService.addContactList(orderInfo.member.email, 17);                                    
                  // AND “All Node Owners” list — ID #4
                  sendinblueService.addContactList(orderInfo.member.email, 4);                  
                }

                if(orderInfo.membership.title === 'One Time Doctor Visit') {                  
                  // If someone purchases a One Time Doctor Visit, add them to the “One Time Telehealth Member” list — ID #19
                  sendinblueService.addContactList(orderInfo.member.email, 19);                  
                }

                if(orderInfo.membership.title === 'One Year Plan' || orderInfo.membership.title === 'Two Year Plan' || orderInfo.membership.title === 'Three Year Plan') {                  
                  // If someone purchases a One Year, Two Year, or Three Year Telehealth Package, add them to the “Yearly Telehealth Member” list - ID #20
                  sendinblueService.addContactList(orderInfo.member.email, 20);
                }                
              }

              try {
                await this.sendGooglePixelConvert(orderInfo);
              } catch (err) {
                logger.exceptionContext(
                  err,
                  `failed to get google pixel to fire ${valueObj} | ${keyObj}`,
                  {},
                );
              }
            }
          } catch (error) {
            logger.exceptionContext(
              error,
              `failed to JSON.parse valueObj.meprTxData ${valueObj} | ${keyObj}`,
              {},
            );
          }          
        }
        continue;
      }

      const acceptableUnconfirmed = this.computeAcceptableBalance(valueObj.usdAmount,valueObj.crytoAmount,balance.amountUnconfirmed);      

      //Check in on insufficient transaction
      if (valueObj.status === CartStatus[CartStatus.insufficient]) {
        if (acceptableUnconfirmed >= valueObj.crytoAmount) {
          //Update the DB
          valueObj.status = CartStatus[CartStatus.confirming];
          valueObj.crytoAmountRemaining = 0;

          await this.trySaveData(valueObj, keyObj, key, +balance.amountUnconfirmed, false);
        }

        continue;
      }

      if (acceptableUnconfirmed >= valueObj.crytoAmount) {
        //Update the DB
        valueObj.status = CartStatus[CartStatus.confirming];
        valueObj.crytoAmountRemaining = 0;

        const savingStatus = await this.trySaveData(valueObj, keyObj, key, +balance.amountUnconfirmed, true);
        if (savingStatus) {
          this.deleteCartWatcherSibling(keyObj);
        }
        continue;
      }

      if (+balance.amountUnconfirmed > 0) {
        //Update the DB
        valueObj.status = CartStatus[CartStatus.insufficient];
        valueObj.crytoAmountRemaining =
          valueObj.crytoAmount - +balance.amountUnconfirmed;

        const savingStatus = await this.trySaveData(valueObj, keyObj, key, +balance.amountUnconfirmed, true);
        if (savingStatus) {
          this.deleteCartWatcherSibling(keyObj);
        }
        continue;
      }

      // if(keyObj.orderType === CartType.woocommerce){
      //   const orderResponse = await service.getOrdersFromWooCart();

      //   for (const order of orderResponse.orders) {
      //     if (order.id === keyObj.orderId) {
      //       for (const meta of order.meta_data) {
      //         if (meta.key === 'currency_amount_to_process') {
      //           const orderExpectedAmount = +meta.value;
      //           if (+balance.amountUnconfirmed >= orderExpectedAmount) {
      //             //Checking the order from WOO. Is our amount > expected amount??
      //             let arryOfItems: string = JSON.stringify(
      //               Object.keys(order.line_items),
      //             );
      //             arryOfItems = arryOfItems.replace(/\s+/g, '');

      //             service.updateOrderToWooCart(
      //               keyObj.orderId,
      //               valueObj.address,
      //               balance.amountUnconfirmed,
      //               symbol,
      //               keyObj.orderId,
      //             );

      //             await this.sendGooglePixelFire(
      //               order.billing.first_name,
      //               arryOfItems,
      //               +order.total,
      //             );

      //             await this.deleteCartWatcherOthercoins(brand, keyObj.orderId);
      //           } else {
      //             //TODO : email the user saying that they didn't send enough
      //             // service.updateOrderToWooCart(    //Partial Payment
      //             //   orderId,
      //             //   valueObj.address,
      //             //   balance.amountUnconfirmed,
      //             //   symbol,
      //             //   orderId,
      //             // );
      //           }
      //         }
      //       }
      //     }
      //   }
      // }
    }
  }

  async handleExpiredTransactions(valueObj: ICartWatcherData, keyObj: CartRedisKey, key:string, balance:ICartBalance ){
    const acceptableBalance = this.computeAcceptableBalance(valueObj.usdAmount, valueObj.crytoAmount, balance.amountConfirmed);
    if (acceptableBalance >= valueObj.crytoAmount) {      
      valueObj.status = CartStatus[CartStatus.late];
      valueObj.crytoAmountRemaining = 0;

      await this.trySaveData(valueObj, keyObj, key, balance.amountConfirmed, false);
    }
  }

  computeAcceptableBalance(usdAmount:number, cryptoAmount:number, balance:number){    
    const cryptoPrice = usdAmount / cryptoAmount;
    let usdBuffer = usdAmount * 0.015;
    if (usdBuffer < 1.5) {
      usdBuffer = 1.5;
    }
    const acceptableBuffer = usdBuffer / cryptoPrice;
    return balance + acceptableBuffer;
  }

  async getRawCartWatcher(key: string) {
    const value = await this.client.getAsync(key);
    return value;
  }

  formatKey(symbol: string, orderId: string): string {
    const brand = config.brand;
    const keyToAdd: string = `${symbol}.${brand}.${orderId}`; //orderId will be mepr.${transactionId} OR ${orderId} (woo)
    return keyToAdd;
  }

  formatCartKey(keyObject: CartRedisKey): string {
    const keyToAdd: string = `${keyObject.symbol}.${keyObject.brand}.${keyObject.orderId}`; //orderId will be mepr.${transactionId} OR ${orderId} (woo)
    return keyToAdd;
  }

  parseKey(cartKey: string): CartRedisKey {
    const keyParts: string[] = cartKey.split('.');

    const result: CartRedisKey = {
      symbol: keyParts[0],
      brand: keyParts[1],
      orderId: keyParts[2],
      orderType: CartType.woocommerce,
    };
    if (keyParts[2].toUpperCase() === 'MEPR') {
      result.orderId = keyParts[3];
      result.orderType = CartType.memberpress;
    }
    return result;
  }

  async saveToDb(
    valueObj: ICartWatcherData,
    keyObj: CartRedisKey,
    //WARNING: Here it is posible a lost of precision due a number is not able to handle lot of decimals.
    amountCryptoReceived: number,
  ): Promise<ICartTransactionDoc> {
    let revenueCrypto: number = 0;
    let revenueUsd: number = 0;
    try {
      const revenues = this.evaluateRevenue(valueObj);
      revenues.map(singleRevenue => {
        if (config.brand === singleRevenue.brand) {
          revenueCrypto = singleRevenue.revenueCrypto;
          revenueUsd = singleRevenue.revenueUsd;
        }
      });

    }
    catch (err) {
      logger.exceptionContext(
        err,
        'blockchain-listeners.cart-queue.saveToDb.revenues.catch',
        {
          revenueCrypto: revenueCrypto.toString(),
          revenueUsd: revenueUsd.toString(),
        },
      );
    }
    try {      

      let orderInfo;
      if (valueObj.source === 'core') {
       orderInfo = JSON.parse(valueObj.companyAppTxData || '{}')
      } else {
        orderInfo = JSON.parse(valueObj.meprTxData || valueObj.companyAppTxData || '{}');
      }      

      const dbItem: ICartTransaction = {
        source:valueObj.source,
        wp_id: keyObj.orderId,
        userId: valueObj.userId,
        status: valueObj.status,
        currency: keyObj.symbol,
        discountAmtUsd: '0',
        totalUsd: valueObj.usdAmount.toString(),
        totalCrypto: valueObj.crytoAmount.toString(),
        totalCryptoReceived: amountCryptoReceived.toString(),
        conversionRate: (valueObj.usdAmount / valueObj.crytoAmount).toString(),
        remainingCrypto: valueObj.crytoAmountRemaining.toString(),
        address: valueObj.address,
        name: orderInfo.member?.display_name ?? '',
        //memberId will need to be updated after
        //orderinfo.member.id is migrated to main object
        memberId: orderInfo.member?.id ?? '',
        data: JSON.stringify(orderInfo),
        created: new Date(),
        redisKey: JSON.stringify(keyObj),
        redisValue: JSON.stringify(valueObj),
        productId: orderInfo.membership?.id ?? '',
        productName: orderInfo.membership?.title ?? '',
        quantity: valueObj.quantity,
        nodeLicenseType: valueObj.nodeLicenseType,
        isCommissionable: true,
        revenueCrypto: revenueCrypto,
        revenueUsd: revenueUsd,
        linkedTransactions: [
          {
            brand: 'otherBrand',
            cartTransactionId: 'placeholder',
          },
        ],
      };

      // TODO : save revenue record(s) in remote DBs

      const previousValue = await CartTransaction.findOne({
        wp_id: keyObj.orderId,
      });
      if (previousValue) {
        previousValue.status = valueObj.status;
        previousValue.totalUsd = valueObj.usdAmount.toString();
        previousValue.totalCrypto = valueObj.crytoAmount.toString();
        if (amountCryptoReceived > 0) {
          previousValue.totalCryptoReceived = amountCryptoReceived.toString();
        }
        previousValue.totalCrypto = valueObj.crytoAmount.toString();

        previousValue.conversionRate = (
          valueObj.usdAmount / valueObj.crytoAmount
        ).toString();
        previousValue.remainingCrypto = valueObj.crytoAmountRemaining.toString();
        previousValue.data = JSON.stringify(orderInfo);
        previousValue.save();
      } else {
        return await CartTransaction.create(dbItem);
      }

      return undefined;
    } catch (ex) {
      logger.exceptionContext(
        ex,
        `!!!Cart-Queue is trying to save update order to the DB.`,
        {
          orderData: JSON.stringify(valueObj),
          key: JSON.stringify(keyObj),
        },
      );

      throw ex;
    }
  }

  evaluateRevenue(value: ICartWatcherData) {
    if (config.brand === 'connect') {
      // TODO : need to lookup cart-products and license-types
      // evaluate how much revenue goes to each brand

      // TODO : loop through each of the cart-product.licenses to see what brands need to go
      return [
        {
          revenueCrypto: value.crytoAmount / 2,
          revenueUsd: value.usdAmount / 2,
          brand: config.brand,
        },
        {
          revenueCrypto: value.crytoAmount / 2,
          revenueUsd: value.usdAmount / 2,
          brand: '',
        },
      ];
    } else {
      return [
        {
          revenueCrypto: value.crytoAmount,
          revenueUsd: value.usdAmount,
          brand: config.brand,
        },
      ];
    }
  }

  async sendGooglePixelConvert(orderInfo: any): Promise<void> {
    try {
      const fname =
        orderInfo && orderInfo['membership']
          ? orderInfo['membership']['first_name']
          : '';
      const title =
        orderInfo && orderInfo['membership']
          ? orderInfo['membership']['title']
          : '';
      await this.sendGooglePixelFire(fname, title, +orderInfo['total']);
    } catch (err) {
      const errorMessage = `sendGooglePixelConvert failed: ${orderInfo} | ${err}`;
      logger.exceptionContext(err, errorMessage, { orderInfo });
    }
  }

  async getTransaction(
    symbol: string,
    orderId: string,
  ): Promise<ICartWatcherData> {
    const key: string = this.formatKey(symbol, orderId);
    return await this.getTransactionFromKey(key);
  }

  async getTransactionFromKey(key: string): Promise<ICartWatcherData> {
    const value: string = await this.getRawCartWatcher(key);
    return JSON.parse(value) as ICartWatcherData;
  }

  async sendGooglePixelFire(
    customerNumber: string,
    product: string,
    price: number,
  ) {
    try {
      let ua = '';
      switch (config.brand) {
        case 'green':
          ua = 'UA-132009155-2';
          break;
        case 'connect':
          ua = 'UA-132009155-8';
          break;
        case 'switch':
          ua = 'UA-132009155-10';
          break;
        case 'blue':
          ua = 'UA-132009155-9';
          break;
        case 'galvan':
            ua = 'UA-132009155-9';
          break;
      }

      const parameters: string = `v=1&tid=${ua}&cid=${customerNumber}&t=event&ec=App&ea=buy_product&el=${product}&ev=${price}`;

      const { data } = await axios.post(
        `www.google-analytics.com/collect`,
        parameters,
      );
    } catch (err) {
      logger.exceptionContext(
        err,
        `cart-queue.sendGooglePixelFire.failedToSendToGoogle`,
        {},
      );
    }
  }

  async getValueAndUpdateAtCart(key: string, symbol: string, client: any) {
    return await this.client.getAsync(key);
  }

  async deleteCartWatcher(key: string) {
    const deleteResult = await this.client.delAsync(key);
    return deleteResult;
  }

  async deleteCartWatcherSibling(myKey: CartRedisKey) {
    const otherCryptoSymbol: string = myKey.symbol === 'ETH' ? 'BTC' : 'ETH';
    const otherCryptoKey: CartRedisKey = {
      brand: myKey.brand,
      orderId: myKey.orderId,
      orderType: myKey.orderType,
      symbol: otherCryptoSymbol,
    };

    await this.deleteCartWatcher(this.formatCartKey(otherCryptoKey));
  }

  async dangerNeverUse() {
    const allKeys = await this.client.keysAsync(`*`);
    for (const key of allKeys) {
      await this.deleteCartWatcher(key);
    }
  }

  async deleteCartWatcherOthercoins(brand: string, orderId: string) {
    //If we are done with 1 coin of the order, delete all the other coin watchers
    //for that order

    const promiseArray: any[] = [];
    this.coinsToWatch.forEach(coin => {
      promiseArray.push(this.client.delAsync(coin));
    });
    return await Promise.all(promiseArray);
  }

  private async lookAtTransactionsBySymbol(symbol: string): Promise<void> {
    await this.getCartWatcher(symbol);
  }

  
  // TODO: replace this pseudo event-handler pattern for a real event-handler pattern using nodejs events.
  // Add all not related cart-queue flow features to this region and eventually to the event handlers.  
  private emitOrderStatusSetToComplete(keyObj:CartRedisKey, valueObj:ICartWatcherData, balance:ICartBalance){
    coreEventHandler.onOrderStatusSetToComplete(keyObj,valueObj,balance) 
    cartEventHandler.onOrderStatusSetToComplete(keyObj,valueObj,balance);
    userEventHandler.onOrderStatusSetToComplete(keyObj,valueObj,balance);
  }

  private async trySaveData(valueObj: ICartWatcherData, keyObj: CartRedisKey, key: string, amount: number, isDbIdUpdate: boolean): Promise<boolean>{
    try {
      const dbCreateRecord = await this.saveToDb(
        valueObj,
        keyObj,
        amount,
      );
      if (isDbIdUpdate) {
        if (dbCreateRecord) {
          valueObj.dbId = dbCreateRecord.id;
        } else {
          valueObj.dbId = 'undefined';
        }
      }

      await this.replaceCartWatcher(key, valueObj);
      return true;
    } catch(error) {
      return false;
    }
  }
}

export const cartQueue = new CartQueue(configAws.redisInfo);
export default cartQueue;