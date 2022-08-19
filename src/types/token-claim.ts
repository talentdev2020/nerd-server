export enum ClaimType {
  mint = 'mint',
  transfer = 'transfer',
}

export enum RewardType {
  distribution = 'distribution_reward',
  referral = 'referral_reward',
}

export interface IToken {
  token: string; // 'gala' or baseId
  quantity: number;
  claimType: ClaimType;
}

export interface ITokenClaim {
  userId: string;
  userEthAddress: string;
  claimFee: number;
  claimFeeTransactionHash: string;
  tokens: IToken[];
}

export interface IUnclaimedToken extends IToken {
  rewardType: RewardType;
}

export interface IClaimQuote {
  userId: string;
  expires: Date;
  galaMintEthFee: string;
  galaTransferEthFee: string;
  itemMintEthFee: string;
  itemTransferEthFee: string;
  itemTransferAdditionalTokenEthFee: string;
  itemTransferMaxTokensPerTransaction: number;
}
