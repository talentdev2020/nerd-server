import { Schema, model, Document } from 'mongoose';
import { IProcessLock } from 'src/types';

export interface IProcessLockDoc extends IProcessLock, Document{};

const ProccessLockSchema = new Schema({
    _id: String,
    owner: String,
    expiration: Date,
});
  
export const ProccessLockModel = model<IProcessLockDoc>('process-locks', ProccessLockSchema);