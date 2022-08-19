import ResolverBase from '../common/Resolver-Base';
import { config, configAws, logger } from '../common';
import {
  IPaywiserReferenceNumberResponse,
  IPaywiserReferenceNumberRequest,
  IPaywiserCheckReferenceNumberResponse,
  IPaywiserGetPersonAddressResponse,
  Context,
  IPaywiserBuyCryptoRequest,
  IPaywiserTransaction,
  EPaywiserTransactionTypes,
  IPaywiserConfirmBuyCryptoRequest,
  IPaywiserSellCryptoRequest,
  IPaywiserConfirmSellCryptoRequest,
  IPaywiserGetSpotPriceRequest,
  EPaywiserTransactionStatus,
  IPaywiserBuyCryptoResponse,
  IPaywiserCheckReferenceNumberRequest,
  IPaywiserGetPersonAddressRequest,
  EPaywiserConstants,
  IPaywiserIbanNotification,
  IPaywiserUserNotification,
  ICreateIbanResponse,
  ICreateIbanRequest,
  IPaywiserGetSymbolsResponse,
  IPaywiserSendOtpRequest,
  IPaywiserSendOtpResponse,
  IPaywiserCheckOtpRequest,
  PaywiserAuth,
} from 'src/types';
import { paywiser as paywiserService } from '../services/paywiser';
import { userService } from '../services/user';
import { withFilter, ApolloError } from 'apollo-server-express';
import { UserPaywiserModel, IUserPaywiser, User, UserIban, IbanStatus } from '../models';

import paywiserTransactionPileline from '../pipelines/getOne_paywiser_transaction';
import { countryPhoneCodes } from 'src/utils';
import { v4 as uuidv4 } from 'uuid';

class Resolvers extends ResolverBase {

  public getOtp = async (_parent: any, _args: {}, ctx: Context) => {
    const { user } = ctx;
    this.requireAuth(user);

    let result: IPaywiserSendOtpResponse;
    try {
      const userDbObject = await User.findOne(
        { id: user.userId },
        { email: 1, phone: 1, _id: 0 },
      )
        .lean()
        .exec();

      const req: IPaywiserSendOtpRequest = {
        ClientID: "Switch app",
        ClientDescription: "Switch app",
        UserTypeID: PaywiserAuth.AUTH_USER_TYPE_ID, // as defined in the documentation,
        AccessTokenTypeID: PaywiserAuth.AUTH_ACCESS_TOKEN_TYPE_ID, // as defined in the documentation
        MSISDN: userDbObject.phone
          .replace('(', '')
          .replace(')', '')
          .replace(' ', '')
          .replace('-', '')
          .replace('-', '')
          .trim(),
      };
      result = await paywiserService.sendOtp(req);

      if (result.StatusCode !== EPaywiserConstants.PAYWISER_STATUSCODE_OK) {
        throw new Error(
          `Paywiser statusCode error, StatusDescription: ${result.StatusDescription}`,
        );
      }

      return result.OTPID;
    } catch (err) {
      logger.error(`resolvers.getOtp.catch: ${err}`);
      throw Error("Could not obtain OTP")
    }
  };

  public checkOTP = async (_parent: any, args: { otpInput: { otpId: string, otp: string } }, ctx: Context) => {
    const { user } = ctx;
    this.requireAuth(user);

    try {

      const request: IPaywiserCheckOtpRequest = {
        OTPID: args.otpInput.otpId,
        OTP: args.otpInput.otp,
      };
      const result = await paywiserService.checkOtp(request);

      if (result.StatusCode !== EPaywiserConstants.PAYWISER_STATUSCODE_OK) {
        throw new Error(
          `Paywiser statusCode error, StatusDescription: ${result.StatusDescription}`,
        );
      }

      return result.AccessToken;
    } catch (err) {
      logger.error(`resolvers.checkOtp.catch: ${err}`);
    }
  };

