export interface IListTransactionsRequest {
  coin: string; // the name of the coin for the history request
  limit: number; //limits the number of returned transactions
  from_id: string; //MM2 will skip records until it reaches this ID, skipping the from_id as well; track the internal_id of the last displayed transaction to find the value of this field for the next page
}

export interface IListTransactionsResponse {
  transactions: any; // transactions data
  from_id: string; // the from_id specified in the request; this value is null if from_id was not set
  skipped: number; // the number of skipped records (i.e. the position of from_id in the list + 1); this value is 0 if from_id was not set
  limit: number; // the limit that was set in the request; note that the actual number of transactions can differ from the specified limit (e.g. on the last page)
  total: number; // the total number of transactions available
  current_block: number; // the number of the latest block of coin blockchain
  sync_status: ISyncStatus; // provides the information that helps to track the progress of transaction history preloading at background
}

export interface ISyncStatus {
  state: string; // current state of sync; possible values: NotEnabled, NotStarted, InProgress, Error, Finished
  additional_info: ISyncStatusAdditionalInfo; // additional info that helps to track the progress; present for InProgress and Error states only
}

export interface ISyncStatusAdditionalInfo {
  blocks_left: number; // present for ETH/ERC20 coins only; displays the number of blocks left to be processed for InProgress state
  transactions_left: number; // present for UTXO coins only; displays the number of transactions left to be processed for InProgress state
  code: number; // displays the error code for Error state
  message: string; // displays the error message for Error state
}
