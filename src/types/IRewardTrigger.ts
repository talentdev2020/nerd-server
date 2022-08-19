export interface IRewardTriggerValues {
  user?: number;
  referrer?: number;
}

export interface IRewardTriggerAmounts {
  toUser?: number;
  toReferrer?: number;
}

export interface IRewardTriggerConfig {
  amount: IRewardTriggerAmounts;
  valuesRequired?: IRewardTriggerValues;
}

export enum RewardActions {
  UPGRADED = 'UPGRADED',
  WALLET_CREATED = 'WALLET_CREATED',
}
