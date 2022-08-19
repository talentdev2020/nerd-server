import { Schema, model, Document, Types } from 'mongoose';
import { IUserLock } from 'src/types';

interface IUserLockDocument extends IUserLock, Document {}

const LockSchema = new Schema({
  expiration: Date,
  id: Types.ObjectId,
},{_id:false});

const UserLocksSchema = new Schema(
  {    
    _id: String,
    mint: LockSchema,
  }  
);

export const UserLockModel = model<IUserLockDocument>('user-locks', UserLocksSchema);
