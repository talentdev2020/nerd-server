export interface IBalanceRequest {
  coin: string; // the name of the coin to retrieve the balance
  address: string;
  tokenId: number;
  rel: string;
  walletAddress?: string;
}

export interface IBalanceResponse {
  address: string; // the address that holds the coins
  balance: number; // the number of coins in the address
  locked_by_swaps: number; // the number of coins locked by ongoing swaps. There is a time gap between the start of the swap and the sending of the actual swap transaction (MM2 locks the coins virtually to prevent the user from using the same funds across several ongoing swaps)
  coin: string; // the name of the coin
}