  public getReferenceNumber = async (_parent: any, _args: {}, ctx: Context) => {
    const { user } = ctx;
    this.requireAuth(user);

    let result: IPaywiserReferenceNumberResponse;
    try {
      const userDbObject = await User.findOne(
        { id: user.userId },
        { countryPhoneCode: 1, email: 1, phone: 1, _id: 0 },
      )
        .lean()
        .exec();

      const req: IPaywiserReferenceNumberRequest = {
        MobileNumber: userDbObject.phone
          .replace('(', '')
          .replace(')', '')
          .replace(' ', '')
          .replace('-', '')
          .replace('-', '')
          .trim(),
        Email: userDbObject.email,
        AddressChanged: false,
        DocumentChanged: false,
        ReferenceID: uuidv4(), //a unique number for the call. //user.userId // userPaywiser.kyc.referenceId,
        IbanTypeID: '',
      };
      result = await paywiserService.getReferenceNumber(req);

      if (result.StatusCode !== EPaywiserConstants.PAYWISER_STATUSCODE_OK) {
        throw new Error(
          `Paywiser statusCode error, StatusDescription:${result.StatusDescription}`,
        );
      }

      await paywiserService.createOrUpdateUser(user.userId, result.ReferenceNumber);
      return { referenceNumber: result.ReferenceNumber };
    } catch (err) {
      logger.error(`resolvers.getReferenceNumber.catch: ${err}`);
    }
  };

  public checkReferenceNumber = async (parent: any, args: {}, ctx: Context) => {
    const { user } = ctx;
    this.requireAuth(user);
    try {
      const userPaywiser = await UserPaywiserModel.findOne(
        { userId: user.userId },
        { 'kyc.referenceNumber': 1, _id: 0 }
      )
        .lean()
        .exec();
      const affiliateId = await userService.getAffiliateIdByUserId(user.userId);
      const req: IPaywiserCheckReferenceNumberRequest = {
        ReferenceNumber: userPaywiser.kyc.referenceNumber,
        ReferenceID: uuidv4(),
      };

      const result: IPaywiserCheckReferenceNumberResponse = await paywiserService.checkReferenceNumber(
        req,
      );

      const returnResponse = {
        statusCode: result.StatusCode,
        statusDescription: result.StatusDescription,
        assignedDateTime: result.AssignedDateTime,
        referenceNumberStatus: result.ReferenceNumberStatus,
        personId: result.PersonID,
        kycId: result.KycID,
        kycStart: result.KycStart,
        kycEnd: result.KycEnd,
        kycStatus: result.KycStatus,
        verificationEnd: result.VerificationEnd,
        verificationStatus: result.VerificationStatus,
        additionalData: result.AdditionalData,
        referenceId: result.ReferenceID,
        callerReferenceId: result.CallerReferenceID,
      }

      return returnResponse;
    } catch (err) {
      logger.error(`resolvers.checkReferenceNumber.catch: ${err}`);
    }
  };

