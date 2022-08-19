import { configAws } from 'src/common';

export const paywiserCryptoSymbolsEnum = (() => {
  const { paywiserMapCrypto } = configAws;
  let items = '';
  paywiserMapCrypto.forEach((_value: any, key: string) => {
    items += '\n' + key;
  });
  return `
    enum paywiserCryptoSymbolsEnum {${items}
    }`;
})();
