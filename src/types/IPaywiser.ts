//#region "requests-responses"

export interface IPaywiserSendOtpRequest {
  /**
   * ID of the client, such as "Switch app"
   */
  ClientID: string;
  /**
   * The client description, such as "Switch wallet server application"
   */
  ClientDescription: string;
  /**
   * Should use value 2
   */
  UserTypeID: number; 
  /**
   * Should use value 2
   */
  AccessTokenTypeID: number;
  /**
   * User's phone number in international format such as +1800xxxx
   */
  MSISDN: string;
}

export interface IPaywiserSendOtpResponse {
  /**
   * The ODTPID used to verify the response
   */
  OTPID: string;
  /**
   * The length of the OTP, eg. 6
   */
  OTPLength: number;
  /**
   * Status code number, should be 0
   */
  StatusCode: number;
  /**
   * Status description, should be "OK"
   */
  StatusDescription: string;
}

export interface IPaywiserCheckOtpRequest {
  /**
   * The ID returned by Auth service
   */
  OTPID: string;
  /**
   * User-supplied OTP (e.g. 123456)
   */
  OTP: string;
}

/**
 * The OTP response interface
 * Note: the response contains a HTTP header `AccessToken` with the value that is
 * important for further KYC implementation
 */
export interface IPaywiserCheckOtpResponse {
  /**
   * Status code of OTP check, should be 0
   */
  StatusCode: number;
  /**
   * Status description, could be "OK", "OTP expired..."
   */
  StatusDescription: string;
  AccessToken?: string;
}

export interface IPaywiserReferenceNumberRequest {
  MobileNumber: string;
  Email: string;
  AddressChanged: boolean;
  DocumentChanged: boolean;
  IbanTypeID: string;
  ReferenceID: string;
}

export interface IPaywiserReferenceNumberResponse {
  StatusCode: number;
  StatusDescription: string;
  ReferenceNumber: string;
  ReferenceID: string;
  CallerReferenceID: string;
}

export interface IPaywiserCheckReferenceNumberRequest {
  ReferenceNumber: string;
  ReferenceID: string;
}

export interface IPaywiserCheckReferenceNumberResponse {
  StatusCode: number;
  StatusDescription: string;
  AssignedDateTime: string;
  ReferenceNumberStatus: string;
  PersonID: string;
  KycID: string;
  KycStart: string;
  KycEnd: string;
  KycStatus: string;
  VerificationEnd: string;
  VerificationStatus: string;
  AdditionalData: string;
  ReferenceID: string;
  CallerReferenceID: string;
}

export interface IPaywiserGetPersonAddressRequest {
  PersonID: string;
  KycID: string;
  ReferenceID: string;
}
export interface IPaywiserGetPersonAddressResponse {
  StatusCode?: number;
  StatusDescription?: string;
  Address?: IPaywiserPersonAddress;
  ReferenceID?: string;
  CallerReferenceID?: string;
}

export interface IPaywiserGetListSymbolsResponse {
  ReferenceID: string;
  CallerReferenceID: string;
  StatusCode: number;
  StatusDescription: string;
  Symbols: IPaywiserSymbol[];
}

//#region "BuyCrypto"
export interface IPaywiserBuyCryptoRequest {
  ReferenceID: string;
  PersonID: string;
  SymbolIDCrypto: string;
  SymbolIDFiat: string;
  Amount: string;
  AmountSymbol: string;
  RecipientAddress: string;
  TransactionMemo?: string;
}

export interface IPaywiserBuyCryptoResponse {
  ReferenceID: string;
  CallerReferenceID: string;
  StatusCode: number;
  StatusDescription: string;

  TransactionID: string;
  TransactionStatus: number;
  TransactionStatusDescription: string;
  Rate: number;
  RateDecimals: number;
  RequestedAmount: number;
  RequestedAmountDecimals: number;
  RequestedAmountSymbolCode: string;
  FeeAmount: number;
  FeeAmountDecimals: number;
  FeeAmountSymbolCode: string;
  Amount: number;
  AmountDecimals: number;
  AmountSymbolCode: string;
  ValidTo: string;
}

export interface IPaywiserConfirmBuyCryptoRequest {
  ReferenceID: string;
  TransactionID: string;
}

export interface IPaywiserConfirmBuyCryptoResponse {
  ReferenceID: string;
  CallerReferenceID: string;
  TransactionStatus: number;
  TransactionStatusDescription: String;
  StatusCode: number;
  StatusDescription: String;
}
//#endregion "BuyCrypto"

//#region "SellCrypto"
/**
 * SellCrypto request structure
 */
