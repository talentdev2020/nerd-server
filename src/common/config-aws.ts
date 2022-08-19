import * as autoBind from 'auto-bind';
import { PubSub } from 'apollo-server-express';
import { Connection, createConnection } from 'mongoose';
import * as supportedFavoriteOptions from 'src/data/supportedFavoriteOptions.json';
import { IFirebaseClient, EBrands } from 'src/types';
import { paywiserFiatMap, paywiserCryptoMap } from './paywiserSymbolMaps';
import { secretsFactory } from './secret-providers/secret-factory';
import { Secrets } from 'src/types/secret';
import { env } from 'src/common/env';
import { bool } from 'aws-sdk/clients/signer';
import logger from './logger/logger';
import config  from './config';

class ConfigAws {
  private secrets: Secrets;
  private secretObject: any = {};
  private secretJwtObject: any = {};
  private secretAccountObject: any = {};

  public readonly nodeEnv = config.nodeEnv;
  public readonly brand = config.brand.toLowerCase();
  private readonly envPath = `${config.isProd ? 'prod' : 'stage'}/${this.brand}/env`;
  private readonly jwtPath = `${config.isProd ? 'prod' : 'stage'}/jwtrsa`;
  private readonly accountPath = `${config.isProd ? 'prod' : 'stage'}/service-account-json`;
  
  // MONGODB_URI_<brand> Variables are present in the legacy K8S environment.
  // This allows us to dynamically and securly update mongodb URIS.
  // If the brand is not avaialble yet in the K8S environment it is a very
  // simple task for DevOps to add it.
  private determineMongoDBUri = (val: string) => {
    const mongoDBUri = this.determineMongoDBHost(val);
    return process.env[mongoDBUri];
  };

  public recordsMicroservice: any = {};
  public port: number = 0;
  public baseNumberOfShares: number = 0;
  public rewardWarnThreshold: number = 0;
  public corsWhitelist: string[] = [];
  public alertApiUrls: string[] = [];
  private displayWallets: string[] = [];
  public displayedWallets: string[] = [];
  public linkShortenerUrl: string = '';
  public redisInfo: any;
  public hostname: string;
  public careClixMaxDependents: Number;
  public logLevel: string;
  public mongodbUriKey: string;
  public mongodbUri: string;
  public cartUrl: string;
  public connectMongoConnection: Connection;

  public jwtPrivateKey: Buffer;
  public jwtPublicKey: Buffer;
  public serviceAccounts: any = {};
  
  public bitlyToken: string;
  public bitlyGuid: string;
  public defaultCryptoFavorites = ['BTC', 'ETH', 'LTC', 'XRP'];
  public nudgeTimeoutHours = 18;
  public nudgeCode = 'join_blockchain';
  public bypassTwoFaInDev: bool;
  public blockfunnelsUrl: string;
  public etherScanApiKey: string;
  public clientSecretKeyRequired: boolean;
  public erc20GasValue: number;
  public gasTipMultiplier: number;
  public firebaseClientInfo: IFirebaseClient;

  public companyFeeBtcAddresses: { [key: string]: string } = {
    // green: this.secretObject.COMPANY_FEE_BTC_ADDRESS_GREEN,
    // winx: this.secretObject.COMPANY_FEE_BTC_ADDRESS_WINX,
    // gala: this.secretObject.COMPANY_FEE_BTC_ADDRESS_GALA,
  };

  public coinMarketCapAPIKey: string;
  public coinMarketCapAPIUrl: string;
  public defaultFiatPriceCurrency: string;
  public cryptoNetwork: string;
  public walletClientDomain: string;
  public referralLinkDomain: string;
  public zendeskApiKey: string;
  public zendeskUrl: string;
  public cryptoSymbolToNameMap: Map<string, string>;
  public bcoinWallet: any;
  public bcoinRpc: any;

  public ethNodeUrl: string;
  public chainId: number;

  public btcTxLink: string;
  public ethTxLink: string;
  public vscodePid: string;

  public contractAddresses: any;
  public uniswapv2router: string;
  public uniswapv2factory: string;

  public tokenIds: { [key: string]: string };

  public pubsub = new PubSub();
  public newTransaction = 'NEW_TRANSACTION';
  public newBalance = 'NEW_BALANCE';

  // Paywiser Subscription
  public ibanConfirmation = 'IBAN_CONFIRMATION';
  // End Paywiser Subscription

  public sendGridApiKey: string;
  public sendGridEmailFrom: string;  

