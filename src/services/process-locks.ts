import { MongoServerError, UpdateResult } from 'mongodb';
import { ProccessLockModel } from 'src/models';
import { ProccessLockError, TProcessLocks } from 'src/types';
import { logger } from 'src/common';

class ProccessLocks {
  private readonly EXPIRATION_FIELD = 'expiration';
  private readonly findAndUpdateOptions = {
    rawResult: true,
    lean: true,
    new: true,
  };

  private toSetOwnerAndExpiration = (
    owner: string,
    timeInMilliSeconds: number,
  ) => ({
    $set: {
      [this.EXPIRATION_FIELD]: new Date(Date.now() + timeInMilliSeconds),
      owner,
    },
  });

  private nullOrExpiredFilter = (lockName: TProcessLocks) => ({
    _id: lockName,
    [this.EXPIRATION_FIELD]: { $not: { $gt: new Date() } },
  });

  async getLock(
    lockName: TProcessLocks,
    lockRequester: string,
    timeInMilliSeconds: number,
  ): Promise<Date | null> {
    try {
      const claimLockResult: any = await ProccessLockModel.findOneAndUpdate(
        this.nullOrExpiredFilter(lockName),
        this.toSetOwnerAndExpiration(lockRequester, timeInMilliSeconds),
        this.findAndUpdateOptions,
      );

      if (claimLockResult.lastErrorObject.updatedExisting) {
        return claimLockResult.value.expiration;
      }

      const currentLock = await ProccessLockModel.findOne(
        { _id: lockName },
        { _id: 1 },
      )
        .lean()
        .exec();

      if (currentLock) {
        return null;
      } else {
        const lockAcquired = await this.createNewLock(
          lockName,
          lockRequester,
          timeInMilliSeconds,
        );
        return lockAcquired;
      }
    } catch (error) {
      throw new ProccessLockError('Server error');
    }
  }

  private async createNewLock(
    lockName: TProcessLocks,
    ownerId: string,
    timeInMilliSeconds: number,
  ): Promise<Date | null> {
    try {
      const newLock = await ProccessLockModel.create({
        _id: lockName,
        owner: ownerId,
        expiration: new Date(Date.now() + timeInMilliSeconds),
      });
      return newLock.expiration;
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        return null;
      }
      throw new ProccessLockError('Server error');
    }
  }

  private ownerFilter(lockName: string, owner: string) {
    return {
      _id: lockName,
      owner,
    };
  }

  private lockExtentionSetExpression(
    timeInMilliSeconds: number,
    fromNow: boolean,
  ) {
    if (!fromNow) {
      return [
        {
          $set: {
            [this.EXPIRATION_FIELD]: {
              $add: [`$${this.EXPIRATION_FIELD}`, timeInMilliSeconds],
            },
          },
        },
      ];
    }
    return {
      $set: {
        [this.EXPIRATION_FIELD]: new Date(Date.now() + timeInMilliSeconds),
      },
    };
  }

  async extendLock(
    lockName: TProcessLocks,
    lockExtender: string,
    timeInMilliSeconds: number,
    fromNow: boolean = false,
  ): Promise<Date | null> {
    let extendResult: any;
    try {
      extendResult = await ProccessLockModel.findOneAndUpdate(
        this.ownerFilter(lockName, lockExtender),
        this.lockExtentionSetExpression(timeInMilliSeconds, fromNow),
        this.findAndUpdateOptions,
      );
    } catch (error) {
      throw new ProccessLockError('Server error');
    }

    if (extendResult.lastErrorObject.updatedExisting) {
      return extendResult.value.expiration;
    }
    return null;
  }

  /**
   * if the lock is not acquired, it would be considered as an exception.
   */
  async acquireLock(
    lockName: TProcessLocks,
    ownerId: string,
    timeInMilliSeconds: number,
  ): Promise<Date> {
    const lockResult = await this.getLock(
      lockName,
      ownerId,
      timeInMilliSeconds,
    );
    if (!lockResult) {
      throw new ProccessLockError(`"${lockName}" resource is locked`);
    }
    return lockResult;
  }

  async removeLock(lockName: TProcessLocks, owner: string): Promise<boolean> {
    let updateResult: UpdateResult;
    try {
      updateResult = await ProccessLockModel.updateOne(
        { _id: lockName, owner },
        { $unset: { owner: null, [this.EXPIRATION_FIELD]: null } },
      );
    } catch (error) {
      throw new ProccessLockError('Server error');
    }
    return updateResult.modifiedCount >= 1;
  }

  /**
   * if the lock is not removed, the exception will be logged.
   * this function does not throw an error.
   */
  async tryRemoveLock(lockName: TProcessLocks, owner: string) {
    try {
      await this.removeLock(lockName, owner);
    } catch (error) {
      logger.warnContext('unable to remove lock', {
        lockName,
        owner,
        errorMessage: error.message,
      });
      return false;
    }
    return true;
  }
}

export const processLocks = new ProccessLocks();
