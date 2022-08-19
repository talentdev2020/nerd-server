import * as http from 'http';
import * as express from 'express';
import { ApolloServer, gql } from 'apollo-server-express';
import { DocumentNode } from 'graphql';
import autoBind = require('auto-bind');
import { connection as mongooseConnection } from 'mongoose';
import { ExecutionParams } from 'subscriptions-transport-ws';
import schemas from './schemas';
import resolvers from './resolvers';
import { config, configSecrets, configAws } from './common';
import { CareclixDemographic } from 'src/models';
import * as mongodb from 'mongodb';
import {
  UserApi,
  CryptoFavorites,
  WalletConfig,
  Bitly,
  Zendesk,
  Blockfunnels,
  SendEmail,
  LinkShortener,
} from './data-sources';
import { walletApi } from './wallet-api';
import removeNotificationsListeners, {
  removeListeners,
} from './blockchain-listeners';
import { logger, systemLogger, logMessage } from './common/logger';
import { Wallet } from 'ethers';
import restApi from './rest/routes';

import * as cors from 'cors';
import { siblingBrandsRouter } from './rest/fromSiblingBrands/routes';
import { EBrands, ICareclixUser } from './types';

import paywiserNotificationHandlerController from './rest/controllers/paywiserNotificationHandler';
import paywiserMerchantNotificationHandlerController from './rest/controllers/paywiserMerchantNotificationHandler';
import paywiserNotificationMiddleware from './rest/middleware/paywiserNotificationMiddleware';
import * as Sentry from '@sentry/node';
import { default as errorHandler } from './errors';
import { careclix } from './services';

class Server {
  public app: express.Application = express();
  public httpServer: http.Server;
  public walletApi = walletApi;  

  constructor() {
    autoBind(this);
  }

  private postInit() {
    // get the unhandled rejection and throw it to another fallback handler we already have.
    process.on('unhandledRejection', (reason: Error, promise: Promise<any>) => {
      Sentry.captureException(reason);
      throw reason;
    });

    process.on('uncaughtException', (error: Error) => {
      Sentry.captureException(error);
      errorHandler.handleError(error);
      if (!errorHandler.isTrustedError(error)) {
        process.exit(1);
      }
    });

    const typeDefs: DocumentNode = gql(schemas);
    const isGqlDev = config.isDev;

    const corsOptions = {
      credentials: true,
      origin: function(origin: string, callback: any) {
        if (configAws.corsWhitelist.indexOf(origin) !== -1 || !origin) {
          callback(null, true);
        } else if (config.isDev) {
          callback(null, true);
        } else {
          callback((a: any) => {
            systemLogger.warn(
              `Bad CORS origin: ${origin} | err: ${a.toString()}`,
            );
          });
        }
      },
    };

    //listens to the careclix-demographics collection for changes, if the change is an update for a document, it will trigger the api call to create a user for careclix
    CareclixDemographic.watch([], {
      //passing 'fullDocument: updateLookup' forces the listener to return the entire updated document. This is always included in insert functions but the parameter must be included for update events.
      fullDocument: 'updateLookup',
    }).on('change', (data: mongodb.ChangeStreamDocument<ICareclixUser>) => {
      if (data.operationType === 'update') {
        if (
          data.fullDocument.visitedTelemed === true &&
          data.fullDocument.sentToTelemed === false
        ) {
          careclix.careclixDemographicSend(data.fullDocument);
        } else {
          return 'telemed requirements not meant';
        }
      } else {
        return;
      }
    });

    this.app.use(cors(corsOptions));
    this.app.use('/', restApi);

    if (config.brand.toUpperCase() !== EBrands.CONNECT.valueOf())
      this.app.use('/siblingBrands', siblingBrandsRouter);

    //If we are going to use the same host for the restApi and paywiser, it worths to put all paywiser under a specific route.
    // Paywiser endpoints

    const saveRawBody = function(req: express.Request, res: express.Response, buf: Buffer, encoding?: string) {
      if (buf && buf.length) {
        (req as any).rawBody = buf.toString((encoding || 'utf8') as BufferEncoding);
      }
    }

    this.app.use(
      '/paywiser/notifications',
      express.json({verify: saveRawBody}),
      paywiserNotificationMiddleware,
      paywiserNotificationHandlerController.postUpdate,
    );
    this.app.use(
      '/paywiserMerchant/notifications',
      express.json({verify: saveRawBody}),
      paywiserNotificationMiddleware,
      paywiserMerchantNotificationHandlerController.postUpdate,
    );
    // Prizeout endpoints
    /* this.app.use('/prizeout/balance', express.json(), prizeoutNotificationController.postBalance);
    this.app.use('/prizeout/success', express.json(), prizeoutNotificationController.postSuccess);
    this.app.use('/prizeout/failure', express.json(), prizeoutNotificationController.postFailure);
    this.app.use('/prizeout/rejected', express.json(), prizeoutNotificationController.postRejected);*/
    //======================================================================================================================

    const server = new ApolloServer({
      typeDefs,
      resolvers,
      context: this.buildContext,
      dataSources: this.buildDataSources,
      introspection: isGqlDev,
      playground: isGqlDev
        ? { settings: { 'request.credentials': 'include' } }
        : false,
      subscriptions: {
        onConnect: async (connectionParams: any) => {
          try {
            const Authorization =
              connectionParams.Authorization ||
              connectionParams.authorization ||
              connectionParams.AUTHORIZATION;
            const token = Authorization
              ? Authorization.replace(/bearer /gi, '')
              : connectionParams.token;
            let user;
            try {
              user = await UserApi.fromIdToken(token);
              logger.startSession(user.userId);
            } catch (error) {
              logger.startSession();
              // logger.warn(`server.buildContext.catch: ${error}`);
              // ^ commented to limit sentry logs - 1.8m (prod) in 90 days
              user = null;
            }
            return { user };
          } catch (e) {}
        },
        onDisconnect: async (socket, context) => {
          const { token } = await context.initPromise;

          if (token) {
            try {
              const userApi: UserApi = await UserApi.fromCustomToken(token, true);              
              if (userApi) {
                const accountId = await userApi.getWalletBtcId();
                await removeListeners(accountId);
                await removeNotificationsListeners.BTC.removeListeners(accountId);
              }
            } catch (err) {
              logger.error(`Can't validate this token: '${token}'`);
            }
          }
        },
      },
    });

    server.applyMiddleware({
      app: this.app,
      cors: corsOptions,
    });

    this.httpServer = http.createServer(this.app);
    server.installSubscriptionHandlers(this.httpServer);
  }

