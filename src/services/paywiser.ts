import axios from 'axios';
import {
  IPaywiserReferenceNumberResponse,
  IPaywiserReferenceNumberRequest,
  IPaywiserCheckReferenceNumberRequest,
  IPaywiserCheckReferenceNumberResponse,
  IPaywiserGetPersonAddressRequest,
  IPaywiserGetPersonAddressResponse,
  IPaywiserBuyCryptoRequest,
  IPaywiserGetListSymbolsResponse,
  IPaywiserBuyCryptoResponse,
  IPaywiserConfirmBuyCryptoRequest,
  IPaywiserConfirmBuyCryptoResponse,
  IPaywiserSellCryptoRequest,
  IPaywiserSellCryptoResponse,
  IPaywiserConfirmSellCryptoRequest,
  IPaywiserConfirmSellCryptoResponse,
  IPaywiserGetSpotPriceRequest,
  IPaywiserGetSpotPriceResponse,
  IPaywiserSymbol,
  IPaywiserSymbolObject,
  IPaywiserDocumentResponse,
  IPaywiserDocumentRequest,
  ICreateIbanRequest,
  ICreateIbanResponse,
  IListIbansResponse,
  IListIbansRequest,
  IPaywiserSendOtpRequest,
  IPaywiserSendOtpResponse,
  IPaywiserCheckOtpRequest,
  IPaywiserCheckOtpResponse,
} from '../types';
import { config, configAws, logger } from '../common';
import { countryPhoneCodes, validNumberRegExp } from '../utils';
import { UserPaywiserModel, UserIban, Card } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { ScheduledTask, schedule } from 'node-cron';
import { String } from 'aws-sdk/clients/codebuild';
import { response } from 'express';
import { env } from 'src/common/env';

const POINT = '.';

class PaywiserService {
  private paywiserSymbolMapPopulated = false;
  private paywiserSymbols: IPaywiserSymbol[];

  private getSymbols = async () => {
    if (this.paywiserSymbolMapPopulated) {
      return;
    }
    try {
      const cryptoSymbols = await this.getSymbolsInfo();
      this.paywiserSymbols = cryptoSymbols;
      this.paywiserSymbolMapPopulated = true;
    }
    catch (error) {
      logger.error(
        `services.paywiser.PaywiserService.getSymbols: ${error.message}
        } : ${error.toString()}`,
      );
    }
  };

  /**
   * Convert number as string to a scaled number based on number of decimals
   * @param amount Amount as string, such as 0.12992300000
   * @param decimals The number of decimals for number scaling
   * @returns scaled number 
   */
  public toScaledNumber(amount: string, decimals: number): number {
    // TODO: this code should be adapted and big.js, bignumber.js or similar should be used!
    return Math.round(parseFloat(amount)*Math.pow(10, decimals));
  }

  /**
   * Convert a scaled number to a non-scaled string representation
   * @param amount scaled amount (an integer)
   * @param decimals number of decimals used for number scaling
   */
  public fromScaledNumber(amount: number, decimals: number): string {
    // TODO: this code should be adapted and big.js, bignumber.js or similar should be used!
    return (amount / Math.pow(10, decimals)).toString();
  }

  /**
   * Convert a string number with decimals to number without decimals
   * @param amount the amount with decimals as string (e.g. '123.456')
   * @param decimalPlaces number of decimal places for the crypto currency
   * @returns an integer number (without decimals), converted based on the number of decimal places
   */
  public sendOtp = async (
    req: IPaywiserSendOtpRequest
  ): Promise<IPaywiserSendOtpResponse> => {
    try {
      const url = `${configAws.paywiserAuthHost}/PayWiserSendOTP`;

      const resp: { data: IPaywiserSendOtpResponse } = await axios.post(
        url,
        req,
        {
          auth: {
            username: configAws.paywiserAuthUsername,
            password: configAws.paywiserAuthPassword,
          },
        },
      );

      return resp.data;
    } catch (err) {
      logger.error(
        `services.paywiser.PaywiserService.sendOtp: ${err.message}
        } : ${err.toString()}`,
      );
    }
    return undefined;
  };

