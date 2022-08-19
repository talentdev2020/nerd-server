import axios from 'axios';

class CryptoCompareService {
  baseUrl = 'https://min-api.cryptocompare.com/data/v2/histohour';

  getHistoricalPriceHour = async (symbol: string, timestamp: number) => {
    try {
      const { data } = await axios.get(this.baseUrl, {
        params: {
          fsym: symbol,
          tsym: 'USD',
          limit: 1,
          toTs: timestamp,
        },
      });
      const resultSet = data.Data.Data;
      const { high, low } = resultSet[resultSet.length - 1];
      return +((high + low) / 2).toFixed(2);
    } catch (error) {
      throw error;
    }
  };
}

export const cryptoCompareService = new CryptoCompareService();
