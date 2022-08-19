import { Schema, model, Document } from 'mongoose';

export enum NotificationStatus {
  unread,
  read,
  hidden,
}

export interface INotifications extends Document {
  userId: string;
  subject: string;
  message: string;
  created: Date;
  read: Date;
  status: string;
}

export const notificationSchema = new Schema({
  userId: String,
  subject: String,
  message: String,
  created: Date,
  read: Date,
  status: String,
});

const Notification = model<INotifications>('notification', notificationSchema);

export default Notification;