export interface IPaywiserSellCryptoRequest {
  /**
   * ReferenceID - GUID
   */
  ReferenceID: string;
  /**
   * PersonID obtained via KYC
   */
  PersonID: string;
  /**
   * ID of the crypto symbol (obtained via ListSymbols)
   */
  SymbolIDCrypto: string;
  /**
   * ID of the FIAT symbol (should match the IBAN currency)
   */
  SymbolIDFiat: string;
  /**
   * The scaled value as number, based on the number of decimals (returned by ListSymbols)
   */
  Amount: number;
  /**
   * The ID of the IBAN which is to be funded
   */
  IbanId: string;
  /**
   * Risk tolerance percentage as a scaled integer number
   * with a scale of 4
   * 5 = 0.0005%
   * 15000 = 1.5%
   */
  RiskTolerancePercentage: number;
}

/**
 * SellCrypto response
 */
export interface IPaywiserSellCryptoResponse {
  StatusCode: number;
  StatusDescription: string;
  ReferenceID: string;
  CallerReferenceID: string;

  /**
   * Transaction ID
   */
  TransactionID: string;
  /**
   * Transaction status as a number
   */
  TransactionStatus: number;
  /**
   * Transaction status description
   */
  TransactionStatusDescription: string;
  /**
   * RiskTolerancePercentage as a scaled number
   */
  RiskTolerancePercentage: number;
  /**
   * RiskTolerancePercentage scale factor
   */
  RiskTolerancePercentageDecimals: number;
  /**
   * Exchange rate as a scaled number
   */
  Rate: number;
  /**
   * Scaling factor for Rate
   */
  RateDecimals: number;
  /**
   * Requested amount as a scaled number
   */
  RequestedAmount: number;
  /**
   * Scaling factor for RequestedAmount
   */
  RequestedAmountDecimals: number;
  /**
   * Currency symbol for RequestedAmount
   */
  RequestedAmountSymbolCode: string;
  /**
   * FeeAmount as a scaled number
   */
  FeeAmount: number;
  /**
   * Scale factor for FeeAmount
   */
  FeeAmountDecimals: number;
  /**
   * FeeAmount currency symbol
   */
  FeeAmountSymbolCode: string;
  /**
   * Amount as a scaled number (based on AmountDecimals)
   */
  Amount: number;
  /**
   * Scaling factor for Amount value
   */
  AmountDecimals: number;
  /**
   * Amount currency symbol (EUR, USD...)
   */
  AmountSymbolCode: string;
  /**
   * SellRequest validity timestamp (ISO8601)
   */
  ValidTo: string;
  /**
   * The address for the crypto transfer
   */
  DepositAddress: string;
  /**
   * DepositMemo if required for a sell transaction (to route the crypto payment)
   */
  DepositMemo: string;
}

export interface IPaywiserConfirmSellCryptoRequest {
  ReferenceID: string;
  TransactionID: string;
}

export interface IPaywiserConfirmSellCryptoResponse {
  ReferenceID: string;
  CallerReferenceID: string;
  TransactionStatus: number;
  TransactionStatusDescription: string;
  StatusCode: number;
  StatusDescription: String;
}
//#endregion "SellCrypto"

/**
 * Request interface for Paywiser Crypto API method GetSpotPrice
 */
export interface IPaywiserGetSpotPriceRequest {
  ReferenceID: string;
  /**
   * ID of the currency symbol that is to be converted from
   */
  SymbolIDFrom: string;
  /**
   * ID of the currency symbol that is to be converted to
   */
  SymbolIDTo: string;
  /**
   * This must be a scaled integer number
   * based on the number of decimal places returned by `ListSymbols`
   */
  Amount: number;
}

/**
 * The Paywiser Crypto API GetSpotPrice response
 */
export interface IPaywiserGetSpotPriceResponse {
  /**
   * Status code, should be 0
   */
  StatusCode: number;
  /**
   * Status code description
   */
  StatusDescription: string;
  /**
   * Request reference ID
   */
  ReferenceID: string;
  /**
   * Caller reference ID
   */
  CallerReferenceID: string;

  /**
   * Exchange rate as a scaled number based on the number of decimals
   */
  Rate: number;
  /**
   * Number of decimals used in the scaled `Rate` number
   */
  RateDecimals: number;
  /**
   * The converted amout as a scaled number based on rate
   */
  ConversionAmount: number;
  /**
   * Number of decimals used for the scaled number conversion
   */
  ConversionAmountDecimals: number;
  /**
   * The converted currency symbol (ETH, EUR, USD)
   */
  ConversionAmountSymbolCode: string;
}
//#endregion "requests-responses"

