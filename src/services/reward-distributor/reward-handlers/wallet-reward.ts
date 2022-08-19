import { BaseReward } from './base-reward';
import { WalletConfig } from '../../../common';
import { IRewardTriggerConfig } from '../../../types';

export abstract class WalletReward extends BaseReward {
  constructor(
    currencySymbol: string,
    rewardTriggerConfig: IRewardTriggerConfig,
  ) {
    super(
      WalletConfig.getWallet(currencySymbol.toLowerCase()),
      rewardTriggerConfig,
    );
  }
}
