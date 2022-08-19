
export class ProccessLockError extends Error {}

export type TProcessLocks = 'paid-fee-resolution';

export interface IProcessLock {
    owner:string;
    expiration:Date;
}