//#region "paywiser WalletServer Structures"

export interface IPaywiserSymbol {
  ID: string;
  Symbol: string;
  Name: string;
  IsCrypto: boolean;
  Decimals: number;
  MemoRequired: boolean;
}

export interface IPaywiserTransaction {
  referenceId: string;
  transactionId: string;
  transactionStatus: number;
  amount: string;
  convertedAmount: number;
  endAmount: string;
  cryptoSymbol: string;
  fiatSymbol: string;
  depositAddress: string;
  depositMemo: string;
  type: EPaywiserTransactionTypes;
  validTo: string;
  rate: number;
  rateDecimals: number;
}

export interface IPaywiserKycDocument {
  documentId: string;
  type: string;
  issuer: string;
  expiryDate: string;
  willExpire: boolean;
  expired: boolean;
  documentNumber: string;
  subject: IPaywiserKYCDocumentSubject;
}
interface IPaywiserKYCDocumentSubject {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  nationality: string;
  personalNumber: string;
}

export interface IPaywiserKycIban {
  documentId: string;
  ibanId: string;
  ibanCurrency: string;
  ibanTypeId: string;
}

export interface IPaywiserKyc {
  kycId: string;
  personId: string;
  referenceId: string;
  referenceNumber: string;
  kycStatus: string;
  verificationStatus: string;
  ibanStatus: string;
  ibanObject: IPaywiserKycIban;
  additionalDescription: string;
  kycStart: Date;
  kycEnd: Date;
  documents: [IPaywiserKycDocument];
}

export interface IPaywiserPersonAddress {
  FirstName?: string;
  MiddleName?: string;
  LastName?: string;
  Address1?: string;
  Address2?: string;
  Address3?: string;
  ZipCode?: string;
  City?: string;
  State?: string;
  CountryCode?: string;
  CountryName?: string;
  MobileNumber?: string;
  Email?: string;
  VerificationDateTime?: string;
  VerificationStatus?: string;
  VerificationRejectReason?: string;
}

export interface ICreateIbanRequest {
  ReferenceID: string;
  PersonID: string;
  IbanTypeID: string;
  CardTypeID: string;
}

export interface ICreateIbanResponse {
  ReferenceID: string;
  CallerReferenceID: string;
  StatusCode: number;
  StatusDescription: string;
}

/**
 * The request for ListIbans API call
 */
export interface IListIbansRequest {
  ReferenceID: string;
  PersonID: string;
}

/**
 * The ListIban reponse model
 * 
 * ``` 
 * {
 *   "StatusCode": 0,
 *   "StatusDescription": "OK",
 *   "IBANs": [
 *     {
 *       "ID": "4d0b84d3-9f0e-4f07-bf58-3935071be684",
 *       "Iban": "LT551010107420570237",
 *       "Description": "Account 2",
 *       "Balance": 100000,
 *       "Currency": "EUR",
 *       "Status": "A",
 *       "StatusDescription": "Active"
 *     },
 *     {
 *       "ID": "7756d56f-73cb-4690-97b3-0604945242b8",
 *       "Iban": "LT641010163538203854",
 *       "Description": "Account",
 *       "Balance": 105247,
 *       "Currency": "EUR",
 *       "Status": "A",
 *       "StatusDescription": "Active"
 *     }
 *   ],
 *   "ReferenceID": "74e66fee-7290-41bc-be65-c18ae8be5690",
 *   "CallerReferenceID": "vma-3a9d3234-468f-416d-8087-43cd48005fce"
 * }
 * ```
 */
export interface IListIbansResponse {
  /**
   * Status code
   */
  StatusCode: number,
  /**
   * Status description
   */
  StatusDescription: string,
  /**
   * Reference ID
   */
  ReferenceID: string,
  /**
   * Caller reference ID
   */
  CallerReferenceID: string
  /**
   * List of IBANS
   */
  IBANs: IIbanEntry[]
}

/**
 * IBAN entry
 */
export interface IIbanEntry {
  /**
   * Unique IBAN identification within the Paywiser system
   */
  ID: string,
  /**
   * The IBAN number, such as LT641010163538203854
   */
  Iban: string,
  /**
   * IBAN description
   */
  Description: string,
  /**
   * The balance of the iban withou decimals (divide by 100 to get the correct amount)
   */
  Balance: number,
  /**
   * IBAN currency
   */
  Currency: string,
   /**
    * IBAN status:
    * A - active
    * U - suspended by user
    * S - suspended by system
    * C - Closed
    */
  Status: string,
  /**
   * Status description
   */
  StatusDescription: string
}