  public checkOtp = async (
    req: IPaywiserCheckOtpRequest
  ): Promise<IPaywiserCheckOtpResponse> => {
    try {
      const url = `${configAws.paywiserAuthHost}/PayWiserOTPCredentialVerification`;

      const resp: { headers: { [key: string]: string}, data: IPaywiserCheckOtpResponse } = await axios.post(
        url,
        req,
        {
          auth: {
            username: configAws.paywiserAuthUsername,
            password: configAws.paywiserAuthPassword,
          },
        },
      );

      if (resp.data.StatusCode === 0) {
        // add the AccessToken from header
        resp.data.AccessToken = resp.headers["accesstoken"];
      }

      return resp.data;
    } catch (err) {
      logger.error(
        `services.paywiser.PaywiserService.checkOtp: ${err.message}
        } : ${err.toString()}`,
      );
    }
    return undefined;
  };

  public normalizeAmountDecimals = (
    amount: string,
    decimalPlaces: number,
  ): string => {
    // TODO: this should be changed and BigNumber or similar lib should be used to handle that.
    // TODO: this function should probably be renamed to something more telling
    // TODO: this function should probably return a number
    let retAmount = amount;
    if (!validNumberRegExp.test(retAmount)) {
      throw new Error('the amount is not a number');
    }
    let zerosToAdd = decimalPlaces;
    const indexOfPoint = retAmount.indexOf(POINT);
    if (indexOfPoint > -1) {
      zerosToAdd = decimalPlaces + indexOfPoint + 1 - retAmount.length;
      if (zerosToAdd < 0)
        throw new Error(
          'Currently the decimals in amount are more than the decimalPlaces',
        );
      while (retAmount.charAt(0) === '0')
        retAmount = retAmount.replace('0', '');
      retAmount = retAmount.replace(POINT, '');
    }
    return retAmount + '0'.repeat(zerosToAdd);
  };

  /**
   * Convert integral amount with decimals to string fixed point represenation
   * 
   * @param amount The amount as integer with the decimals included
   * @param decimalPlaces The number of decimals that are included in the integral value
   * @returns The string representation of fixed point notation
   */
  public normalizeAmountPaywiser = (
    amount: number,
    decimalPlaces: number,
  ): string => {
    // TODO: this should be changed and BigNumber or similar lib should be used to handle that.
    let number = amount.toString();
    while (number.length < decimalPlaces) {
      number = '0' + number;
    }
    const stringInt0 = number.substr(0, number.length - decimalPlaces);
    const stringFloat0 = number.slice(-decimalPlaces);

    const result = (stringInt0 === '' ? '0' : stringInt0) + '.' + stringFloat0;
    return result;
  };

  public getReferenceNumber = async (
    req: IPaywiserReferenceNumberRequest,
  ): Promise<IPaywiserReferenceNumberResponse> => {
    try {
      const url = `${configAws.paywiserKYCHost}/GetReferenceNumber`;

      const resp: { data: IPaywiserReferenceNumberResponse } = await axios.post(
        url,
        req,
        {
          auth: {
            username: configAws.paywiserKYCUsername,
            password: configAws.paywiserKYCPassword,
          },
        },
      );

      return resp.data;
    } catch (err) {
      logger.error(
        `services.paywiser.PaywiserService.getReferenceNumber: ${err.message}
        } : ${err.toString()}`,
      );
    }
    return undefined;
  };

  public checkReferenceNumber = async (
    req: IPaywiserCheckReferenceNumberRequest,
  ): Promise<IPaywiserCheckReferenceNumberResponse> => {
    try {
      const url = `${configAws.paywiserKYCHost}/CheckReferenceNumber`;

      const resp: {
        data: IPaywiserCheckReferenceNumberResponse;
      } = await axios.post(url, req, {
        auth: {
          username: configAws.paywiserKYCUsername,
          password: configAws.paywiserKYCPassword,
        },
      });
      //console.log('resp.data: ' + JSON.stringify(resp.data));
      return resp.data;
    } catch (err) {
      logger.error(
        `services.paywiser.PaywiserService.checkReferenceNumber: ${err.message
        } : ${err.toString()}`,
      );
    }
    return undefined;
  };