  public galaGamingApiUrl: string;

  public simplexEventsServiceUrl: string;
  public simplexJwtServiceUrl: string;
  public simplexJwtServiceSecret: string;
  public simplexPartnerName: string;

  public galaClaimFeeReceiveAddress: string;
  public claimFeeReceiveAddress: string;
  public tokenClaimsApiUrl: string;
  //public nodeSelectorUrl = this.secretObject.NODE_SELECTOR_URL;
  public exchangeUrl: string;

  public s3Bucket: string;
  public s3Region: string;

  public costPerLootBox = 0; //this.normalizeNumber(this.secretObject.COST_PER_LOOT_BOX);

  public supportsDisplayNames: bool;

  public supportsBtcPubsub: bool;

  public paywiserMapFiat = paywiserFiatMap;
  public paywiserMapCrypto = paywiserCryptoMap;

  public indexedTransactions: bool;
  public etherscanNetwork: string;

  public defaultReferredBy: string;

  public careclixSignUpUrl: string;

  public baseCareclixUrl: string;
  public WalletServersSiblingBrandsUrls: any;

  public paywiserCryptoHost: string;
  public paywiserCryptoUsername: string;
  public paywiserCryptoPassword: string;
  public paywiserKYCHost: string;
  public paywiserMerchantHost: string;
  public paywiserMerchantValidMinutes: number;
  public paywiserKYCUsername: string;
  public paywiserKYCPassword: string;
  public paywiserMerchantUsername: string;
  public paywiserMerchantPassword: string;
  public paywiserNotificationSecret: string;
  public paywiserRegularAccount: string;
  public paywiserPlatinumAccount: string;
  public paywiserAuthHost: string;
  public paywiserAuthUsername: string;
  public paywiserAuthPassword: string;

  public wpApiUrl: string;
  public wpApiKey: string;

  public paywiserIbanHost: string;
  public paywiserIbanUsername: string;
  public paywiserIbanPassword: string;

  public coreUrl:string;
  public coreAPIKey:string;

