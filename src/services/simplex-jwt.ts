const jwt = require('jsonwebtoken');
import axios from 'axios';
import { configAws, logger } from '../common';

import {
  SimplexCryptoCurrency,
  SimplexFiatCurrency,
  SimplexQuoteResponse,
} from '../types';

class SimplexJwtService {
  constructor(
    private baseUri: string,
    private partner: string,
    private secret: string,
  ) {}

  async getQuote({
    sourceAmount,
    sourceCurrency,
    targetCurrency,
    clientIp,
  }: {
    sourceAmount: number;
    sourceCurrency: SimplexCryptoCurrency;
    targetCurrency: SimplexFiatCurrency;
    clientIp: string;
  }) {
    try {
      const response = await axios.get<SimplexQuoteResponse>(
        this.getQuoteUrl(
          sourceAmount,
          sourceCurrency,
          targetCurrency,
          clientIp,
        ),
      );
      return response.data;
    } catch (error) {
      logger.warn(`services.simplex.getQuote.catch: ${error}`);
      throw error;
    }
  }

  getQuoteUrl(
    sourceAmount: number,
    sourceCurrency: SimplexCryptoCurrency,
    targetCurrency: SimplexFiatCurrency,
    clientIp: string,
  ) {
    const quoteUrl = this.requestUrl('api/quote', {
      soam: sourceAmount,
      socn: sourceCurrency,
      tacn: targetCurrency,
      clip: clientIp,
    });
    logger.debug(`services.simplex.getQuoteUrl.quoteUrl: ${quoteUrl}`);
    return quoteUrl;
  }

  buyCryptoUrl({
    cryptoAddress,
    cryptoCurrency,
    fiatCurrency,
    fiatAmount,
    userId,
  }: {
    cryptoAddress: string;
    cryptoCurrency: SimplexCryptoCurrency;
    fiatCurrency: SimplexFiatCurrency;
    fiatAmount: number;
    userId: string;
  }) {
    return this.requestUrl('', {
      crad: cryptoAddress,
      crcn: cryptoCurrency,
      ficn: fiatCurrency,
      fiam: fiatAmount,
      euid: userId,
    });
  }

  requestUrl(resource: string, data: any) {
    const unixTimeNow = Math.floor(new Date().getTime() / 1000);

    const token = jwt.sign(
      {
        ...data,
        ts: unixTimeNow,
      },
      this.secret,
      { noTimestamp: true },
    );

    return `${this.baseUri}/${resource}?partner=${this.partner}&t=${token}`;
  }
}

export const simplexJwtService = new SimplexJwtService(
  configAws.simplexJwtServiceUrl,
  configAws.simplexPartnerName,
  configAws.simplexJwtServiceSecret,
);