  public getPersonAddress = async (parent: any, args: {}, ctx: Context) => {
    const { user } = ctx;
    this.requireAuth(user);

    try {
      const userPaywiser = await UserPaywiserModel.findOne(
        { userId: user.userId },
        { 'kyc.personId': 1, 'kyc.kycId': 1, _id: 0 },
      )
        .lean()
        .exec();

      const req: IPaywiserGetPersonAddressRequest = {
        PersonID: userPaywiser.kyc.personId,
        KycID: userPaywiser.kyc.kycId,
        ReferenceID: uuidv4(),
      };
      const result: IPaywiserGetPersonAddressResponse = await paywiserService.getPersonAddress(
        req,
      );

      const returnResponse = {
        statusCode: result.StatusCode,
        statusDescription: result.StatusDescription,
        address: {
          firstName: result.Address.FirstName,
          middleName: result.Address.MiddleName,
          lastName: result.Address.LastName,
          address1: result.Address.Address1,
          address2: result.Address.Address2,
          address3: result.Address.Address3,
          zipCode: result.Address.ZipCode,
          city: result.Address.City,
          state: result.Address.State,
          countryCode: result.Address.CountryCode,
          countryName: result.Address.CountryName,
          mobileNumber: result.Address.MobileNumber,
          email: result.Address.Email,
          verificationDateTime: result.Address.VerificationDateTime,
          verificationStatus: result.Address.VerificationStatus,
          verificationRejectReason: result.Address.VerificationRejectReason,
        },
        referenceID: result.ReferenceID,
        callerReferenceID: result.CallerReferenceID,
      };

      try {
        const updateOneResponse = await user.update({
          $set: {
            street: result.Address.Address1,
            zipCode: result.Address.ZipCode,
            city: result.Address.City,
            state: result.Address.State,
            countryPhoneCode: countryPhoneCodes[result.Address.CountryCode],
            phone: result.Address.MobileNumber,
          },
        });
      } catch (error) {
        logger.error(
          `resolvers.paysiser.buyCrypto.UserPaywiserModel.updateOne : ${error.message}`,
        );
        throw new Error(
          'Server error on comunication with DB, no transaction stored',
        );
      }

      return returnResponse;
    } catch (err) {
      logger.error(`resolvers.getPersonAddress.catch: ${err}`);
    }
  };

  public getSpotPrice = async (
    parent: any,
    args: {
      args: {
        symbolFrom: string;
        symbolTo: string;
        amount: string;
      };
    },
    { user, wallet }: Context,
  ) => {
    this.requireAuth(user);
    try {
      const { symbolFrom, symbolTo, amount } = args.args;

      const symbolFromObject = await paywiserService.getCurrencyObjectBySymbol(symbolFrom);
      if (!symbolFromObject) {
        throw new Error(`Symbol from (${symbolFrom}) is invalid`);
      }
      const symbolToObject = await paywiserService.getCurrencyObjectBySymbol(symbolTo);
      if (!symbolToObject) {
        throw new Error(`Symbol to (${symbolFrom}) is invalid`);
      }

      const scaledAmount = paywiserService.toScaledNumber(amount, symbolFromObject.Decimals)

      const getSpotInfoParams: IPaywiserGetSpotPriceRequest = {
        ReferenceID: uuidv4(),
        SymbolIDFrom: symbolFromObject.ID,
        SymbolIDTo: symbolToObject.ID,
        Amount: scaledAmount,
      };

      const response = await paywiserService.getSpotPrice(getSpotInfoParams);

      if (
        response.StatusCode !==
        EPaywiserConstants.PAYWISER_STATUSCODE_OK
      ) {
        throw new Error(`Code ${response.StatusCode}: ${response.StatusDescription}`);
      }

      // verify that the target currency matches
      if (symbolTo.toUpperCase() !== response.ConversionAmountSymbolCode.toUpperCase()) {
        throw new Error(`The converted currency does not match: ${symbolTo} != ${response.ConversionAmountSymbolCode}`);
      }

      const returnResponse = {
        rate: paywiserService.fromScaledNumber(response.Rate, response.RateDecimals),
        conversionAmount: paywiserService.fromScaledNumber(response.ConversionAmount, response.ConversionAmountDecimals),
        rateDecimals: response.RateDecimals,
        conversionAmountDecimals: response.ConversionAmountDecimals,
        conversionAmountSymbolCode: response.ConversionAmountSymbolCode,
        statusCode: response.StatusCode,
        statusDescription: response.StatusDescription,
        referenceId: response.ReferenceID,
        callerReferenceId: response.CallerReferenceID,
      };

      return returnResponse;
    } catch (error) {
      logger.error(`resolvers.paywiser.getSpotPrice.catch: ${error.stack}`);
      throw error;
    }
  };