//#endregion "paywiser WalletServer Structures"

//#region "enums"
export enum EPaywiserTransactionTypes {
  BUY,
  SELL,
}

export enum EPaywiserTransactionStatus {
  CONFIRMED = 1,
  UNCONFIRMED = 0,
  FAILED = -1,
}

/**
 * Constants used with Paywiser Auth - OTP
 */
export enum PaywiserAuth {
  AUTH_USER_TYPE_ID = 2,
  AUTH_ACCESS_TOKEN_TYPE_ID = 2,
}

export enum EPaywiserConstants {
  CRYPTO = 'C',
  FIAT = 'F',
  PAYWISER_STATUSCODE_OK = 0,
  PAYWISER_STATUSCODE_INVALIDPARAMETERS = -1,
  SPOTPRICE_FROM = 'F',
}
//#endregion "enums"

//#region "notifications"
export interface IPaywiserKycNotification {
  KycID: string;
  PersonID: string;
  ReferenceNumber: string;
  ReferenceID: string;
  KycStatus: string;
  VerificationStatus: string;
  IbanStatus: string;
  AdditionalDescription: string;
}

export interface IPaywiserIbanNotification {
  PersonID: string;
  DocumentID: string;
  IbanID: string;
  IbanCurrency: string;
  IbanTypeID: string;
  CardTypeID: string;
  userId?: string;
}

export interface IPaywiserDocExpiredNotification {
  PersonID: string;
  DocumentID: string;
  ExpirationDate: Date;
}
enum ETransactionStatus {
  PENDING,
  ACCEPTED,
  FAILED,
}
export interface IPaywiserFiatTransferNotification {
  WhitelabelReferenceID: string;
  TransactionID: string;
  TransactionStatus: ETransactionStatus;
  Amount: number;
}
export interface IPaywiserDocumentWillExpireNotification {
  PersonID: string;
  DocumentID: string;
  ExpirationDate: string;
}

export interface IPaywiserKycOngoingNotification {
  PersonID: string;
  VerificationStatus: string;
  AdditionalDescription: string;
}

export interface IPaywiserKycFundsNotification {
  CurrentFunds: number;
}

export interface IPaywiserBuyNotification {
  WhitelabelReferenceID: string;
  TransactionID: string;
  TransactionStatus: number;
  TransactionStatusDescription: string;
  Amount: string;
}

export interface IPaywiserSellNotification {
  WhitelabelReferenceID: string;
  TransactionID: string;
  TransactionStatus: number;
  TransactionStatusDescription: string;
  Amount: string;
}
//#endregion "notifications"

export interface IPaywiserSymbolObject {
  symbolId: string;
  decimals: number;
}

export interface IPaywiserUserNotification {
  message: string;
  type: string;
  status: string;
  userId: string;
}

export interface IPaywiserDocumentResponse {
  StatusCode: number;
  StatusDescription: string;
  Process: IPaywiserDocumentResponseProcess;
  Document: IPaywiserDocumentResponseDocument;
  SecurityChecks?: any;
  ReferenceID: string;
  CallerReferenceID: string;
}

interface IPaywiserDocumentResponseDocument {
  ID: string;
  Type: string;
  Issuer: string;
  ExpiryDate: string;
  WillExpire: boolean;
  Expired: boolean;
  DocumentNumber: string;
  Subject: IPaywiserDocumentResponseSubject;
}

interface IPaywiserDocumentResponseSubject {
  FirstName: string;
  LastName: string;
  BirthDate: string;
  Gender: string;
  Nationality: string;
  PersonalNumber: string;
}

interface IPaywiserDocumentResponseProcess {
  VideoStatus: string;
  VideoVerificationDateTime: string;
  VideoVerificationStatus: string;
  VideoVerificationRejectReason?: any;
  CheckStatus: string;
  VerificationDateTime: string;
  VerificationStatus: string;
  VerificationRejectReason?: any;
}
export interface IPaywiserDocumentRequest {
  PersonID: string;
  KycID: string;
  ReferenceID: string;
}

export interface IPaywiserGetSymbolsResponse {
  id: string;
  symbol: string;
  name: string;
  isCrypto: boolean;
  decimals: number;
  memoRequired: boolean;
}

// export interface IListSymbolsResponse {
//   referenceId: string;
//   isCrypto: boolean;
//   statusCode: number;
//   statusDescription: string;
//   symbols: IAcceptedSymbols;
// }

// export interface IAcceptedSymbols {
//   id: string;
//   symbol: string;
//   name: string;
//   isCrypto: boolean;
//   decimals: number;
//   memoRequired: boolean;
// }
