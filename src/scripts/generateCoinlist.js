const axios = require('axios');
const _chunk = require('lodash.chunk');
const fs = require('fs');
const path = require('path');

void (async () => {
  const { data: results } = await axios.get(
    'https://min-api.cryptocompare.com/data/all/coinlist',
  );
  const rawCoins = _chunk(
    Object.values(results.Data).map(coin => {
      return coin.Symbol;
    }),
    100,
  );
  const allCalls = [];
  for (const pair of rawCoins) {
    const params = pair.join(',');
    const coins = axios
      .get(
        `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${params}&tsyms=USD`,
      )
      .then(({ data }) => {
        const coinResults = Object.values(data.RAW)
          .map(rawVal => rawVal.USD)
          .filter(returnedVal => {
            const {
              CHANGE24HOUR: change24Hour,
              PRICE: price,
              FROMSYMBOL: symbol,
              IMAGEURL: imageUrl,
              SUPPLY: supply,
              MKTCAP: marketCap,
            } = returnedVal;
            const change24HourExists = change24Hour !== undefined;
            const priceExists = price !== undefined;
            const symbolExists = symbol !== undefined;
            const imageUrlExists = imageUrl !== undefined;
            const supplyExists = supply !== undefined;
            const marketCapExists = marketCap !== undefined;
            return (
              change24HourExists &&
              priceExists &&
              symbolExists &&
              imageUrlExists &&
              supplyExists &&
              marketCapExists
            );
          })
          .map(filtered => {
            return filtered.FROMSYMBOL;
          });
        return coinResults;
      })
      .catch(err => {
        console.log(err);
      });
    allCalls.push(coins);
  }
  const finalResults = await Promise.all(allCalls);
  const supportedCoins = finalResults
    .reduce((allCoins, coin) => {
      return allCoins.concat(coin);
    }, [])
    .sort();
  fs.writeFileSync(
    path.join(__dirname, '../data/supportedFavoriteOptions.json'),
    JSON.stringify(supportedCoins),
  );
})();