  public buyCrypto = async (
    _parent: any,
    args: {
      args: {
        cryptoSymbol: string;
        amount: string;
        fiatSymbol: string;
      };
    },
    { user, wallet }: Context,
  ) => {
    this.requireAuth(user);
    const { cryptoSymbol, amount, fiatSymbol } = args.args;

    const cryptoSymbolObject = await paywiserService.getCurrencyObjectBySymbol(
      cryptoSymbol,
    );
    if (!cryptoSymbolObject)
      throw new Error(
        `cryptoSymbol "${cryptoSymbol}" not allowed or not in paywiser`,
      );

    const fiatSymbolId: string = await paywiserService.getCurrencyIDBySymbol(fiatSymbol);
    if (!fiatSymbolId)
      throw new Error(
        `fiatSymbol "${fiatSymbol}" not allowed or not in paywiser`,
      );

    //we use toScaledNumber() in getSpotPrice, switching to toScaledNumber instead of normalizeAmountDecimals in order to be consistent
    const amountFixed = paywiserService.toScaledNumber(
      amount,
      cryptoSymbolObject.Decimals,
    ).toString();

    const inputToken = wallet.coin(cryptoSymbol);
    const { receiveAddress } = await inputToken.getWalletInfo(user);

    let userPaywiser: IUserPaywiser & any;
    try {
      userPaywiser = await UserPaywiserModel.findOne(
        { userId: user.userId },
        { 'kyc.personId': 1, _id: 0 },
      )
        .lean()
        .exec();
    } catch (error) {
      logger.error(
        `resolvers.paywiser.buyCrypto.UserPaywiserModel.findOne : ${error.message}`,
      );
      throw new Error('Server error on comunication with DB');
    }

    if (!userPaywiser) throw new Error('Paywiser user not found');

    const { personId } = userPaywiser.kyc;
    const buyCryptoParams: IPaywiserBuyCryptoRequest = {
      ReferenceID: uuidv4(),
      PersonID: personId,
      SymbolIDCrypto: cryptoSymbolObject.ID,
      SymbolIDFiat: fiatSymbolId,
      Amount: amountFixed,
      AmountSymbol: EPaywiserConstants.CRYPTO.valueOf(),
      RecipientAddress: receiveAddress,
      //TransactionMemo: 'Buy Crypto for userId ' + user.userId
    };

    let responseBuyCrypto: IPaywiserBuyCryptoResponse;
    try {
      responseBuyCrypto = await paywiserService.BuyCrypto(buyCryptoParams);
    } catch (error) {
      logger.error(
        `resolvers.paysiser.buyCrypto.paywiserService.BuyCrypto : ${error.message}`,
      );
      throw error;
    }

    if (
      responseBuyCrypto.StatusCode !== EPaywiserConstants.PAYWISER_STATUSCODE_OK
    )
      throw new Error(
        `Paywiser statusCode error, StatusDescription:${responseBuyCrypto.StatusDescription}`,
      );

    const cryptoTransaction: IPaywiserTransaction = {
      referenceId: responseBuyCrypto.ReferenceID,
      transactionId: responseBuyCrypto.TransactionID,
      transactionStatus: responseBuyCrypto.TransactionStatus,
      amount: amountFixed,
      cryptoSymbol: cryptoSymbol,
      fiatSymbol: fiatSymbol,
      depositAddress: receiveAddress, //TODO, define wich one is the deposit address.
      depositMemo: '',
      type: EPaywiserTransactionTypes.BUY,
      convertedAmount: responseBuyCrypto.Amount,
      endAmount: '',
      rateDecimals: responseBuyCrypto.RateDecimals,
      rate: responseBuyCrypto.Rate,
      validTo: responseBuyCrypto.ValidTo,
    };

    let updateOneResponse: { modifiedCount: number };
    try {
      updateOneResponse = await UserPaywiserModel.updateOne(
        {
          userId: user.userId,
          cryptoTransactions: {
            $not: {
              $elemMatch: { transactionId: cryptoTransaction.transactionId },
            },
          },
        },
        {
          $push: {
            cryptoTransactions: cryptoTransaction,
          },
        },
      ).exec();
    } catch (error) {
      logger.error(
        `resolvers.paysiser.buyCrypto.UserPaywiserModel.updateOne : ${error.message}`,
      );
      throw new Error(
        'Server error on comunication with DB, no transaction stored',
      );
    }

    if (updateOneResponse.modifiedCount < 1 || !updateOneResponse.modifiedCount)
      throw new Error(
        'Transaction not stored, paywiser user not found, or duplicated transaction',
      );

    return {
      validTo: responseBuyCrypto.ValidTo,
      transactionId: responseBuyCrypto.TransactionID,
      transactionStatusDescription: responseBuyCrypto.TransactionStatusDescription,
      amount: responseBuyCrypto.Amount,
      amountDecimals: responseBuyCrypto.AmountDecimals,
      amountSymbolCode: responseBuyCrypto.AmountSymbolCode,
      rate: responseBuyCrypto.Rate,
      rateDecimals: responseBuyCrypto.RateDecimals,
      requestedAmount: responseBuyCrypto.RequestedAmount,
      requestedAmountDecimals: responseBuyCrypto.RequestedAmountDecimals,
      requestedAmountSymbolCode: responseBuyCrypto.RequestedAmountSymbolCode,
      feeAmount: responseBuyCrypto.FeeAmount,
      feeAmountDecimals: responseBuyCrypto.FeeAmountDecimals,
      feeAmountSymbolCode: responseBuyCrypto.FeeAmountSymbolCode,
      statusDescription: responseBuyCrypto.StatusDescription,
    };
  };

