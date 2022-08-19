import { IPaywiserSymbolObject } from 'src/types';

const paywiserCryptoMap = new Map<string, IPaywiserSymbolObject>();
const paywiserFiatMap = new Map<string, IPaywiserSymbolObject>();

export { paywiserFiatMap, paywiserCryptoMap };

//BTC,ETH,GREEN,WIN,BLUE,SWITCH,ELEVATE,LIBERTY,GIVE,GALA,GROW,USDC,USDT,BUSD
//ID=> PaywiserID, Symbol=>Symbol used

// paywiserFiatMap.set('GBP', '10000000-0000-0000-0000-000000000003');
// paywiserFiatMap.set('JPY', '10000000-0000-0000-0000-000000000004');
// paywiserFiatMap.set('MXN', '10000000-0000-0000-0000-000000000005');

// allCryptoSymbolsPaywiserMap.set("GREEN", '00000000-0000-0000-0000-000000000003');
// allCryptoSymbolsPaywiserMap.set("WIN", '00000000-0000-0000-0000-000000000004');
// allCryptoSymbolsPaywiserMap.set("BLUE", '00000000-0000-0000-0000-000000000005');
// allCryptoSymbolsPaywiserMap.set("SWITCH", '00000000-0000-0000-0000-000000000006');
// allCryptoSymbolsPaywiserMap.set("ELEVATE", '00000000-0000-0000-0000-000000000007');
// allCryptoSymbolsPaywiserMap.set("LIBERTY", '00000000-0000-0000-0000-000000000008');
// allCryptoSymbolsPaywiserMap.set("GIVE", '00000000-0000-0000-0000-0000000000010');
// allCryptoSymbolsPaywiserMap.set("GROW", '00000000-0000-0000-0000-000000000011');
// allCryptoSymbolsPaywiserMap.set("USDC", '00000000-0000-0000-0000-000000000012');
// allCryptoSymbolsPaywiserMap.set("USDT", '00000000-0000-0000-0000-000000000013');
// allCryptoSymbolsPaywiserMap.set("BUSD", '00000000-0000-0000-0000-000000000014');
