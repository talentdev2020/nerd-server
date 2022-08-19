import { SimplexCurrencyAmount } from './simplex';

export enum SimplexOrderStatus {
  pendingPayment = 'pending_payment',
  awaitingCrypto = 'awaiting_crypto',
  complete = 'complete',
  cancelled = 'cancelled',
  refunded = 'refunded',
}

export interface ISimplexOrder {
  userId: string;
  simplexPaymentId: string;
  status: SimplexOrderStatus;
  fiatAmount: SimplexCurrencyAmount;
  cryptoAmount: SimplexCurrencyAmount;
  transactionHash?: string;
  cryptoIcon?: string;
}
