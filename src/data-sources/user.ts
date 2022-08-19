import { DataSource } from 'apollo-datasource';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { ApolloError } from 'apollo-server-express';
import { Model } from 'mongoose';
import { auth, config, configAws, logger } from 'src/common';
import { User, userSchema } from 'src/models';
import { IUser } from 'src/types';
import { IUserClaims } from 'src/types/context';
import { capitalize } from 'src/utils';

export default class UserApi extends DataSource {
  Model: Model<IUser> = User;
  domain: string;
  permissions: string[];
  role: string;
  userId: string;
  authorized: boolean;
  twoFaEnabled: boolean;
  token: string;
  claims: IUserClaims;
  uid: string;
  private walletSeed: number;

  constructor(claims: IUserClaims, uid: string, token = '') {
    super();
    this.claims = claims;
    this.uid = uid;
    const { permissions, role, userId, authorized, twoFaEnabled } = claims;
    this.token = token;
    this.permissions = permissions;
    this.role = role;
    this.authorized = authorized;
    this.userId = userId;
    this.twoFaEnabled = twoFaEnabled;
  }

  static fromCustomToken(token: string, ignoreExpired: boolean = false) {
    try {
      if (!token) {
        return undefined;
      }
      const decoded = auth.verifyAndDecodeToken(token, config.hostname, {
        ignoreExpiration: ignoreExpired,
      });
      if (!decoded) {
        return undefined;
      }
      const { claims, uid } = decoded;
      return new UserApi(claims, uid, token);
    } catch (error) {
      if (error.message === 'jwt expired') {
        return undefined;
      }
      logger.exceptionContext(error, `Unable to verify custom token: `, {
        token,
      });
    }
    return undefined;
  }

  static async fromIdToken(token: string) {
    try {
      const ignoreExpired = 'DEBUG' in process.env;
      return this.fromCustomToken(token, ignoreExpired);
    } catch (error) {
      logger.exceptionContext(error, `Unable to verify: `, { token });
    }
  }

  public findFromDb = async () => {
    try {
      const user = await User.findById(this.userId).exec();
      return user;
    } catch (error) {
      logger.warn(
        `data-sources.user.findFromDB.catch(${this.userId}):${error}`,
      );
      throw error;
    }
  };

  public getWalletSeed = async () => {
    if (this.walletSeed === undefined){
        const { wallet: { btcSeed }} = await User.findOne({id: this.userId}, {"wallet.btcSeed": 1});   
        this.walletSeed = ( btcSeed == null) ? null : btcSeed;
    }
    return this.walletSeed;
  };

  public getWalletBtcId = async () => {    
    const localWalletSeed = await this.getWalletSeed();
    const subIndex = (localWalletSeed == null) ? '' : `-${localWalletSeed}`;
    return `${this.userId}${subIndex}`;    
  }  

  public findAndUpdateWalletBtcId = async () => {
    try {
      const {wallet: {btcSeed}} = await User.findOneAndUpdate({id: this.userId}, {$inc:{"wallet.btcSeed": 1}}, {new: true});
      this.walletSeed = btcSeed;
      return await this.getWalletBtcId();
    } catch (error) {
      logger.warn(
        `data-sources.user.findBtcSeed.catch(${this.userId}):${error}`,
      );
      throw error;
    }
  }

  public update = async (update: any) => {
    try {
      const updateResult = await User.findByIdAndUpdate(this.userId, update);
      return updateResult;
    } catch (error) {
      logger.warn(`data-sources.user.update.catch(${this.userId}):${error}`);
      throw error;
    }
  };

  private findConnectUser = (query: { [key: string]: any }) => {
    if (config.brand.toLowerCase() === 'connect') {
      return Promise.resolve(null);
    }
    const ConnectUser = configAws.connectMongoConnection.model('user', userSchema);
    return ConnectUser.findOne(query);
  };

  private findUserAndLocalReferrer = async () => {
    const userFromDb = await this.findFromDb();
    const byAffiliateId = { affiliateId: userFromDb.referredBy };
    const referrer = await User.findOne(byAffiliateId);

    return { referrer, userFromDb };
  };