  public confirmBuyCrypto = async (
    _parent: any,
    args: {
      args: {
        transactionId: string;
      };
    },
    { user }: Context,
  ) => {
    this.requireAuth(user);
    const { transactionId } = args.args;

    try {
      const usersWithTransaction = await UserPaywiserModel.aggregate<{
        cryptoTransactions: IPaywiserTransaction;
      }>(paywiserTransactionPileline(user.userId, transactionId));

      if (usersWithTransaction.length === 0) {
        throw new Error('Transaction ' + transactionId + ' not found');
      }

      const transactionToConfirm: IPaywiserTransaction =
        usersWithTransaction[0].cryptoTransactions;

      if (
        transactionToConfirm.transactionStatus ===
        EPaywiserTransactionStatus.CONFIRMED
      ) {
        throw new Error('Transaction ' + transactionId + ' already confirmed');
      }
      const confirmBuyCryptoParams: IPaywiserConfirmBuyCryptoRequest = {
        ReferenceID: uuidv4(),
        TransactionID: transactionToConfirm.transactionId,
      };

      const responseConfirmBuyCrypto = await paywiserService.ConfirmBuyCrypto(
        confirmBuyCryptoParams,
      );
      if (
        responseConfirmBuyCrypto.StatusCode !==
        EPaywiserConstants.PAYWISER_STATUSCODE_OK
      )
        throw new Error(
          `Paywiser statusCode error, StatusDescription:${responseConfirmBuyCrypto.StatusDescription}`,
        );

      const updateOneResponse = await UserPaywiserModel.updateOne(
        {
          userId: user.userId,
          'cryptoTransactions.transactionId': transactionId,
        },
        {
          $set: {
            'cryptoTransactions.$.transactionStatus':
              responseConfirmBuyCrypto.TransactionStatus,
          },
        },
      );

      if (updateOneResponse.modifiedCount === 0) {
        throw new Error('No transaction updated');
      }
      return {
        referenceId: responseConfirmBuyCrypto.ReferenceID,
        transactionId,
        transactionStatus: responseConfirmBuyCrypto.TransactionStatus,
        transactionStatusDescription:
          responseConfirmBuyCrypto.TransactionStatusDescription,
        confirmAt: new Date(),
      };
    } catch (error) {
      logger.error(`resolvers.confirmBuyCrypto.catch: ${error.stack}`);
      throw error;
    }
  };

