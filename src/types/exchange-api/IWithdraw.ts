export interface IWithdraw {
  from: string[]; // coins will be withdrawn from this address; the array contains a single element, but transactions may be sent from several addresses (UTXO coins)
  to: string[]; // coins will be withdrawn to this address; this may contain the my_address address, where change from UTXO coins is sent
  my_balance_change: string; // numeric. the expected balance of change in my_address after the transaction broadcasts
  received_by_me: string; // numeric.  the amount of coins received by my_address after the transaction broadcasts; the value may be above zero when the transaction requires that MM2 send change to my_address
  spent_by_me: string; // numeric.  the amount of coins spent by my_address; this value differ from the request amount, as the transaction fee is added here
  total_amount: string; // numeric.  the total amount of coins transferred
  fee_details: IBtcFeeDetails | IEthFeeDetails; // the fee details of the generated transaction; this value differs for utxo and ETH/ERC20 coins, check the examples for more details
  tx_hash: string; // the hash of the generated transaction
  tx_hex: string; // transaction bytes in hexadecimal format; use this value as input for the send_raw_transaction method
}
export interface IWithdrawResponse {
  from: string[]; // coins are withdrawn from this address; the array contains a single element, but transactions may be sent from several addresses (UTXO coins)
  to: string[]; //coins are withdrawn to this address; this may contain the my_address address, where change from UTXO coins is sent
  my_balance_change: string; // numeric - the expected balance of change in my_address after the transaction broadcasts
  received_by_me: string; // numeric - the amount of coins received by my_address after the transaction broadcasts; the value may be above zero when the transaction requires that MM2 send change to my_address
  spent_by_me: string; //numeric - the amount of coins spent by my_address; this value differ from the request amount, as the transaction fee is added here
  total_amount: string; // numeric - the total amount of coins transferred
  fee_details: object; // the fee details of the generated transaction; this value differs for utxo and ETH/ERC20 coins, check the examples for more details
  tx_hash: string; // the hash of the generated transaction
  tx_hex: string; // transaction bytes in hexadecimal format; use this value as input for the send_raw_transaction method
}
interface IBtcFeeDetails {
  amount: string; // numeric
}
interface IEthFeeDetails {
  coin: string; //ticker for coin
  gas: number;
  gas_price: string; // numeric
  total_fee: string; // numeric
}
export function isEthFee(
  data: IBtcFeeDetails | IEthFeeDetails,
): data is IEthFeeDetails {
  return (data as IEthFeeDetails).coin !== undefined;
}
export interface IWithdrawError {
  error: string;
}
export function isIWithdrawError(
  data: IWithdraw | IWithdrawError,
): data is IWithdrawError {
  return (data as IWithdrawError).error !== undefined;
}
