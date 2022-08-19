import {
  Context,
  ICartWatcherData,
  ICartTransactionsReportHeaderResponse,
  ICartTransactionsReportDetail,
  EPermissions,
  ITransaction,
  IUser,
  ICompanyAppData,
  
} from '../types';
import ResolverBase from '../common/Resolver-Base';
import { cartService } from '../services';
import { addMinutes } from 'date-fns';
import { CartStatus, ICartAddressResponse, TGetCartAddressSource } from '../types/ICartAddress';
//const { decycle } = require('../utils/cycle.js');

import {LeanDocument} from 'mongoose';

import addressRequestModel, {
  ICartAddressRequest,
} from '../models/cart-address-requests';
import { User  as UserModel } from 'src/models';
import CartProductModel, {ICartProduct} from 'src/models/cart-products';
import { CartService as WPCartService, MemprTxOrders } from 'src/blockchain-listeners/cart-service';
import CartTransaction, { ICartTransaction } from '../models/cart-transaction';
import { logger } from '../common';
import { cartQueue } from '../blockchain-listeners/cart-queue';
import { CryptoFavorites, UserApi } from 'src/data-sources';
import { TxSendResponse } from 'src/types/ITransaction';

class Resolvers extends ResolverBase {
  private wpCartService = new WPCartService();
  auditAddressRequest = async (
    request: ICartAddressRequest,
  ): Promise<{ success: boolean; message?: string }> => {
    const addressRequest = new addressRequestModel();
    addressRequest.source = request.source;
    addressRequest.userId = request.userId ?? '';
    addressRequest.coinSymbol = request.coinSymbol ?? '';
    addressRequest.amountUsd = request.amountUsd ?? '';
    addressRequest.amountCrypto = request.amountCrypto ?? '';
    addressRequest.quantity = request.quantity;
    addressRequest.affiliateId = request.affiliateId ?? '';
    addressRequest.affiliateSessionId = request.affiliateSessionId ?? '';
    addressRequest.utmVariables = request.utmVariables ?? '';
    addressRequest.addresses = request.addresses;
    addressRequest.orderId = request.orderId;
    addressRequest.created = new Date();
    addressRequest.expires = request.expires;
    addressRequest.nodeLicenseType = request.nodeLicenseType;

    try {
      const savedRequest = await addressRequest.save();
      if (!savedRequest) throw new Error('AddressRequest not saved in DB');
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
    return {
      success: true,
    };
  };

  getCartAddress = async (
    _parent: any,
    args: {
      source: TGetCartAddressSource;
      coinSymbol: string;
      orderId: string;
      amount?: string;
      amountUsd?: string;
      quantity: number;
      affiliateId: string;
      affiliateSessionId: string;
      utmVariables: string;
      nodeLicenseType?: string;
      productId?: string; 
      productName?: string; 
    },
    { wallet, user, dataSources: { cryptoFavorites } }: Context,
  ) => {
    
    this.requireAuth(user);   
    const { userId } = user;  

    const {
      source,
      coinSymbol,
      orderId,
      affiliateId,
      affiliateSessionId,
      utmVariables,
      nodeLicenseType,
      productId,
      productName,
    } = args; 

    try {      
      const meprTxData = await this.getMeprTxData(source,orderId);
      const companyAppData = await this.getCompanyAppData(user,productId,productName);    
      const usdCostFromDB = await this.getUSDCostDB(source,meprTxData,companyAppData);
      const {quantity,amountUsd, amountCrypto } = await this.normalizePricing(usdCostFromDB, args.quantity, coinSymbol, cryptoFavorites);
      const currTime = new Date();      
      const expDate = addMinutes(currTime, 90);
    
      const walletApi = wallet.coin(coinSymbol);
      const address = await walletApi.getCartAddress(
        coinSymbol,
        orderId,
        amountCrypto.toString(),
      );

      const data: ICartWatcherData = {
        source,
        address: address.address,
        exp: expDate,
        affiliateId,
        affiliateSessionId,
        utmVariables,
        status: 'pending',
        crytoAmount: amountCrypto,
        crytoAmountRemaining: amountCrypto,
        usdAmount: amountUsd,
        quantity,
        nodeLicenseType,
        userId,
        companyAppTxData:JSON.stringify(companyAppData),
        meprTxData:meprTxData,
      };
      
      const { keyToAdd, valueToAdd } = await cartQueue.setCartWatcher(
        coinSymbol.toUpperCase(),
        orderId,
        data,        
      );

      const addressResponse: ICartAddressResponse = {
        cartAddress: address,
        pricing: {
          quantity,
          amountUsd: valueToAdd.usdAmount,
          amountCrypto: valueToAdd.crytoAmount,
        },
        nodeLicenseType,
      };

      const auditAddressResult = await this.auditAddressRequest({
        source,
        userId,
        coinSymbol,
        orderId,
        amountUsd: `${valueToAdd.usdAmount}`,
        amountCrypto: `${valueToAdd.crytoAmount}`,
        affiliateId,
        affiliateSessionId,
        utmVariables,
        addresses: [address],
        created: new Date(),
        expires: expDate,
        quantity,
        nodeLicenseType,
      });
      
      if (!auditAddressResult.success)
        logger.warn(
          `cart.auditAddressRequest, Error:${auditAddressResult.message}`,
        );

      return addressResponse;
    } catch (error) {     
      error.stack = "";      
      throw error;
    }
  };

private async getMeprTxData(source:TGetCartAddressSource,orderId:string):Promise<string|undefined>{
    if (source!=='core'){
      const wpResponse = await this.wpCartService.getOrdersFromMeprCart(orderId);    
      const  meprTxData = wpResponse?.['tx-json'];
      if (!meprTxData){
        throw new Error("Unable to acquire order data");
      }else{
        return meprTxData; 
      }
    }
}

private async getCompanyAppData(user:UserApi,productId:string,productName:string):Promise<ICompanyAppData>{
  let userDoc: LeanDocument<IUser & { _id: any;}>;
  try {
    userDoc = await UserModel.findById(user.userId,{email:1, firsName:1,lastName:1}).lean().exec();    
  } catch (error) {
    throw new Error("Unable to get user information - server error");
  }

  if (!userDoc){
    throw new Error("Unable to get user information - unexpected error");
  }

  return {
    member: {
      display_name: `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim(),
      email: userDoc.email,
    },
    membership: {
      id: productId,
      title: productName,
    },
  };
}

private async getUSDCostDB(source:TGetCartAddressSource, meprTxData:string, companyAppData:ICompanyAppData):Promise<number>{
  let filter:{[key:string]:any};
  if (source === 'core'){
    filter = {meprId:companyAppData.membership.id};
  } else {
    const meprTxDataObj = JSON.parse(meprTxData);
    filter = {meprId:parseInt(meprTxDataObj.membership.id)};
  }
  let cartDocument:LeanDocument<ICartProduct & { _id: any;}>
  try {
     cartDocument = await CartProductModel.findOne(filter,{costUpfront:1}).lean().exec();
  } catch (error) {
    throw new Error("Unable to get product price - server error");
  }

  if (!cartDocument.costUpfront){
    throw new Error("Unable to get product price");
  }
  
  return cartDocument.costUpfront;
};

private async normalizePricing(amountUsd:number, quantity:number, coinSymbol:string, cryptoFavorites:CryptoFavorites){    
    const upperCoinSymbol = coinSymbol.toUpperCase();
    if (!["ETH","BTC"].includes(upperCoinSymbol)){
      throw new Error(`${upperCoinSymbol} symbol not supported`);
    }

    let normalizedAmountCrypto:number;
    let normalizedAmountUsd = amountUsd;
    
    if (normalizedAmountUsd <= 0){
      throw new Error("amount is required");
    }
  
    let normalizedQuantity = quantity;
    if (normalizedQuantity < 1 ) normalizedQuantity = 1;
  
    let conversionAmount = 0;
    if (upperCoinSymbol === 'ETH') {
      conversionAmount = await cryptoFavorites.getEthUsdPrice();
    } else if (upperCoinSymbol === 'BTC') {
      conversionAmount = await cryptoFavorites.getBtcUsdPrice();
    }
    
    //amountCrypto and amounUsd, are dependents, so
    //amountCrypto will be calculated in base of amountUsd.    
    normalizedAmountUsd = normalizedAmountUsd * normalizedQuantity;    
    normalizedAmountCrypto = normalizedAmountUsd / conversionAmount;   
  
    return {
      quantity:normalizedQuantity,
      amountCrypto: normalizedAmountCrypto,
      amountUsd: normalizedAmountUsd, 
    }
}

  getCartOrderStatus = async (
    parent: any,
    args: {
      orderId: string;
      orderType: string;
      coinSymbol: string;
    },
    ctx: Context,
  ) => {
    const { orderId, orderType, coinSymbol } = args;

    let modifiedOrderId: string = orderId; //TODO : remove this when wordpress stops adding 'mepr.38' as it's id.
    if (orderType.toUpperCase() === 'MEPR') {
      modifiedOrderId = `mepr.${orderId}`;
    }

    try {      
      const transaction: ICartWatcherData = await cartQueue.getTransaction(
        coinSymbol.toUpperCase(),
        modifiedOrderId,
      );

      const transactionExpiresDate = new Date(transaction.exp);
      return {
        success: '1',
        message: 'Found Transaction',
        status: transaction.status,
        expires: `${transactionExpiresDate.getTime()}`,
        amtToPayUSD: `${transaction.usdAmount}`,
        amtToPayCrypto: `${transaction.crytoAmount}`,
        amtToPayRemaining: `${transaction.crytoAmountRemaining}`,
      };
    } catch (err) {
      logger.exceptionContext(err, 'getCartOrderStatus : failed resolver', {
        orderId,
        orderType,
        coinSymbol,
      });
    }
    return {
      success: '0',
      message: 'Could not find transaction',
      status: CartStatus[CartStatus.expired], //TODO : if someone loses internet for 5 hrs, they will come here and it will send expired even if their payment went through
      expires: `1`,
      amtToPayUSD: `0`,
      amtToPayCrypto: `0`,
      amtToPayRemaining: `0`,
    };
  };

  getAllCartAddressRequests = async (
    _parent: any,
    _args: {},
    ctx: Context,
  ): Promise<ICartAddressRequest[]> => {
    const { user } = ctx;
    this.requireAuth(user);
    let allAddresses: ICartAddressRequest[];
    try {
      allAddresses = await addressRequestModel.find({}).exec();
    } catch (error) {
      logger.warn(`cart.getAllCartAddressRequests ${error}`);
      throw error;
    }
    return allAddresses;
  };

  //TODO: move the next region to its own file.
  //#region "transactions"
  getAllCartTransactions = async (
    parent: any,
    args: {},
    ctx: Context,
  ): Promise<ICartTransaction[]> => {
    const { user } = ctx;
    this.requireAdmin(user);
    let allTransactions: ICartTransaction[];
    try {
      allTransactions = await CartTransaction.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "id",
            as: 'user',
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },
        { $addFields: { email: "$user.email" } },
      ]);
    } catch (error) {
      logger.warn(`cart.getAllCartTransactions ${error}`);
      throw error;
    }
    return allTransactions;
  };

  getUserCartTransactions = async (
    parent: any,
    args: {
      productIds: string[];
    },
    ctx: Context,
  ): Promise<ICartTransaction[]> => {
    const { user } = ctx;
    this.requireAuth(user);

    try {
      //find user's email address by searching by user.userId
      const userId = user.userId

      let result;
      let matchCondition;
      if (!args.productIds || args.productIds.length === 0) {
        matchCondition = {
          userId,
        }
      } else if (args.productIds) {
        matchCondition = {
          userId,
          productId: { 
            $in: args.productIds,
          },
        }
      }

      result = await CartTransaction.aggregate([
        {
          $match: matchCondition,
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "id",
            as: 'user',
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },
        { $addFields: { email: "$user.email" } },
      ]);

      return result;
    } catch (error) {
      logger.warn(`cart.getUserCartTransactions ${error}`);
      throw error;
    }
  };

  getCartTransactionsHeaderReport = async (
    parent: any,
    args: { startDate: Date; endDate: Date },
    ctx: Context,
  ): Promise<ICartTransactionsReportHeaderResponse> => {
    const { user } = ctx;
    this.requirePermissionOrAdmin(user, EPermissions.CLIMB_VIEW_ACCOUNTING);
    let cartTransactionsReport: ICartTransactionsReportHeaderResponse;
    const { startDate, endDate } = args;
    try {
      cartTransactionsReport = await cartService.getAllCartTransactionsHeaderReport(
        startDate,
        endDate,
      );
    } catch (error) {
      logger.warn(`cart.getCartTransactionsHeaderReport ${error}`);
      throw error;
    }
    return cartTransactionsReport;
  };

  getCartTransactionsDetailReport = async (
    parent: any,
    args: { startDate: Date; endDate: Date },
    ctx: Context,
  ): Promise<ICartTransactionsReportDetail[]> => {
    const { user } = ctx;
    this.requirePermissionOrAdmin(user, EPermissions.CLIMB_VIEW_ACCOUNTING);
    let cartTransactionsReportDetail: ICartTransactionsReportDetail[];
    const { startDate, endDate } = args;
    try {
      cartTransactionsReportDetail = await cartService.getAllCartTransactionsDetailReport(
        startDate,
        endDate,
      );
    } catch (error) {
      logger.warn(`cart.getCartTransactionsDetailReport ${error}`);
      throw error;
    }
    return cartTransactionsReportDetail;
  };

  sendCartTransaction = async (
    parent: any,
    args: {
      source: TGetCartAddressSource;
      walletPassword: string;
      coinSymbol: string; 
      orderId: string;  
      amount?: string;  
      amountUsd?: string; 
      quantity: number; 
      affiliateId?: string; 
      affiliateSessionId?: string; 
      utmVariables?: string; 
      nodeLicenseType?: string; 
      productId?: string;
      productName?: string;
    },
    ctx: Context,
  ) => {
    const { user, wallet } = ctx;
    this.requireAuth(user);
    const {    
      source,
      walletPassword,
      coinSymbol,
      orderId,
      amount,
      amountUsd,
      quantity,
      affiliateSessionId,
      affiliateId,
      utmVariables,
      nodeLicenseType,
      productId,
      productName,   
    } = args;

    const walletApi = wallet.coin(coinSymbol);

    const correctPassword = await walletApi.checkPassword(user,walletPassword);
     if (!correctPassword) {
      return {
        success:false,
        message:"Incorrect password",
      }
    }  
    const addressResponse = await this.getCartAddress(
      parent,
      {
        source,
        coinSymbol,
        orderId,
        amount,
        amountUsd,
        quantity,
        affiliateId,
        affiliateSessionId,
        utmVariables,
        nodeLicenseType,
        productId,
        productName,
      },
      ctx,
    );

    const addressToSend = addressResponse.cartAddress.address;
    const amountToSend = addressResponse.pricing.amountCrypto;

    let sendResult:{success: boolean; message?: string; transaction?: ITransaction; };

    try {
      sendResult = await walletApi.send(
        user,
        [{ to: addressToSend,amount:amountToSend.toString() }],
        walletPassword,
      );        
    } catch (error) {
       return {
          success:false,
          message:"Unable to send, unknown error",
       }
    }
    return sendResult;        
  };
  //#endregion transactions

  submitPayment = async (
    parent: any,
    args: {
      walletPassword: string;
      coinSymbol: string; 
      orderId: string;
    },
    ctx: Context,
  ): Promise<TxSendResponse>  => {
    const { user, wallet } = ctx;
    const {
      walletPassword,
      coinSymbol,
      orderId,
    } = args;

    this.requireAuth(user);

    // Validate password
    const walletApi = wallet.coin(coinSymbol);
    const correctPassword = await walletApi.checkPassword(user,walletPassword);
     if (!correctPassword) {
      return {
        success: false,
        message: "Incorrect password",
      };
    }
    try {
      const orderTransaction = await cartQueue.getTransaction(coinSymbol, orderId);
      const addressToSend = orderTransaction.address;
      const amountToSend = orderTransaction.crytoAmountRemaining;

      const allowedStatuses = [CartStatus[CartStatus.pending], CartStatus[CartStatus.insufficient]];
      if (!allowedStatuses.includes(orderTransaction.status)) {
        return {
          success: false,
          message: "Unable to send transaction. Order status: " + orderTransaction.status,
        };
      }
      const sendResult = await walletApi.send(
        user,
        [{ to: addressToSend,amount:amountToSend.toString() }],
        walletPassword,
      );

      return sendResult;
    } catch (error) {
      logger.warn(`cart.submitPayment ${error}`);
      return {
        success: false,
        message: "Unable to submit payment",
      };
    }
  }
}

const resolvers = new Resolvers();

export default {
  Query: {
    getCartOrderStatus: resolvers.getCartOrderStatus,
    getAllCartAddressRequests: resolvers.getAllCartAddressRequests,
    getAllCartTransactions: resolvers.getAllCartTransactions,
    getUserCartTransactions: resolvers.getUserCartTransactions,
    getCartTransactionsHeaderReport: resolvers.getCartTransactionsHeaderReport,
    getCartTransactionsDetailReport: resolvers.getCartTransactionsDetailReport,
  },
  Mutation: {
    getCartAddress: resolvers.getCartAddress,
    sendCartTransaction: resolvers.sendCartTransaction,
    submitPayment: resolvers.submitPayment,
  },
};
