import { Context, IFiatPrices, IServiceHealth, IWSHealthCheck } from '../types';
import { auth, config, configAws, logger, ResolverBase } from "src/common";
import { ethers } from 'ethers';
import axios from 'axios';
import {createClient} from 'redis'
import {connection as mongooseConnection } from 'mongoose';
import * as Sentry from '@sentry/node';
const {version} = require('../../package.json');

class Resolver extends ResolverBase {
    private quotesLatestUrl = `${configAws.coinMarketCapAPIUrl}/cryptocurrency/quotes/latest`;
    private cryptoKey =  configAws.coinMarketCapAPIKey;
    private client: any = createClient(configAws.redisInfo);

    checkAllHealtServices = async (
        parent: any,
        args: {},
        { user }: Context,
      ): Promise<any> => {
        this.requireAdmin(user);  

        const healthChecks: IServiceHealth[] = []; 
        let uniqueHealthCheck: IServiceHealth;

        // Infura

        try {
            if(!configAws.ethNodeUrl) throw new Error('Eth Node Configuration is not completed')
            const provier = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);
            const blockNumber = await provier.getBlockNumber();
            logger.info('Infura connected blockNumber: ' + blockNumber);
            uniqueHealthCheck = {
                name: 'Infura',
                url: configAws.ethNodeUrl,
                status: true,
                info: 'Connected with blocknumber: ' + blockNumber,
            };
            healthChecks.push(uniqueHealthCheck);
        } catch (error) {
            logger.warn(`Infura disconnected: ${error}`);
            uniqueHealthCheck = {
                name: 'Infura',
                url: configAws.ethNodeUrl,
                status: false,
                info: 'Disconnected ' + error.message,
            };
            healthChecks.push(uniqueHealthCheck);
        };

        // CointMarketCap

        try {

            const params = {
                symbol: 'BTC',
                convert: 'USD',            
            };
            
            const headers = {
                'X-CMC_PRO_API_KEY':this.cryptoKey,
                "Accept": 'application/json',
                'Accept-Encoding': 'deflate, gzip',
            };
    
              const {
                data,
              } = await axios.get(this.quotesLatestUrl,
                { params,headers},            
              );
              
            if(!data) throw new Error('Failed to get data from Coin Market Cap')

            logger.info('CoinMarketCap connected BTC price: ' + data.data.BTC.quote.USD.price);
            uniqueHealthCheck = {
                name: 'CoinMarketCap',
                url: this.quotesLatestUrl,
                status: true,
                info: 'Connected with BTC price: ' + data.data.BTC.quote.USD.price,
            };
            healthChecks.push(uniqueHealthCheck);
        } catch (error) {
            logger.warn(`CoinMarketCap disconnected: ${error}`);
            uniqueHealthCheck = {
                name: 'CoinMarketCap',
                url: this.quotesLatestUrl,
                status: false,
                info: 'Disconnected',
            };
            healthChecks.push(uniqueHealthCheck);
        };

        // Sentry

        try {
          const {status} = await axios.get("http://sentry.io")
          if(status !== 200) throw new Error('Sentry is down. Report status: ' + status);
          logger.info('Sentry connected status: ' + status);
          uniqueHealthCheck = {
              name: 'Sentry',
              url: 'http://sentry.io',
              status: true,
              info: 'Connected server status: ' + status,
          };
          healthChecks.push(uniqueHealthCheck);
        } catch (error) {
            logger.warn(`Sentry disconnected: ${error}`);
            uniqueHealthCheck = {
                name: 'Sentry',
                url: 'http://sentry.io',
                status: false,
                info: 'Disconnected ' + error.message,
            };
            healthChecks.push(uniqueHealthCheck);
        }

        // MongoDB

        try {
            const status = mongooseConnection.readyState;
            if(status !== 1) throw new Error("Mongo db configuration is wrong couldn't connect " + status);
            logger.info('Mongo DB configuration status: ' + status);
            const { ok } = await mongooseConnection.db.admin().ping();
            if(ok !== 1) throw new Error('Return status of ' + ok)
            logger.info('Mongo DB connected status: ' + ok);
            uniqueHealthCheck = {
                name: 'Mongo DB',
                url: 'NA',
                status: true,
                info: 'Connected server responded ping with pong',
            };
            healthChecks.push(uniqueHealthCheck);
        } catch (error) {
            logger.warn(`Mongo DB disconnected: ${error}`);
            uniqueHealthCheck = {
                name: 'Mongo DB',
                url: 'NA',
                status: false,
                info: 'Disconnected ' + error.message,
            };
            healthChecks.push(uniqueHealthCheck);
        };

        // Firebase

        try {
            const token = await auth.signInWithDifferentCustomToken(
                user.token,
                config.hostname,
              );
            if(!token) throw new Error('Unavailable to sign in on firebase JWT expires');

            logger.info('Firebase connected');
            uniqueHealthCheck = {
                name: 'Firebase',
                url: config.hostname,
                status: true,
                info: 'Connected signInWithDifferentCustomToken pass',
            };
            healthChecks.push(uniqueHealthCheck);
        } catch (error) {
            logger.warn(`Firebase disconnected: ${error}`);
            const mongooseServiceHealth: IServiceHealth = {
                name: 'Firebase',
                url: config.hostname,
                status: false,
                info: 'Disconnected ' + error.message,
            };
            healthChecks.push(mongooseServiceHealth);
        };

        // Redis

        try {
            const [ping] = await Promise.all([
                this.client.ping(),
              ]);
              
            if(!ping) throw new Error('Redis Server is not connected ');
            logger.info('Redis connected status: ' + ping);
            uniqueHealthCheck = {
                name: 'Redis',
                url: 'NA',
                status: true,
                info: 'Connected server responded ping with pong',
            };
            healthChecks.push(uniqueHealthCheck);
        } catch (error) {
            logger.warn(`Redis disconnected: ${error}`);
            uniqueHealthCheck = {
                name: 'Redis',
                url: 'NA',
                status: false,
                info: 'Disconnected ' + error.message,
            };
            healthChecks.push(uniqueHealthCheck);
        };
    
        // WordPress (MemberPress)

        try {
            const url = `${configAws.wpApiUrl}/bb_iam/v1/wordpress/health?ApiKey=${configAws.wpApiKey}`;
            const resp: {
              data: {
                pass: boolean;
                plugin: string;
                version: number;
              };
            } = await axios.post(url, null);
      
            if (!resp.data.pass) throw new Error('WordPress is not connected');

            uniqueHealthCheck = {
                name: 'WordPress',
                url: configAws.wpApiUrl,
                status: true,
                info: 'Connected plugin test: ' + resp.data.plugin,
            };
            healthChecks.push(uniqueHealthCheck);
          } catch (error) {
            logger.warn(`WordPress disconnected: ${error}`);
            uniqueHealthCheck = {
                name: 'WordPress',
                url: configAws.wpApiUrl,
                status: false,
                info: 'Disconnected ' + error.message,
            };
            healthChecks.push(uniqueHealthCheck);
          };

        const walletServerHealth: IWSHealthCheck = {
            walletServerVersion: version,
            servicesHealth: healthChecks,
        }
        return walletServerHealth
      }

}

const resolver = new Resolver;

export default {
    Query :{
        checkAllHealthServices: resolver.checkAllHealtServices,
    },       
}