import * as autoBind from 'auto-bind';
import { PubSub } from 'apollo-server-express';
import { env } from 'src/common/env';

class Config {
  // MONGODB_URI_<brand> Variables are present in the legacy K8S environment.
  // This allows us to dynamically and securly update mongodb URIS.
  // If the brand is not avaialble yet in the K8S environment it is a very
  // simple task for DevOps to add it.
  private determineMongoDBUri = (val: string) => {
    const mongoDBUri = this.determineMongoDBHost(val);
    return process.env[mongoDBUri];
  };

  private determineMongoDBHost = (val: string) => {
    const mongoDBUriHost = 'MONGODB_URI_' + val.toUpperCase();
    return mongoDBUriHost;
  };
  
  public readonly nodeEnv = env.NODE_ENV;
  public readonly brand = process.env.BRAND.toLowerCase();
  public readonly hostname = env.APP_HOSTNAME;
  public readonly mongodbUriKey = this.determineMongoDBHost(process.env.BRAND);
  public readonly mongodbUri = this.determineMongoDBUri(process.env.BRAND);
  public readonly awsDefaultRegion = process.env.AWS_DEFAULT_REGION;
  //public connectMongoConnection: Connection;
  public readonly isDev = env.NODE_ENV !== 'production';
  public readonly isStage = env.IS_STAGE === 'true';
  public readonly isProd = env.NODE_ENV === 'production' && !this.isStage;
  public readonly sentryDsn = 'https://50cdb9bbb35e496c9d17118b15d09a37@o850109.ingest.sentry.io/5857974'; //used for STAGE and PROD 
  
  public readonly apiKeyServiceUrl: string = env.API_KEY_SERVICE_URL;

  public pubsub = new PubSub();

  public readonly newTransaction = 'NEW_TRANSACTION';
  public readonly newBalance = 'NEW_BALANCE';
  // Paywiser Subscription
  public readonly ibanConfirmation = 'IBAN_CONFIRMATION';
  // End Paywiser Subscription

  constructor() {
    autoBind(this);
  }
}

const config = new Config();
export default config;
