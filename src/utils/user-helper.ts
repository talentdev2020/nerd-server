import { IUser } from '../types';
import { User } from '../models';
import {
  IWalletReferralCountAggregate,
  walletReferralCounts,
} from '../pipelines';

export class UserHelper {
  private referrer: IWalletReferralCountAggregate;

  constructor(public self: IUser) {}

  private get referrerCounts(): Promise<
    IWalletReferralCountAggregate | undefined
  > {
    return User.aggregate(walletReferralCounts(this.self.referredBy)).then(
      ([result]) => result,
    );
  }

  getReferrer = async () => {
    if (this.referrer) return this.referrer;
    if (!this.self.referredBy || this.referrer === null) {
      this.referrer = null;
      return null;
    }
    this.referrer = (await this.referrerCounts) || null;
    return this.referrer;
  };
}
