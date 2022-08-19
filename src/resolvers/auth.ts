import { auth, config, configAws, logger } from '../common';
import { Context, IUserClaims } from '../types/context';
import { WalletApi } from '../wallet-api';
import ResolverBase from '../common/Resolver-Base';
import { ApolloError } from 'apollo-server-express';
import { UserApi } from '../data-sources/';
const autoBind = require('auto-bind');
import { userResolver } from './user';
import galaGamingApiService from '../services/gala-gaming-api';

interface ITwoFaSetup {
  twoFaSecret: string | null;
  twoFaQrCode: string | null;
}
class Resolvers extends ResolverBase {
  constructor() {
    super();
    autoBind(this);
  }

  private async verifyWalletsExist(user: UserApi, wallet: WalletApi) {
    try {
      const walletsExist = await Promise.all(
        wallet.parentInterfaces.map(parentCoin =>
          parentCoin.checkIfWalletExists(user),
        ),
      );

      const bothWalletsExist = walletsExist.every(walletExists => walletExists);

      return bothWalletsExist;
    } catch (error) {
      logger.warn(`resolvers.auth.verifyWalletsExist.catch:${error}`);
      return false;
    }
  }

  private async setupTwoFa(
    claims: IUserClaims,
    userApi: UserApi,
  ): Promise<ITwoFaSetup> {
    try {
      let secret: string | null = null;
      let qrCode: string | null;

      if (!claims.twoFaEnabled) {
        const {
          qrCode: userQrCode,
          secret: userSecret,
        } = await userApi.setTempTwoFaSecret();
        secret = userSecret;
        qrCode = userQrCode;
      }
      return {
        twoFaSecret: secret,
        twoFaQrCode: qrCode,
      };
    } catch (error) {
      logger.warn(`resolvers.auth.setupTwoFa.catch:${error}`);
      throw error;
    }
  }

  public async login(parent: any, args: { token: string }, context: Context) {
    try {
      if (!args.token) {
        return undefined;
      }
      const token = await auth.signIn(args.token, config.hostname);
      const ignoreExpired = 'DEBUG' in process.env;
      const tempUserApi = UserApi.fromCustomToken(token, ignoreExpired);
      tempUserApi.update({ $set: { lastLogin: new Date() } });
      const walletExists = await this.verifyWalletsExist(
        tempUserApi,
        context.wallet,
      );

      context.user = tempUserApi;
      return {
        twoFaEnabled: tempUserApi.claims.twoFaEnabled,
        token,
        walletExists,
      };
    } catch (error) {
      logger.exceptionContext(error, 'resolvers.auth.login.catch', {
        'args.token': args.token,
      });
      return undefined;
    }
  }

  public async validateExistingToken(
    parent: any,
    args: {},
    { user, wallet, res }: Context,
  ) {
    try {
      this.requireAuth(user);
      const newToken = await auth.signInWithDifferentCustomToken(
        user.token,
        config.hostname,
      );
      if (!newToken) {
        const cookieName =
          config.brand + '-token' + (config.isProd ? '' : '-stage');
        res.clearCookie(cookieName);
        throw new Error('Unauthorized');
      }
      const ignoreExpired = 'DEBUG' in process.env;
      const tempUser = UserApi.fromCustomToken(newToken, ignoreExpired);
      const walletExists = await this.verifyWalletsExist(tempUser, wallet);
      const twoFaSetup = await this.setupTwoFa(user, user);

      const twoFaAuthenticated = await auth.verifyTwoFaAuthenticated(
        user.token,
        config.hostname,
      );

      return {
        userApi: user,
        twoFaEnabled: user.twoFaEnabled,
        twoFaAuthenticated,
        walletExists,
        newToken,
        ...twoFaSetup,
      };
    } catch (error) {
      logger.warn(`resolvers.auth.validateExistingToken.catch:${error}`);
      throw error;
    }
  }

  public async twoFaRegister(parent: any, args: {}, { user }: Context) {
    try {
      this.requireAuth(user);

      const { twoFaSecret } = await user.findFromDb();

      if (twoFaSecret) {
        throw new ApolloError('Two Factor Authentication is already set up.');
      }
      const { qrCode, secret } = await user.setTempTwoFaSecret();

      return { twoFaQrCode: qrCode, twoFaSecret: secret };
    } catch (error) {
      logger.warn(`resolvers.auth.twoFaRegister.catch:${error}`);
      throw error;
    }
  }

  public async twoFaValidate(
    parent: any,
    args: { totpToken: string },
    { user }: Context,
  ) {
    try {
      this.requireAuth(user);

      const { authenticated, newToken } = await auth.validateTwoFa(
        config.hostname,
        user.token,
        args.totpToken,
      );

      return { authenticated, newToken };
    } catch (error) {
      logger.warn(`resolvers.auth.twoFaValidate.catch:${error}`);
      throw error;
    }
  }

  public async disableTwoFa(
    parent: any,
    args: { totpToken: string },
    { user }: Context,
  ) {
    this.requireAuth(user);
    try {
      const newToken = await auth.disableTwoFa(
        config.hostname,
        user.token,
        args.totpToken,
      );

      return {
        authenticated: !!newToken,
        newToken,
      };
    } catch (error) {
      throw error;
    }
  }

  public walletPasswordRequired() {
    return configAws.clientSecretKeyRequired;
  }

  public async getGameJWT(parent: any, args: any, { user }: Context) {
    this.requireAuth(user);

    const token = await galaGamingApiService.getGameJWT(user.userId);

    return { token };
  }
}

const resolvers = new Resolvers();

export default {
  ReturnToken: {
    profile: userResolver.getUserProfile,
  },
  ValidateExistingTokenResponse: {
    profile: userResolver.getUserProfile,
  },
  Query: {
    twoFaValidate: resolvers.twoFaValidate,
    validateExistingToken: resolvers.validateExistingToken,
    walletPasswordRequired: resolvers.walletPasswordRequired,
    gameJWT: resolvers.getGameJWT,
  },
  Mutation: {
    login: resolvers.login,
    twoFaRegister: resolvers.twoFaRegister,
    disableTwoFa: resolvers.disableTwoFa,
  },
};
