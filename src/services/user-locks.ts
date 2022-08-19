import { Types } from 'mongoose';
import { MongoServerError } from 'mongodb';
import  {UserLockModel} from 'src/models';
import  {UserLockError} from 'src/types';
import { logger } from 'src/common';

export type TUserLocks = 'mint';

class UserLocks {
  private readonly EXPIRATION_FIELD = 'expiration';
  private readonly findAndUpdateOptions = {
    rawResult: true,
    lean: true,
  };

  private toSet = (
    lockName: string,
    timeInMilliSeconds: number,
    lockId: Types.ObjectId,
  ) => ({
    $set: {
        [lockName]:{
        [this.EXPIRATION_FIELD]:new Date(Date.now() + timeInMilliSeconds),
        id: lockId,
      }, 
    },
  });

  private nullOrExpiredFilter = (userId:string,fullLockName:string)=>({
    _id: userId,
    [fullLockName]: { $not: { $gt: new Date() } },
  });

  async getLock(
    lockName: TUserLocks,
    userId: string,
    timeInMilliSeconds: number,
  ):Promise<Types.ObjectId|null> {

    const fullLockName = `${lockName}.${this.EXPIRATION_FIELD}`;    
    const lockId = new Types.ObjectId();
    try {
      const claimMintLockResult: any = await UserLockModel.findOneAndUpdate(
        this.nullOrExpiredFilter(userId,fullLockName),
        this.toSet(lockName, timeInMilliSeconds, lockId),
        this.findAndUpdateOptions,
      );

      if (claimMintLockResult.lastErrorObject.updatedExisting)
        return lockId;

      const lockByUserId = await UserLockModel.findOne(
        { _id: userId },
        { [fullLockName]: 1 },
      )
        .lean()
        .exec();

      if (lockByUserId?.mint?.expiration) return null;

      if (!lockByUserId) {
        const lockAcquired = await this.createNewUserLock(
          lockName,
          userId,
          timeInMilliSeconds,
          lockId,
        );
        return lockAcquired ? lockId:null;
      }
    } catch (error) {
      throw new UserLockError('Server error');
    }
    throw new UserLockError('Unexpected end of function');
  }

  private async createNewUserLock(
    lockName: string,
    userId: string,
    timeInMilliSeconds: number,
    lockId: Types.ObjectId,
  ) {
    try {
      await UserLockModel.create({
        _id: userId,
        mint: {
          expiration: new Date(Date.now() + timeInMilliSeconds),
          id: lockId,
        },
      });
      return true;
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        const fullLockName = `${lockName}.${this.EXPIRATION_FIELD}`;    
        const claimMintLockResultOnNotUniqueError: any = await UserLockModel.findOneAndUpdate(
          this.nullOrExpiredFilter(userId,fullLockName),
          this.toSet(lockName, timeInMilliSeconds, lockId),
          this.findAndUpdateOptions,
        );
        return claimMintLockResultOnNotUniqueError.lastErrorObject
          .updatedExisting;
      }
      throw new UserLockError('Server error');
    }
  }

/** 
 * if the lock is not acquired, it would be considered as an exception.
 */
  async acquireLock(
    lockName: TUserLocks,
    userId: string,
    timeInMilliSeconds: number,
  ):Promise<Types.ObjectId> {
    const lockId = await this.getLock(lockName,userId,timeInMilliSeconds);
    if (!lockId){
      throw new UserLockError(`"${lockName}" resource is locked`);
    }      
    return lockId;  
  }

  async removeLock(
    lockName: TUserLocks,
    userId: string,
    lockId: Types.ObjectId,
  ) {  
      const fullLockNameId = `${lockName}.id`;
      try {        
        await UserLockModel.updateOne(
          { _id: userId, [fullLockNameId]: lockId },
          { $unset: { [lockName]: null } },
        );
      } catch (error) {
        throw new UserLockError('Server error');
      }      
  }

  /** 
  * if the lock is not removed, the exception will be logged.
  * this function does not throw an error.
  */
  async tryRemoveLock(
    lockName: TUserLocks,
    userId: string,
    lockId: Types.ObjectId,
  ){
    try {      
      await this.removeLock(lockName,userId,lockId);
    } catch (error) {
      logger.warnContext("unable to remove lock",{lockName,userId,lockId:lockId?.toString(),errorMessage:error.message});
      return false;
    }
    return true;
  }
}

export const userLocks = new UserLocks();