  private getToken(
    connection: ExecutionParams,
    req: express.Request,
  ): string | null {
    if (connection?.context.token) {
      return connection.context.token;
    } else if (req?.headers.authorization) {
      return req.headers.authorization.replace(/bearer /gi, '');
    }

    return null;
  }

  private async buildContext({
    req,
    res,
    connection,
  }: {
    req: express.Request;
    res: express.Response;
    connection: ExecutionParams;
  }) {
    let user = null;
    const token = this.getToken(connection, req);

    if (token) {
      try {
        user = await UserApi.fromIdToken(token);
        logger.startSession(user.userId);
      } catch (error) {
        const cookieName =
          config.brand + '-token' + (config.isProd ? '' : '-stage');
        res.clearCookie(cookieName);
        logger.startSession();
        // logger.warn(`server.buildContext.catch: ${error}`);
        // ^ commented to limit sentry logs - 1.8m (prod) in 90 days
        user = null;
      }
    } else {
      user = connection?.context?.user;
    }

    return {
      req,
      res,
      user: user,
      wallet: this.walletApi,
      logger,      
    };
  }

  private buildDataSources() {
    return {
      cryptoFavorites: new CryptoFavorites(),
      environment: new WalletConfig(),
      bitly: new Bitly(),
      linkShortener:
        configAws.linkShortenerUrl.length > 1
          ? new LinkShortener()
          : new Bitly(),
      zendesk: new Zendesk(),
      sendEmail: new SendEmail(),
      blockfunnels: new Blockfunnels(),
    };
  }

  public async initialize() {
    try {
      walletApi.initialize();
      this.logRewardDistributerAddress();
      await this.connectToMongodb();
      this.postInit();
      this.listen();
      logMessage.logConfigAtStartup();      
    } catch (error) {
      const message = `Exception on server initialization: ${error.message}`;
      logger.exceptionContext(error, message, {});
    }
  }

  private listen() {
    this.httpServer.listen(configAws.port, () =>
      console.log(
        `🚀 ${config.brand.toUpperCase()} Wallet-Server ready on port ${
          configAws.port
        }`,
      ),
    );
  }

  private logRewardDistributerAddress = () => {
    console.log(
      `Reward distributer address: ${
        new Wallet(configSecrets.rewardDistributorKey).address
      }`,
    );
  };

  private async connectToMongodb() {
    return new Promise<void>(resolve => {
      mongooseConnection.once('open', () => {
        console.log(`Connected to mongoDb`);
        resolve();
      });

      mongooseConnection.on('error', error => {
        console.warn(error);
      });
    });
  }
}

export default new Server();
