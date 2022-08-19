import { RESTDataSource } from 'apollo-datasource-rest';
import { config, configAws, logger } from '../common';

class CryptoFavorites extends RESTDataSource {
  baseURL = 'https://min-api.cryptocompare.com/data';

  public async getUserFavorites(userFavorites: string[]) {
    logger.debug(
      `data-sources.crypto-favorites.userFavorites: ${userFavorites.join(',')}`,
    );

    const { cryptoSymbolToNameMap } = configAws;
    const currency = 'USD';
    const cryptoPriceResponse = await this.get('/pricemultifull', {
      fsyms: userFavorites.join(','),
      tsyms: currency,
    });

    const { RAW: rawFavorites } = cryptoPriceResponse;
    logger.debug(
      `data-sources.crypto-favorites.getUserFavorites.cryptoPriceResponse.RAW.keys.length: ${
        Object.keys(rawFavorites).length
      }`,
    );
    return Object.values(rawFavorites).map(({ [currency]: fav }) => {
      const {
        CHANGEPCT24HOUR: changePercent24Hour,
        PRICE: price,
        FROMSYMBOL: symbol,
        IMAGEURL: imageUrl,
        SUPPLY: supply,
        MKTCAP: marketCap,
      } = fav;
      return {
        changePercent24Hour,
        price,
        symbol,
        imageUrl: `https://cryptocompare.com${imageUrl}`,
        supply,
        marketCap,
        name: cryptoSymbolToNameMap.get(symbol),
      };
    });
  }

  public getBtcUsdPrice = async () => {
    const [{ price }] = await this.getUserFavorites(['BTC']);

    return +price;
  };

  public getEthUsdPrice = async () => {
    const [{ price }] = await this.getUserFavorites(['ETH']);

    return +price;
  };
}

export default CryptoFavorites;
