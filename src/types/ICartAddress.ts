import { ICustomGraphQLError } from './ICustomGraphQLError';

export interface ICompanyAppData {
  member: {
    display_name: string;
    email: string;
  };
  membership: {
    id: string;
    title: string;
  };
}

export type TGetCartAddressSource = "default" | "core" ;

export interface ICartAddress {
  coinSymbol: string;
  address: string;
  qrCode: string;
}

export interface ICartAddressResponse {
  cartAddress: ICartAddress;
  pricing: {
    amountUsd: number;
    amountCrypto: number;
    quantity: number;
  };
  nodeLicenseType: string;
}

export interface ICartBalance {
  coinSymbol: string;
  address: string;
  amountConfirmed: number;
  amountUnconfirmed: number;
  lastTransactions: ICartBalanceTransaction[];
}

export enum CartStatus {
  complete,
  insufficient,
  pending,
  expired,
  confirming,
  late,
}

export enum CartType {
  woocommerce,
  memberpress,
}

export interface CartRedisKey {
  symbol: string;
  brand: string;
  orderId: string;
  orderType: CartType;
}

export interface ICartWatcherData {
  source:TGetCartAddressSource;
  address: string;
  exp: Date;
  affiliateId: string;
  affiliateSessionId: string;
  utmVariables: string;
  status: string;
  crytoAmount: number;
  crytoAmountRemaining: number;
  usdAmount: number;
  meprTxData?: string;
  wooTxData?: string;
  companyAppTxData?: string;
  dbId?: string;
  quantity?: number;
  nodeLicenseType?: string;
  userId: string;
}

//TODO: consider to move the next region to its own file.
//#region "Transactions"
export interface ICartBalanceTransaction {
  tx: string;
  created: string;
  confirmations: number;
}

export enum EPurchasedProductsBrandOrigin {
  PURCHASED_IN_CURRENT_BRAND = 'PURCHASED_IN_CURRENT_BRAND',
  PURCHASED_IN_CONNECT_BRAND = 'PURCHASED_IN_CONNECT_BRAND',
}

export interface ICartTransactionsTotalByProductName {
  productName: string;
  quantityPurchasedSum: number;
  transactionsCount: number;
  totalRevenueUsdSum: string;
}

export interface ICartTransactionsProductsByCategory {
  products: ICartTransactionsTotalByProductName[];
  category: EPurchasedProductsBrandOrigin;
}

export interface ICartTransactionsReportHeaderResponse {
  grandTotalRevenueUsdSum: string;
  productsByCategory: ICartTransactionsProductsByCategory[];
}

export type TCartTransactionsHeaderReportOrError =
  | ICartTransactionsReportHeaderResponse
  | ICustomGraphQLError;

export interface ICartTransactionsReportDetail {
  address: string;
  name: string;
  email: string;
  status: string;
  productName: string;
  productId: string;
  totalUsd: string;
  cryptoCurrency: string;
  totalCryptoReceived: string;
  totalCrypto: string;
  created: Date;
  orderNumber: string;
  quantity: number;
  memberId: string;
  userId: string;
  conversionRate: string;
  currentValue: string;
}

export interface ICartTransactionsReportDetailResponse {
  cartTransactions: ICartTransactionsReportDetail[];
}

export type TCartTransactionsDetailReportOrError =
  | ICartTransactionsReportDetailResponse
  | ICustomGraphQLError;

//#endregion