  private findUserAndReferrerIncludeConnect = async () => {
    const userFromDb = await this.findFromDb();
    const byAffiliateId = { affiliateId: userFromDb.referredBy };
    const [localReferrer, connectReferrer] = await Promise.all([
      User.findOne(byAffiliateId),
      this.findConnectUser(byAffiliateId),
    ]);
    const referrer = localReferrer || connectReferrer;

    return { referrer, userFromDb };
  };

  public findUserAndReferrer = async () => {
    return config.brand === 'gala'
      ? this.findUserAndLocalReferrer()
      : this.findUserAndReferrerIncludeConnect();
  };

  public async setWalletAccountToUser(
    ethAddress?: string,
    ethBlockNumAtCreation?: number,
  ) {
    try {
      const user = await this.Model.findById(this.userId);
      logger.debug(
        `data-sources.user.setWalletAccountToUser.user.id(${this.userId}):${user.id}`,
      );
      const defaults: any = {
        cryptoFavorites:
          user && user.wallet && user.wallet.cryptoFavoritesSet
            ? user.wallet.cryptoFavorites
            : configAws.defaultCryptoFavorites,
        cryptoFavoritesSet: true,
      };
      const walletToSet = { ...defaults, ethAddress, ethBlockNumAtCreation };
      const result = await this.Model.findByIdAndUpdate(
        this.userId,
        { $set :
          {
            "wallet.cryptoFavorites": walletToSet.cryptoFavorites,
            "wallet.cryptoFavoritesSet": walletToSet.cryptoFavoritesSet,
            "wallet.ethAddress": walletToSet.ethAddress,
            "wallet.ethBlockNumAtCreation": walletToSet.ethBlockNumAtCreation,
          },
        },
        { new: true },
      ).exec();
      return result;
    } catch (error) {
      logger.warn(
        `data-sources.user.setWalletAccountToUser.catch(${this.userId}):${error}`,
      );
      throw error;
    }
  }

  public async setBtcAddressToUser(btcAddress: string) {
    const result = await this.Model.findByIdAndUpdate(
      this.userId,
      { 'wallet.btcAddress': btcAddress },
      { new: true },
    );
    return result;
  }

  public async setDisplayNameToUser(displayName: string) {
    const result = await this.Model.findByIdAndUpdate(
      this.userId,
      { displayName: displayName },
      { new: true },
    );
    return result;
  }

  async setTempTwoFaSecret() {
    logger.debug(`data-sources.user.setTempTwoFaSecret(${this.userId})`);

    try {
      const user = await this.findFromDb();
      if (!user) {
        throw new Error('User not found');
      }

      const secret = speakeasy.generateSecret({
        length: 20,
      });

      const issuer = capitalize(config.brand);

      const otpUrl = speakeasy.otpauthURL({
        issuer,
        secret: secret.base32,
        label: user.email,
        encoding: 'base32',
      });

      user.twoFaTempSecret = secret.base32;
      await user.save();

      const qrCode = await QRCode.toDataURL(otpUrl);

      return { qrCode, secret: secret.base32 };
    } catch (error) {
      logger.warn(
        `data-sources.user.setTempTwoFaSecret.catch(${this.userId}):${error}`,
      );
      throw error;
    }
  }

  async validateTwoFa(totpToken: string) {
    try {
      const user = await this.findFromDb();

      if (!user) {
        throw new Error('User not found');
      }
      const { twoFaSecret, twoFaTempSecret } = user;

      if (!twoFaTempSecret && !twoFaSecret)
        throw new ApolloError('User not registered for 2FA');

      const verified = speakeasy.totp.verify({
        secret: twoFaSecret || twoFaTempSecret,
        encoding: 'base32',
        token: totpToken,
      });

      if (!verified) {
        return false;
      }

      if (!twoFaSecret) {
        user.twoFaSecret = twoFaTempSecret;
        await user.save();
      }
      return true;
    } catch (error) {
      logger.warn(
        `data-sources.user.validateTwoFa.catch(${this.userId}):${error}`,
      );
      throw error;
    }
  }

  incrementTxCount(inc = 1) {
    try {
      return this.Model.findByIdAndUpdate(this.userId, {
        $inc: { 'wallet.ethNonce': inc },
      }).exec();
    } catch (error) {
      logger.warn(
        `data-sources.user.incrementTxCount.catch(${this.userId}):error`,
      );
      throw error;
    }
  }
}
