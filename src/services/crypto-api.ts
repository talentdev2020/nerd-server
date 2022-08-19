import { config, configAws } from '../common';
import { IFiatPrices, ICoinData } from '../types';
import axios from 'axios';
import * as coinDa from '../data/coinData.json';

export class CryptoAPI {
    private quotesLatestUrl = `${configAws.coinMarketCapAPIUrl}/cryptocurrency/quotes/latest`;
    private cryptoKey =  configAws.coinMarketCapAPIKey;
    private coinData: ICoinData = coinDa;

   async getFiatPrices(coinSymbols:string,currency:string):Promise<IFiatPrices>{
        const params = {
            symbol: coinSymbols,
            convert: currency,            
        };
        
        const headers = {
            'X-CMC_PRO_API_KEY':this.cryptoKey,
            "Accept": 'application/json',
            'Accept-Encoding': 'deflate, gzip',
        };

        try {
          const {
            data,
          } = await axios.get(this.quotesLatestUrl,
            { params,headers},            
          );
          const fiatPrices: IFiatPrices = {};
        
          for (const key in data.data) {
            const element = data.data[key];
            
            fiatPrices[element.symbol] = {
              price: element.quote[currency].price,
              changePercent24Hour: element.quote[currency].percent_change_24h,
              imageUrl: this.coinData[element.symbol]?.imageUrl,
              supply: element.circulating_supply,
              marketCap: element.quote[currency].market_cap,
            };
          }
        
          return fiatPrices;
        } catch(error) {
          throw error;
        }
    }
}

export const cryptoAPI = new CryptoAPI();
export default cryptoAPI;