  public initialize = async () => {
    try {
      this.secrets = secretsFactory.getSecretInstance();
      this.secretObject = await this.secrets.getSecretValue(this.envPath);
      this.secretJwtObject = await this.secrets.getSecretValue(this.jwtPath);
      this.secretAccountObject = await this.secrets.getSecretValue(this.accountPath);
    }
    catch(err) {
      logger.errorContext('config-aws.initialize.secrets', {"err": err.message, "config": JSON.stringify(this), "url: ": this.envPath});
      console.log(`config-aws.initialize.secrets :: url: ${this.envPath}`);
      console.log(err);
    }
    try {

      const microPort = this.normalizeNumber(this.secretObject.RECORDS_MICROSERVICE_PORT);

      this.recordsMicroservice = {
        host: this.secretObject.RECORDS_MICROSERVICE_HOST,
        port: microPort,
      };
      this.port = this.normalizeNumber(this.secretObject.PORT);
      this.baseNumberOfShares = this.normalizeNumber(
        this.secretObject.BASE_NUMBER_OF_SHARES,
      );
      this.rewardWarnThreshold = this.normalizeNumber(
        this.secretObject.REWARD_WARN_THRESHOLD,
      );
      this.corsWhitelist = this.secretObject.CORS_ALLOWED.split(',');
      this.alertApiUrls = JSON.parse(this.secretObject.ALERT_API_URLS);
      this.displayWallets = this.secretObject.DISPLAYED_WALLETS.split(',');
      this.displayedWallets = this.displayWallets.map(symbol =>
        symbol.toLowerCase(),
      );

      this.linkShortenerUrl =
        this.secretObject.LINK_SHORTENER_URL.length > 1
          ? this.secretObject.LINK_SHORTENER_URL
          : '';
      this.hostname = this.secretObject.APP_HOSTNAME;

      this.redisInfo = {
        host: this.secretObject.REDIS_HOST,
        port: this.secretObject.REDIS_PORT,
        password: this.secretObject.REDIS_PASSWORD,
      };

      this.careClixMaxDependents = Number(
        this.secretObject.CARECLIX_MAX_DEPENDENTS,
      );

      this.mongodbUriKey = this.determineMongoDBHost(this.brand);
      this.mongodbUri = this.determineMongoDBUri(this.brand);
      this.cartUrl = this.secretObject.CART_URL;

      this.bitlyToken = this.secretObject.BITLY_API_KEY;
      this.bitlyGuid = this.secretObject.BITLY_GUID;
      this.defaultCryptoFavorites = ['BTC', 'ETH', 'LTC', 'XRP'];
      this.nudgeTimeoutHours = 18;
      this.nudgeCode = 'play_townstar';
      this.bypassTwoFaInDev =
        this.secretObject.BYPASS_TWOFA_IN_DEV &&
        this.secretObject.BYPASS_TWOFA_IN_DEV.toLowerCase() === 'true';
      //this.apiKeyServiceUrl = this.secretObject.API_KEY_SERVICE_URL;
      this.blockfunnelsUrl = `https://${this.secretObject.BLOCKFUNNELS_URL}/api`;
      this.etherScanApiKey = this.secretObject.ETHERSCAN_API_KEY;
      this.clientSecretKeyRequired =
        this.secretObject.CLIENT_SECRET_KEY_REQUIRED !== undefined &&
        this.secretObject.CLIENT_SECRET_KEY_REQUIRED === 'true';
      this.erc20GasValue = +this.secretObject.ERC20_GAS_VALUE;
      this.gasTipMultiplier =
        this.secretObject.GAS_TIP_MULTIPLIER &&
        +this.secretObject.GAS_TIP_MULTIPLIER > 0 &&
        +this.secretObject.GAS_TIP_MULTIPLIER < 100
          ? +this.secretObject.GAS_TIP_MULTIPLIER
          : 0;

      this.companyFeeBtcAddresses = {
        // green: this.secretObject.COMPANY_FEE_BTC_ADDRESS_GREEN,
        // winx: this.secretObject.COMPANY_FEE_BTC_ADDRESS_WINX,
        // gala: this.secretObject.COMPANY_FEE_BTC_ADDRESS_GALA,
      };

      this.coinMarketCapAPIKey = this.secretObject.COINMARKETCAP_API_KEY;
      this.coinMarketCapAPIUrl = this.secretObject.COINMARKETCAP_API_URL;
      this.defaultFiatPriceCurrency = this.secretObject.DEFAULT_FIAT_PRICE_CURRENCY;
      this.cryptoNetwork = this.secretObject.CRYPTO_NETWORK;
      this.walletClientDomain = this.secretObject.WALLET_CLIENT_DOMAIN;
      this.referralLinkDomain = this.secretObject.REFERRAL_LINK_DOMAIN;
      this.zendeskApiKey = this.secretObject.ZENDESK_API_KEY;
      this.zendeskUrl = this.secretObject.ZENDESK_URL;
      this.cryptoSymbolToNameMap = this.mapSymbolToName();
      this.bcoinWallet = {
        host: this.secretObject.BCOIN_WALLET_HOST,
        ssl:
          this.secretObject.BCOIN_WALLET_SSL &&
          this.secretObject.BCOIN_WALLET_SSL.toLowerCase() === 'true',
        uri: this.secretObject.CRYPTO_NETWORK,
        walletAuth: true,
        network: this.secretObject.CRYPTO_NETWORK,
        port: +this.secretObject.BCOIN_WALLET_PORT,
        apiKey: this.secretObject.BCOIN_WALLET_API_KEY,
      };
      this.bcoinRpc = {
        ...this.bcoinWallet,
        port: this.secretObject.BCOIN_NODE_PORT
          ? +this.secretObject.BCOIN_NODE_PORT
          : 0,
        apiKey: this.secretObject.BCOIN_NODE_API_KEY,
      };

      this.ethNodeUrl = this.secretObject.ETH_NODE_URL;
      this.chainId = +this.secretObject.CHAIN_ID;

      this.btcTxLink = this.secretObject.BTC_TX_LINK_BASE;
      this.ethTxLink = this.secretObject.ETH_TX_LINK_BASE;
      this.vscodePid = this.secretObject.VSCODE_PID;

      this.contractAddresses = {
        green: this.secretObject.GREEN_ADDRESS,
        gala: this.secretObject.GALA_ADDRESS,
        galaItem: this.secretObject.GALA_ITEM_CONTRACT_ADDRESS,
        wrappedBtcMain: this.secretObject.CONTRACT_ADDRESS_WBTC,
        wrappedEthMain: this.secretObject.CONTRACT_ADDRESS_WETH,
        galaMain: this.secretObject.CONTRACT_ADDRESS_GALA,
        greenMain: this.secretObject.CONTRACT_ADDRESS_GREEN,
        usdtMain: this.secretObject.CONTRACT_ADDRESS_USDT,
        usdcMain: this.secretObject.CONTRACT_ADDRESS_USDC,
        busdMain: this.secretObject.CONTRACT_ADDRESS_BUSD,
        batMain: this.secretObject.CONTRACT_ADDRESS_BAT,
      };
      this.uniswapv2router = this.secretObject.UNISWAPV2ROUTER;
      this.uniswapv2factory = this.secretObject.UNISWAPV2FACTORY;

      this.tokenIds = {
        gala: this.secretObject.GALA_TOKEN_ID,
      };

      this.sendGridApiKey = this.secretObject.SENDGRID_API_KEY;
      this.sendGridEmailFrom = this.secretObject.SENDGRID_EMAIL_FROM;      

      this.galaGamingApiUrl = this.secretObject.GALA_GAMING_API_URL;

      this.simplexEventsServiceUrl = this.secretObject.SIMPLEX_EVENTS_SERVICE_URL;
      this.simplexJwtServiceUrl = this.secretObject.SIMPLEX_JWT_SERVICE_URL;
      this.simplexJwtServiceSecret = this.secretObject.SIMPLEX_JWT_SERVICE_SECRET;
      this.simplexPartnerName = this.secretObject.SIMPLEX_PARTNER_NAME;

      this.galaClaimFeeReceiveAddress = this.secretObject.GALA_CLAIM_FEE_RECEIVE_ADDRESS;
      this.claimFeeReceiveAddress = this.secretObject.CLAIM_FEE_RECEIVE_ADDRESS;
      this.tokenClaimsApiUrl = this.secretObject.TOKEN_CLAIMS_API_URL;
      //this.nodeSelectorUrl = this.secretObject.NODE_SELECTOR_URL;
      this.exchangeUrl = this.secretObject.EXCHANGE_URL;

      this.s3Bucket = this.secretObject.S3_BUCKET;
      this.s3Region = this.secretObject.S3_REGION;

      this.costPerLootBox = 0; //this.normalizeNumber(this.secretObject.COST_PER_LOOT_BOX);

      this.supportsDisplayNames =
        this.secretObject.SUPPORTS_DISPLAY_NAMES === 'true';

      this.wpApiUrl = this.secretObject.WP_API_URI;
      this.wpApiKey = this.secretObject.WP_API_KEY;

      this.supportsBtcPubsub = this.secretObject.SUPPORTS_BTC_PUBSUB === 'true';

      this.paywiserMapFiat = paywiserFiatMap;
      this.paywiserMapCrypto = paywiserCryptoMap;

      this.indexedTransactions =
        this.secretObject.INDEXED_TRANSACTIONS === 'true';
      this.etherscanNetwork =
        this.secretObject.CRYPTO_NETWORK === 'testnet'
          ? 'ropsten'
          : 'homestead';

      this.defaultReferredBy = this.secretObject.DEFAULT_REFERRED_BY || '';

      this.careclixSignUpUrl = `https://${this.secretObject.CARECLIX_URL}/auth/signup`;

      this.baseCareclixUrl = `${this.secretObject.CARECLIX_URL}`;
      this.WalletServersSiblingBrandsUrls = this.GetWalletServersSiblingBrandsUrls();

      this.paywiserCryptoHost = this.secretObject.PAYWISER_CRYPTO_HOST;
      this.paywiserCryptoUsername = this.secretObject.PAYWISER_CRYPTO_USERNAME;
      this.paywiserCryptoPassword = this.secretObject.PAYWISER_CRYPTO_PASSWORD;
      this.paywiserKYCHost = this.secretObject.PAYWISER_KYC_HOST;
      this.paywiserMerchantHost = this.secretObject.PAYWISER_MERCHANT_HOST;
      this.paywiserMerchantValidMinutes = 1;
      this.paywiserKYCUsername = this.secretObject.PAYWISER_KYC_USERNAME;
      this.paywiserKYCPassword = this.secretObject.PAYWISER_KYC_PASSWORD;
      this.paywiserMerchantUsername = this.secretObject.PAYWISER_MERCHANT_USERNAME;
      this.paywiserMerchantPassword = this.secretObject.PAYWISER_MERCHANT_PASSWORD;
      this.paywiserNotificationSecret = this.secretObject.PAYWISER_NOTIFICATION_SECRET;

      this.paywiserIbanHost = this.secretObject.PAYWISER_IBAN_HOST;
      this.paywiserIbanUsername = this.secretObject.PAYWISER_IBAN_USERNAME;
      this.paywiserIbanPassword = this.secretObject.PAYWISER_IBAN_PASSWORD;

      this.paywiserRegularAccount = this.secretObject.PAYWISER_REGULAR_ACCOUNT;
      this.paywiserPlatinumAccount = this.secretObject.PAYWISER_PLATINUM_ACCOUNT;
      this.paywiserAuthHost = this.secretObject.PAYWISER_AUTH_HOST;
      this.paywiserAuthUsername = this.secretObject.PAYWISER_AUTH_USERNAME;
      this.paywiserAuthPassword = this.secretObject.PAYWISER_AUTH_PASSWORD;

      this.coreUrl = this.secretObject.CORE_URL;
      this.coreAPIKey = this.secretObject.CORE_API_KEY;

      this.firebaseClientInfo = {
        ApiKey: this.secretObject.FIREBASE_CLIENT_API_KEY,
        AuthDomain: this.secretObject.FIREBASE_CLIENT_AUTH_DOMAIN,
        ProjectId: this.secretObject.FIREBASE_CLIENT_PROJECT_ID,
      };

      this.jwtPrivateKey = Buffer.from(atob(this.secretJwtObject["private-key-64"]), "utf-8");
      this.jwtPublicKey = Buffer.from(atob(this.secretJwtObject["public-key-64"]), "utf-8");
      this.serviceAccounts = JSON.parse(atob(this.secretAccountObject["accounts-64"]));
      
      console.log(`AWS Config is connected to : ${ this.envPath }`);
      //this.ensureRequiredVariables();   //TODO : set this back up connecting to AWS instead of .env
      this.setConnectMongoConnection();
    } catch (err) {
      logger.errorContext('config-aws.initialize', {"err": err.message, "config": JSON.stringify(this)});
      console.log('error config-aws.initialize');
      console.log(err);
    }
  };