  public sellCrypto = async (
    _parent: any,
    args: {
      args: {
        cryptoSymbol: string;
        cryptoAmount: string;
        paywiserIbanId: string;
      };
    },
    { user }: Context,
  ) => {
    this.requireAuth(user);
    try {
      const { cryptoSymbol, cryptoAmount, paywiserIbanId } = args.args;

      const cryptoSymbolObject = await paywiserService.getCurrencyObjectBySymbol(cryptoSymbol);
      if (!cryptoSymbolObject)
        throw new Error(`cryptoSymbol "${cryptoSymbol}" not allowed or not in paywiser`);

      const scaledAmount = paywiserService.toScaledNumber(cryptoAmount, cryptoSymbolObject.Decimals);

      const userPaywiser = await UserPaywiserModel.findOne(
        { userId: user.userId },
        { 'kyc.personId': 1, _id: 0 },
      )
        .lean()
        .exec();
      if (!userPaywiser) {
        throw new Error('Paywiser User not found');
      }

      // find IBAN details
      const userIban = await UserIban.findOne(
        { userId: user.userId } 
      )
        .lean()
        .exec();
  
      if (!userIban || !userIban.iban || !userIban.iban.paywiserIbanId || userIban.iban.status !== IbanStatus.Active) {
        throw new Error("User's IBAN not found or is not active")
      }

      // make sure that the IBAN Id matches
      if (userIban.iban.paywiserIbanId !== paywiserIbanId) {
        throw new Error("User's IBAN does not match");
      }

      const fiatSymbolObject = await await paywiserService.getCurrencyObjectBySymbol(userIban.iban.currency);
      if (!fiatSymbolObject)
        throw new Error(
          `fiatSymbol "${userIban.iban.currency}" not allowed or not in paywiser`,
        );


      const sellCryptoRequest: IPaywiserSellCryptoRequest = {
        ReferenceID: uuidv4(),
        SymbolIDCrypto: cryptoSymbolObject.ID,
        SymbolIDFiat: fiatSymbolObject.ID,
        Amount: scaledAmount,
        PersonID: userPaywiser.kyc.personId,
        IbanId: userIban.iban.paywiserIbanId,
        RiskTolerancePercentage: 50000,
      };

      const responseSellCrypto = await paywiserService.SellCrypto(sellCryptoRequest);

      if (responseSellCrypto.StatusCode !== EPaywiserConstants.PAYWISER_STATUSCODE_OK) {
        throw new Error(responseSellCrypto.StatusDescription);
      }

      const cryptoTransaction: IPaywiserTransaction = {
        referenceId: responseSellCrypto.ReferenceID,
        transactionId: responseSellCrypto.TransactionID,
        transactionStatus: responseSellCrypto.TransactionStatus,
        amount: cryptoAmount,
        cryptoSymbol: cryptoSymbol,
        fiatSymbol: userIban.iban.currency,
        depositAddress: responseSellCrypto.DepositAddress,
        depositMemo: responseSellCrypto.DepositMemo,
        type: EPaywiserTransactionTypes.SELL,
        convertedAmount: responseSellCrypto.Amount,
        endAmount: '',
        rateDecimals: responseSellCrypto.RateDecimals,
        rate: responseSellCrypto.Rate,
        validTo: responseSellCrypto.ValidTo,
      };

      const updateOneResponse = await UserPaywiserModel.updateOne(
        {
          userId: user.userId,
          cryptoTransactions: {
            $not: {
              $elemMatch: { transactionId: cryptoTransaction.transactionId },
            },
          },
        },
        {
          $push: {
            cryptoTransactions: cryptoTransaction,
          },
        },
      ).exec();

      if (
        updateOneResponse.modifiedCount < 1 ||
        !updateOneResponse.modifiedCount
      ) {
        throw new Error(
          'Transaction not stored, paywiser user not found, or duplicated transaction',
        );
      }

      // Verify that the conversion was actually to the target currency
      if (userIban.iban.currency.toUpperCase() !== responseSellCrypto.AmountSymbolCode.toUpperCase()) {
        throw new Error('The conversion currency does not match the requested currency');
      }

      const returnResponse = {
        statusCode: responseSellCrypto.StatusCode,
        statusDescription: responseSellCrypto.StatusDescription,
        
        depositAddress: responseSellCrypto.DepositAddress,
        depositMemo: responseSellCrypto.DepositMemo,

        validTo: responseSellCrypto.ValidTo,
        rate: paywiserService.fromScaledNumber(responseSellCrypto.Rate, responseSellCrypto.RateDecimals),
        amount: paywiserService.fromScaledNumber(responseSellCrypto.Amount, responseSellCrypto.AmountDecimals),
        amountSymbolCode: responseSellCrypto.AmountSymbolCode,
      };
      return returnResponse;
    } catch (error) {
      logger.error(
        `resolvers.paywiser.sellCrypto.catch: stack:${error.stack}; message:${error.message}`,
      );
      throw error;
    }
  };

