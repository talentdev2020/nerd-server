import { config, logger } from '../../common';
import { IPaywiserUserNotification } from 'src/types';

class PaywiserNotificationListener {
  publishNewPaywiserNotification(notification: IPaywiserUserNotification) {
    try {
      config.pubsub.publish('PAYWISER_NOTIFICATION', notification);
    } catch (error) {
      logger.error(
        `notification-listeners.paywiser.publishNewNotification.catch: ${error}`,
      );
    }
  }
}

export default new PaywiserNotificationListener();