  private determineMongoDBHost = (val: string) => {
    const mongoDBUriHost = 'MONGODB_URI_' + val.toUpperCase();
    return mongoDBUriHost;
  };

  private GetWalletServersSiblingBrandsUrls = () => {
    const toReturnMap = new Map<EBrands, string>();
    if (this.brand === 'connect') {
      Object.values(EBrands)
        .filter(value => value !== 'CONNECT')
        .forEach(value => {
          const host = this.secretObject[`WALLET_SERVER_${value}_URL`];
          if (host) {
            toReturnMap.set(`${value}` as EBrands, host);
          }
        });
    }
    return toReturnMap;
  };

  public readonly emailLists = {
    general: 'b6a6a9d6-6130-4567-8b43-6bb2b51457dd',
    upgrade: '428d8fdc-921d-41b9-ad8d-2555b2018f90',
    nodeOwner: 'a6c5b10b-7a11-47ad-b2f3-3fdab6d24eea',
  };

  public readonly sendgridTemplateIds = {
    verifyEmailNewUser: 'd-fb448b5842414c1faf568e9648dd3546',
    verifyEmailExistingUser: 'd-5c4129cd88004c1e88182876350d527a',
    referredNewUser: 'd-d34540ca262c4be48bcf1ab374180d3a',
    firstNodePurchase: 'd-b2a96c51d933480f8af2e889a763a9f1',
    nudgeFriend: 'd-349e75e16d764231b995bf2b2e140484',
    referredUpgrade: 'd-560a41dccf96491fa07d53997d16828c',
  };

