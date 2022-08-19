import { Notification, NotificationStatus } from '../models';
import { logger } from './';

class Notify {
  public notifyUser = async (
    userId: string,
    subject: string,
    message: string,
    status: NotificationStatus = NotificationStatus.unread,
  ) => {
    const toInsert: any = {
      userId,
      subject,
      message,
      created: new Date(),
      read: undefined,
      status: status.toString(),
    };
    try {
      Notification.insertMany([toInsert]);
    } catch (err) {
      logger.exceptionContext(
        err,
        'Tried to insert Notification to user, but failed. :: ',
        toInsert,
      );
    }
  };
}

const notify = new Notify();
export default notify;