  public confirmSellCrypto = async (
    parent: any,
    args: {
      args: {
        transactionId: string;
        cryptoSymbol: string;
        walletPassword: string;
      };
    },
    { user, wallet }: Context,
  ) => {
    this.requireAuth(user);
  };

  public deleteTransactions = async (
    parent: any,
    args: {
      args: {
        transactionId: string;
      };
    },
    { user }: Context,
  ) => {
    this.requireAuth(user);
    const { transactionId } = args.args;
    try {
      const updateOneResponse = await UserPaywiserModel.updateOne(
        { userId: user.userId },
        { $pull: { cryptoTransaction: { transactionId: transactionId } } },
      );

      if (updateOneResponse.modifiedCount === 0) {
        throw new Error('No transaction deleted');
      }
      return {
        success: true,
        message: 'Transaction Deleted',
      };
    } catch (error) {
      logger.error(`resolvers.deleteTransactions.catch: ${error.stack}`);
      return {
        success: false,
        message: error.message,
      };
    }
  };

  public getUserPaywiser = async (parent: any, args: {}, { user }: Context) => {
    this.requireAuth(user);

    try {
      const userPaywiser = await UserPaywiserModel.findOne({
        userId: user.userId,
      }).exec();

      return userPaywiser;
    } catch (error) {
      logger.error(`resolvers.paywiser.getUserPaywiser.catch: ${error.stack}`);
    }
  };

  public createUser = async (
    parent: any,
    args: {
      args: {
        referenceNumber: string;
      };
    },
    { user, wallet }: Context,
  ) => {
    this.requireAuth(user);
    const { referenceNumber } = args.args;

    try {
      const payWiserUser = {
        kyc: { referenceNumber },
        userId: user.userId,
      };
      await paywiserService.createUserPaywiser(payWiserUser);
    } catch (error) {
      logger.error(
        `resolvers.paywiser.createUserPaywiser.catch: ${error.stack}`,
      );
      return { success: false, message: error.message };
    }
    return { success: true, message: '' };
  };

  public listenForPaywiserNotification = (
    _parent: any,
    _args: any,
    context: any,
  ) => {
    this.requireAuth(context?.user);
    return configAws.pubsub.asyncIterator(['PAYWISER_NOTIFICATION']);
  };

  public getCryptoSymbols = async (
    _parent: any,
    _args: any,
    context: any,
  ): Promise<IPaywiserGetSymbolsResponse[]> => {
    this.requireAuth(context?.user);
    const symbols: IPaywiserGetSymbolsResponse[] = [];

    const cryptoSymbols = await paywiserService.getCryptoSymbols();

    cryptoSymbols.forEach(symbol => {
      symbols.push({
        id: symbol.ID,
        symbol: symbol.Symbol,
        name: symbol.Name,
        isCrypto: symbol.IsCrypto,
        decimals: symbol.Decimals,
        memoRequired: symbol.MemoRequired,
      });
    });

    return symbols;
  };

