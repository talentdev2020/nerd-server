import { Document, model, Schema } from 'mongoose';

export interface IVaultWithdrawalEth extends Document {
  userId: string;
  date: Date;
  type: string;
  symbol: string;
  transferAmount: string;
  feeAmount: string;
  total: string;
  toWalletAddress: string;
  transactionId: string;
  description: string;
  status: VaultWithdrawalEthStatus;
}

export enum VaultWithdrawalEthStatus {
  STARTED = 'started',
  SUBMITTED = 'submitted',
  CONFIRMING = 'confirming',
  COMPLETE = 'complete',
}

export const STUCK_STATUS_VAULT_WITHDRAWAL_ETH = VaultWithdrawalEthStatus.SUBMITTED;

export const vaultWithdrawalEthSchema = new Schema(
  {
    userId: String,
    date: Date,
    type: String,
    symbol: String,
    transferAmount: String,
    feeAmount: String,
    total: String,
    toWalletAddress: String,
    transactionId: String,
    description: String,
    status: String,
  },
  { id: false },
);

export const VaultWithdrawalEth = model<IVaultWithdrawalEth>(
  'vault-withdrawals-eth',
  vaultWithdrawalEthSchema,
);