  public getPersonAddress = async (
    req: IPaywiserGetPersonAddressRequest,
  ): Promise<IPaywiserGetPersonAddressResponse> => {
    try {
      const url = `${configAws.paywiserKYCHost}/GetPersonAddress`;
      const resp: {
        data: IPaywiserGetPersonAddressResponse;
      } = await axios.post(url, req, {
        auth: {
          username: configAws.paywiserKYCUsername,
          password: configAws.paywiserKYCPassword,
        },
      });
      console.log('Update user:', resp.data);

      console.log(
        resp.data.Address.CountryCode,
        countryPhoneCodes[resp.data.Address.CountryCode],
      );

      //TODO: Use CountryCode to look up mobile phone country code

      return resp.data;
    } catch (err) {
      logger.error(
        `services.paywiser.PaywiserService.getPersonAddress: ${err.message
        } : ${err.toString()}`,
      );
    }
    return undefined;
  };

  public createPaywiserIban = async (personId: string, ibanTypeId: string, cardTypeId: string): Promise<ICreateIbanResponse> => {
    try {
      const url = `${configAws.paywiserKYCHost}/CreatePersonIban`;
      const req: ICreateIbanRequest = {
        ReferenceID: uuidv4(),
        PersonID: personId,
        IbanTypeID: ibanTypeId,
        CardTypeID: cardTypeId,
      };
      const resp: {
        data: ICreateIbanResponse;
      } = await axios.post(url, req, {
        auth: {
          username: configAws.paywiserKYCUsername,
          password: configAws.paywiserKYCPassword,
        },
      });

      return resp.data;
    } catch (error) {
      logger.error(
        `services.paywiser.createPaywiserIban: error: ${error.toString()}`,
      );
      throw error;
    }
  };

  public async getSpotPriceInfo(symbolFrom: string, symbolTo: string) {
    const symbolIDFrom = await this.getCurrencyIDBySymbol(symbolFrom);
    const symbolIDTo = await this.getCurrencyIDBySymbol(symbolTo);

    return {
      SymbolIDFrom: symbolIDFrom,
      SymbolIDTo: symbolIDTo,
    };
  }

  public async getSpotPrice(
    request: IPaywiserGetSpotPriceRequest,
  ): Promise<IPaywiserGetSpotPriceResponse> {
    const url = `${configAws.paywiserCryptoHost}/GetSpotPrice`;
    let resp: { data: IPaywiserGetSpotPriceResponse };
    try {
      resp = await axios.post(url, request, {
        auth: {
          username: configAws.paywiserCryptoUsername,
          password: configAws.paywiserCryptoPassword,
        },
      });
    } catch (error) {
      logger.error(
        `services.paywiser.BuyCrypto: error: ${error.toString()}; request: ${request.toString()}`,
      );
      throw error;
    }
    return resp.data;
  }

  public BuyCrypto = async (
    request: IPaywiserBuyCryptoRequest,
  ): Promise<IPaywiserBuyCryptoResponse> => {
    const url = `${configAws.paywiserCryptoHost}/BuyCrypto`;
    let resp: { data: IPaywiserBuyCryptoResponse };
    try {
      resp = await axios.post(url, request, {
        auth: {
          username: configAws.paywiserCryptoUsername,
          password: configAws.paywiserCryptoPassword,
        },
      });
    } catch (error) {
      logger.error(
        `services.paywiser.BuyCrypto: error: ${error.toString()}; request: ${request.toString()}`,
      );
      throw error;
    }
    return resp.data;
  };