  public getFiatSymbols = async (
    _parent: any,
    _args: any,
    context: any,
  ): Promise<IPaywiserGetSymbolsResponse[]> => {
    this.requireAuth(context?.user);
    const symbols: IPaywiserGetSymbolsResponse[] = [];

    const fiatSymbols = await paywiserService.getFiatSymbols();

    fiatSymbols.forEach(symbol => {
      symbols.push({
        id: symbol.ID,
        symbol: symbol.Symbol,
        name: symbol.Name,
        isCrypto: symbol.IsCrypto,
        decimals: symbol.Decimals,
        memoRequired: symbol.MemoRequired,
      });
    });

    return symbols;
  };

  public createPersonIban = async (
    parent: any,
    args: {
      args: {
        platinum: boolean;
      };
    },
    { user }: Context,
  ) => {
    this.requireAuth(user);
    const { platinum } = args.args;
    let accountType = configAws.paywiserRegularAccount;
    if (platinum) {
      accountType = configAws.paywiserPlatinumAccount;
    }
    let userPaywiser: IUserPaywiser & any;
    try {
      userPaywiser = await UserPaywiserModel.findOne(
        { userId: user.userId },
        { 'kyc.personId': 1, 'kyc.ibanObject.cardTypeId': 1, _id: 0 },
      )
        .lean()
        .exec();
      const payWiserUser: ICreateIbanRequest = {
        ReferenceID: uuidv4(),
        PersonID: userPaywiser.kyc.personId,
        IbanTypeID: accountType,
        CardTypeID: userPaywiser.kyc.ibanObject.cardTypeId ? userPaywiser.kyc.ibanObject.cardTypeId : await paywiserService.getCardTypeFromUserIbans(user.userId),
      };
      const createIbanResponse: ICreateIbanResponse = await paywiserService.createPaywiserIban(
        payWiserUser.PersonID,
        payWiserUser.IbanTypeID,
        payWiserUser.CardTypeID
      );
      return { 
        statusCode: createIbanResponse.StatusCode, 
        statusDescription: createIbanResponse.StatusDescription,
        referenceId: createIbanResponse.ReferenceID,
        callerReferenceId: createIbanResponse.CallerReferenceID };
    } catch (error) {
      logger.error(
        `resolvers.paywiser.createUserPaywiser.catch: ${error.stack}`,
      );
      return { success: false, message: error.message };
    }
  };
}

const resolvers = new Resolvers();

export default {
  Query: {
    paywiserGetOtp: resolvers.getOtp,
    paywiserCheckOtp: resolvers.checkOTP,
    paywiserCheckReferenceNumber: resolvers.checkReferenceNumber,
    paywiserGetPersonAddress: resolvers.getPersonAddress,
    paywiserGetSpotPrice: resolvers.getSpotPrice,
    paywiserGetCryptoSymbols: resolvers.getCryptoSymbols,
    paywiserGetFiatSymbols: resolvers.getFiatSymbols,
    paywiserGetUserPaywiser: resolvers.getUserPaywiser,
    paywiserGetReferenceNumber: resolvers.getReferenceNumber,
  },

  Mutation: {
    paywiserBuyCrypto: resolvers.buyCrypto,
    paywiserConfirmBuyCrypto: resolvers.confirmBuyCrypto,
    paywiserSellCrypto: resolvers.sellCrypto,
    paywiserConfirmSellCrypto: resolvers.confirmSellCrypto,
    paywiserDeleteTransactions: resolvers.deleteTransactions,
    paywiserCreatePersonIban: resolvers.createPersonIban,
  },

  Subscription: {
    paywiserGetUserNotification: {
      subscribe: withFilter(
        resolvers.listenForPaywiserNotification,
        (
          payload: IPaywiserUserNotification,
          _: any,
          context: any,
          info: any,
        ) => {
          return payload.userId === context.user.userId;
        },
      ),
      resolve: (
        payload: IPaywiserUserNotification,
        args: any,
        context: any,
        info: any,
      ) => {
        return {
          message: payload.message,
          type: payload.type,
          status: payload.status,
        };
      },
    },
  },
};
