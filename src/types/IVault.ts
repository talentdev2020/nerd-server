import { Types } from 'mongoose';
import {
  IVaultItemWithDbRecords,
} from 'src/models';

export interface IVaultItem {
  symbol: string;
  name: string;
  icon: string;
  contractAddress: string;
  balance: number;
  fees: IVaultGasFee;
}

export interface IVaultTransaction {
  userId: string;
  symbol: string;
  tokenId?: string;
  isNft: boolean;
  amount: number;
  created: Date;
  status: string;
  dateMint?: Date;
  txMint?: string;
}

export interface IVaultGasFee {
  symbolToMint: string;
  symbolAcceptFee: string;
  amount: number;
  expires: Date;
  name: string;
}

export enum ErrorResponseCode {  
  InvalidEncryptionPassword,
  BlockchainError,
  InternalError,
  LockError,
  ArgsValidationError,
}

export interface IErrorResponse {
  message: string;
  code: ErrorResponseCode;
  stack?: string;
}

export interface IVaultRetrieveResponseData {
  symbol: string;
  amount: number;
  transactionId?: string;
  error?: IErrorResponse;
}

export interface IVaultItemRequest {
  symbol: string;
  amount: number;
  address?: string;
  dbUnmintedItems?: IVaultItemWithDbRecords;
  transactionId?: string;
  connectWithdrawalId?: Types.ObjectId;
}

export interface IVaultRetrieveResponse {
  data?: IVaultRetrieveResponseData[];
  error?: IErrorResponse;
}

export class VaultError extends Error {
  constructor(public response: IVaultRetrieveResponse) {
    super();
  }
}

export class PasswordError extends VaultError {
  constructor(response: IVaultRetrieveResponse) {
    super(response);
  }
}

export interface WalletResultGreen {
  receiveAddress: string;
  symbol: string;
  name: string;
  backgroundColor: string;
  icon: string;
  canSendFunds: boolean;
  lookupTransactionsBy: string;
  decimalPlaces: number;
}

export interface IBalanceAndStuckItemsEth {
  balance:number;
  stuckItemsIds?:Types.ObjectId[];
  stuckBalance?:number;
}

