import { ServerToServerService } from './server-to-server';
import { logger } from '../common';
import { IUser } from '../types';
import { UserHelper } from '../utils';

export enum rewardableAction {
  UPGRADE = 'app_upgrade',
}

class ActionRewardService extends ServerToServerService {
  //private baseUrl = `${config.actionRewardsApiUrl}/api/action`;
  private baseUrl = '';
  public getUserHelper = (user: IUser) => new UserHelper(user);
  actions = rewardableAction;

  triggerActionReward = async (
    action: rewardableAction,
    subjectUserId: string,
  ) => {
    const axios = this.getAxios({ role: 'system' });

    try {
      const result = await axios.post(this.baseUrl, {
        action,
        subjectUserId,
      });

      return result;
    } catch (error) {
      logger.warn(`action-rewards-service.triggerActionReward: ${error}`);
      throw error;
    }
  };
}

export const actionRewardService = new ActionRewardService();