  public sendgridUnsubscribeGroupIds = {
    general: 14643,
  };

  constructor() {
    autoBind(this);
  }

  private ensureRequiredVariables() {
    // required environment variables
    const missingEnvVariables = [
      'ALERT_API_URLS',
      'API_KEY_SERVICE_URL',
      'APP_HOSTNAME',
      'BASE_NUMBER_OF_SHARES',
      'BCOIN_WALLET_API_KEY',
      'BCOIN_WALLET_HOST',
      'BCOIN_WALLET_PORT',
      'BCOIN_WALLET_SSL',
      'BTC_TX_LINK_BASE',
      'CART_URL',
      'CLAIM_FEE_RECEIVE_ADDRESS',
      'COMPANY_FEE_BTC_ADDRESS_GALA',
      'COMPANY_FEE_BTC_ADDRESS_GREEN',
      'COMPANY_FEE_BTC_ADDRESS_WINX',
      'COMPANY_FEE_ETH_ADDRESS',
      'CORS_ALLOWED',
      'CRYPTO_NETWORK',
      'DISPLAYED_WALLETS',
      'ERC20_GAS_VALUE',
      'ETH_ADD_FOR_ERC20_FEE_CALC',
      'ETH_NODE_URL',
      'ETH_TX_LINK_BASE',
      'ETHERSCAN_API_KEY',
      'EXCHANGE_URL',
      'FIREBASE_CLIENT_API_KEY',
      'FIREBASE_CLIENT_AUTH_DOMAIN',
      'FIREBASE_CLIENT_PROJECT_ID',
      'GALA_ADDRESS',
      'GALA_GAMING_API_URL',
      'GALA_ITEM_CONTRACT_ADDRESS',
      'GALA_TOKEN_ID',
      'GALA_TOKEN_ID',
      'GREEN_ADDRESS',
      'LINK_SHORTENER_URL',
      'NODE_ENV',
      'PORT',
      'REDIS_HOST',
      'REDIS_PASSWORD',
      'REDIS_PORT',
      'REFERRAL_LINK_DOMAIN',
      'REWARD_DISTRIBUTOR_ETH_PKEY',
      'REWARD_WARN_THRESHOLD',
      'S3_BUCKET',
      'S3_REGION',
      'SENDGRID_API_KEY',
      'SENDGRID_EMAIL_FROM',
      'SENTRY_DSN',
      'SUPPORTS_BTC_PUBSUB',
      'SUPPORTS_DISPLAY_NAMES',
      'WP_API_URL',
      'ZENDESK_API_KEY',
      'ZENDESK_URL',
    ].filter(name => !(name in env));
    if (missingEnvVariables.length > 0) {
      throw new Error(
        `Required environment variable(s) ${missingEnvVariables.join(
          ', ',
        )} undefined.`,
      );
    }
    //--------- SWITCH ONLY -------------
    if (this.brand === 'switch') {
      const missingSwitchVariables = [
        'PAYWISER_CRYPTO_HOST',
        'PAYWISER_CRYPTO_PASSWORD',
        'PAYWISER_CRYPTO_USERNAME',
        'PAYWISER_IBAN_HOST',
        'PAYWISER_IBAN_PASSWORD',
        'PAYWISER_IBAN_USERNAME',
        'PAYWISER_KYC_HOST',
        'PAYWISER_KYC_PASSWORD',
        'PAYWISER_KYC_USERNAME',
        'PAYWISER_MERCHANT_HOST',
        'PAYWISER_MERCHANT_PASSWORD',
        'PAYWISER_MERCHANT_USERNAME',
        'PAYWISER_NOTIFICATION_SECRET',
      ].filter(name => !env[name]);
      if (missingSwitchVariables.length > 0) {
        throw new Error(
          `Required SWITCH environment variable(s) ${missingSwitchVariables.join(
            ', ',
          )} undefined.`,
        );
      }
    }
    //--------- BLUE ONLY -------------
    if (this.brand === 'blue') {
      const missingBlueVariables = [
        'CARECLIX_MAX_DEPENDENTS',
        'CARECLIX_URL',
      ].filter(name => !env[name]);
      if (missingBlueVariables.length > 0) {
        throw new Error(
          `Required BLUE environment variable(s) ${missingBlueVariables.join(
            ', ',
          )} undefined.`,
        );
      }
    }
  }

  public async setConnectMongoConnection() {
    const connectMongoUrl = env.MONGODB_URI_CONNECT;
    if (
      !this.hostname.includes('localhost') &&
      !['gala', 'connect'].includes(this.brand) &&
      connectMongoUrl !== undefined
    ) {
      this.connectMongoConnection = await createConnection(connectMongoUrl);
    }
  }

  private normalizeNumber(val: string) {
    const numberValue = parseInt(val, 10);

    if (isNaN(numberValue)) {
      // named pipe
      throw new Error(`Failed to normalize ${val} as a number`);
    }

    if (numberValue >= 0) {
      // numberValue number
      return numberValue;
    }

    throw new Error(
      `Failed to normalize as number greater than 0: ${numberValue}`,
    );
  }

  private mapSymbolToName() {
    const symbolToName = new Map();

    supportedFavoriteOptions.forEach(({ name, symbol }) => {
      symbolToName.set(symbol, name);
    });

    return symbolToName;
  }
}

const configAws = new ConfigAws();
export default configAws;