  public ConfirmBuyCrypto = async (
    request: IPaywiserConfirmBuyCryptoRequest,
  ): Promise<IPaywiserConfirmBuyCryptoResponse> => {
    const url = `${configAws.paywiserCryptoHost}/ConfirmBuyCrypto`;
    let resp: { data: IPaywiserConfirmBuyCryptoResponse };
    try {
      resp = await axios.post(url, request, {
        auth: {
          username: configAws.paywiserCryptoUsername,
          password: configAws.paywiserCryptoPassword,
        },
      });
    } catch (error) {
      logger.error(
        `services.paywiser.BuyCrypto: error: ${error.toString()}; request: ${request.toString()}`,
      );
      throw error;
    }
    return resp.data;
  };

  public SellCrypto = async (
    request: IPaywiserSellCryptoRequest,
  ): Promise<IPaywiserSellCryptoResponse> => {
    const url = `${configAws.paywiserCryptoHost}/SellCrypto`;
    let resp: { data: IPaywiserSellCryptoResponse };
    try {
      resp = await axios.post(url, request, {
        auth: {
          username: configAws.paywiserCryptoUsername,
          password: configAws.paywiserCryptoPassword,
        },
      });
    } catch (error) {
      logger.error(
        `services.paywiser.SellCrypto: error: ${error.toString()}; request: ${request.toString()}`,
      );
      throw error;
    }
    return resp.data;
  };

  public ConfirmSellCrypto = async (
    request: IPaywiserConfirmSellCryptoRequest,
  ): Promise<IPaywiserConfirmSellCryptoResponse> => {
    const url = `${configAws.paywiserCryptoHost}/ConfirmSellCrypto`;
    let resp: { data: IPaywiserConfirmSellCryptoResponse };
    try {
      resp = await axios.post(url, request, {
        auth: {
          username: configAws.paywiserCryptoUsername,
          password: configAws.paywiserCryptoPassword,
        },
      });
    } catch (error) {
      logger.error(
        `services.paywiser.SellCrypto: error: ${error.toString()}; request: ${request.toString()}`,
      );
      throw error;
    }
    return resp.data;
  };

  /**
   * Creates or updates existing entry in the `user-paywiser` collection
   * @param userId user identifier
   * @param referenceNumber KYC reference number
   */
  public createOrUpdateUser = async (userId: string, referenceNumber: string) => {
    try {
      const userExists = await UserPaywiserModel.exists({ userId });
      if (!userExists) {
        // check if the user already exists
        const payWiserUser = await UserPaywiserModel.create({
          userId,
          kyc: {
            referenceNumber,
          },
        });
      } else {
        // just update the reference number field
        await UserPaywiserModel
          .updateOne({ userId }, { $set: { "kyc.referenceNumber": referenceNumber }})
          .exec();
      }
      // return payWiserUser
    } catch (error) {
      logger.error(
        `services.paywiser.createOrUpdateUser: error: ${error.toString()}; user: ${userId}`,
      );
      throw error;
    }
  };

  //Missing paywiser User Type.
  public createUserPaywiser = async (user: any) => {
    try {
      const payWiserUser = await UserPaywiserModel.create(user);
      // return payWiserUser
    } catch (error) {
      logger.error(
        `services.paywiser.createUserPaywiser: error: ${error.toString()}; user: ${user.toString()}`,
      );
      throw error;
    }
    return;
  };

  //#region "CryptoSymbols"
  // TODO: this one should be removed
  public async getCurrencyIDBySymbol(symbol: string): Promise<string> {
    await this.getSymbols();
    return this.paywiserSymbols.find(x => x.Symbol.toUpperCase() === symbol.toUpperCase())?.ID;
  }
  
  // TODO: this one should be removed
  public async getCurrencyDecimalsBySymbol(symbol: string): Promise<number> {
    await this.getSymbols();
    return this.paywiserSymbols.find(x => x.Symbol.toUpperCase() === symbol.toUpperCase())?.Decimals;
  }
  
  public async getCurrencyObjectBySymbol(symbol: string): Promise<IPaywiserSymbol> {
    await this.getSymbols();
    return this.paywiserSymbols.find(x => x.Symbol.toUpperCase() === symbol.toUpperCase());
  }


