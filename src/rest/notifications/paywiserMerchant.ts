import { config, logger } from '../../common';
import { IPaywiserMerchantUserNotification } from 'src/types';

class PaywiserMerchantNotificationListener {
  publishNewPaywiserMerchantNotification(
    notification: IPaywiserMerchantUserNotification,
  ) {
    try {
      config.pubsub.publish('PAYWISER_MERCHANT_NOTIFICATION', notification);
    } catch (error) {
      logger.error(
        `notification-listeners.paywiser.publishNewNotification.catch: ${error}`,
      );
    }
  }
}

export default new PaywiserMerchantNotificationListener();
