interface IBtcRawOutput {
  path: string;
  address: string;
  value: number;
}

export default interface IBcoinTx {
  block: number;
  confirmations: number;
  mdate: Date;
  fee: number;
  outputs: IBtcRawOutput[];
  hash: string;
}