  //#region "getSymbolsInfoByType"
  //The next three functions won't be used until we need to load the file with fiat and cryptoCurrencies
  public async getSymbolsInfo(): Promise<IPaywiserSymbol[]> {
    const url = `${configAws.paywiserCryptoHost}/ListSymbols`;

    try {
      const resp: {
        data: IPaywiserGetListSymbolsResponse;
      } = await axios.post(
        url,
        {
          ReferenceID: uuidv4(),
        },
        {
          auth: {
            username: configAws.paywiserCryptoUsername,
            password: configAws.paywiserCryptoPassword,
          },
        },
      );

      return resp.data.Symbols;
    } catch (error) {
      logger.error(
        `services.paywiser.PaywiserService.getSymbolsInfoByType: ${error.message}
        } : ${error.toString()}`,
      );

      throw error;
    }
  }
  public async getSymbolsInfoByType(
    isCrypto: boolean,
  ): Promise<IPaywiserSymbol[]> {
    const url = `${configAws.paywiserCryptoHost}/ListSymbols`;

    try {
      const resp: {
        data: IPaywiserGetListSymbolsResponse;
      } = await axios.post(
        url,
        {
          IsCrypto: isCrypto,
          ReferenceID: uuidv4(),
        },
        {
          auth: {
            username: configAws.paywiserCryptoUsername,
            password: configAws.paywiserCryptoPassword,
          },
        },
      );

      return resp.data.Symbols;
    } catch (error) {
      logger.error(
        `services.paywiser.PaywiserService.getSymbolsInfoByType: ${error.message}
        } : ${error.toString()}`,
      );

      throw error;
    }
  }

  public async getFiatInfo(): Promise<IPaywiserSymbol[]> {
    return await this.getSymbolsInfoByType(false);
  }

  public async getCryptoInfo(symbol: string): Promise<IPaywiserSymbol[]> {
    return await this.getSymbolsInfoByType(true);
  }
  //#endregion "getSymbolsInfoByType"

  //#endregion "CryptoSymbols"

  public GetPersonDocumentData = async (
    request: IPaywiserDocumentRequest,
  ): Promise<IPaywiserDocumentResponse> => {
    const url = `${configAws.paywiserKYCHost}/GetPersonDocumentData`;
    let resp: { data: IPaywiserDocumentResponse };
    try {
      resp = await axios.post(url, request, {
        auth: {
          username: configAws.paywiserKYCUsername,
          password: configAws.paywiserKYCPassword,
        },
      });
    } catch (error) {
      logger.error(
        `services.paywiser.GetPersonDocumentData: error: ${error.toString()}; request: ${request.toString()}`,
      );
      throw error;
    }
    return resp.data;
  };

  public async getCryptoSymbols() {
    await this.getSymbols();
    return this.paywiserSymbols.filter(x => x.IsCrypto === true);
  }
  
  public async getFiatSymbols() {
    await this.getSymbols();
    return this.paywiserSymbols.filter(x => x.IsCrypto === false);
  }

  public async getCardTypeFromUserIbans(userId: string) {
    let purchasedCardTypeId: string;
    const userIban = await UserIban.findOne(
      { userId: userId })
      .lean()
      .exec();

    const allCards = await Card.find();

    purchasedCardTypeId = allCards.find(x => x.type.toUpperCase() === userIban.packageName.toUpperCase())?.cardTypeId;

    return purchasedCardTypeId;
  }

  public async listIbans(personId: string): Promise<IListIbansResponse> {
    const url = `${configAws.paywiserIbanHost}/ListIbans`;
    const request: IListIbansRequest = {
      ReferenceID: uuidv4(),
      PersonID: personId,
    };
    let resp: { status: number, data: IListIbansResponse };
    try {
      resp = await axios.post(url, request, {
        auth: {
          username: configAws.paywiserIbanUsername,
          password: configAws.paywiserIbanPassword,
        },
      });

      if (!resp.data) {
        throw Error("No data received for ListIbans")
      }

      return resp.data;
    } catch (error) {
      logger.error(
        `services.paywiser.listIbans: error: ${error.toString()}; request: ${request.toString()}`,
      );
      throw error;
    }
  }
}

export const paywiser = new PaywiserService();
