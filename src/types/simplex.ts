export interface SimplexCurrencyAmount {
  currency: string;
  amount: number;
}

export interface SimplexQuoteResponse {
  digital_money: SimplexCurrencyAmount;
  fiat_money: SimplexCurrencyAmount;
}

export type SimplexFiatCurrency =
  | 'AED'
  | 'ARS'
  | 'AUD'
  | 'AZN'
  | 'BGN'
  | 'BRL'
  | 'CAD'
  | 'CHF'
  | 'CLP'
  | 'COP'
  | 'CRC'
  | 'CZK'
  | 'DKK'
  | 'DOP'
  | 'EUR'
  | 'GBP'
  | 'GEL'
  | 'HKD'
  | 'HUF'
  | 'IDR'
  | 'ILS'
  | 'INR'
  | 'JPY'
  | 'KRW'
  | 'KZT'
  | 'MAD'
  | 'MDL'
  | 'MXN'
  | 'MYR'
  | 'NAD'
  | 'NGN'
  | 'NOK'
  | 'NZD'
  | 'PEN'
  | 'PHP'
  | 'PLN'
  | 'QAR'
  | 'RON'
  | 'RUB'
  | 'SEK'
  | 'SGD'
  | 'TRY'
  | 'TWD'
  | 'UAH'
  | 'USD'
  | 'UYU'
  | 'UZS'
  | 'VND'
  | 'ZAR';

export type SimplexCryptoCurrency =
  | 'ATOM'
  | 'AVA'
  | 'BCH'
  | 'BNB'
  | 'BSV'
  | 'BTC'
  | 'BUSD'
  | 'CEL'
  | 'COTI'
  | 'DAI'
  | 'DASH'
  | 'DEP'
  | 'EOS'
  | 'ETH'
  | 'GALA'
  | 'HBAR'
  | 'HEDG'
  | 'HUSD'
  | 'ICX'
  | 'LTC'
  | 'LUNA'
  | 'MIOTA'
  | 'NANO'
  | 'PAX'
  | 'QTUM'
  | 'SDT'
  | 'SGA'
  | 'TOMO'
  | 'TRX'
  | 'USDK'
  | 'USDT'
  | 'XAUT'
  | 'XLM'
  | 'XRP';
