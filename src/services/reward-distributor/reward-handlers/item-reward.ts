import { BaseReward } from './base-reward';
import { ItemRewardConfig } from '../../../common';
import { ItemTokenName, IRewardTriggerConfig } from '../../../types';

export abstract class ItemReward extends BaseReward {
  protected supplyWarnThreshold: number;

  constructor(
    itemName: ItemTokenName,
    rewardTriggerConfig: IRewardTriggerConfig,
  ) {
    const rewardItemConfig = ItemRewardConfig.getItemRewardConfig().get(itemName);
    super(rewardItemConfig, rewardTriggerConfig);
    this.supplyWarnThreshold = rewardItemConfig.supplyWarnThreshold;
  }
}
