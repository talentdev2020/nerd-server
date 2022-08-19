export default interface ITransaction {
  id: string;
  status: string;
  confirmations: number;
  timestamp: number;
  fee: string;
  link: string;
  to: string[];
  from: string;
  amount: string;
  type: string;
  total: string;
}

export interface TxSendResponse {
  success: boolean;
  message?: string;
  transaction?: ITransaction
};