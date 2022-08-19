import { Types } from 'mongoose';

export class UserLockError extends Error {}

export interface IUserLock {
  mint: {
    expiration: Date;
    id:Types.ObjectId;
  };
}