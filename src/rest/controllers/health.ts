import { Request, Response } from 'express';
import * as autoBind from 'auto-bind';
import { systemLogger } from '../../common/logger';
import { config, configAws } from '../../common';
import { credentialService } from '../../services';
import TokenMinter from 'src/services/minter/green/token-minter-erc20';
import WinCommisionMinter from 'src/services/minter/connect/win-commission-minter';
import { minterFactory } from 'src/services/minter';
const {version} = require('../../../package.json');
import secretKeys from 'src/common/secret-keys';

const NodeRSA = require('node-rsa');
const pem2jwk = require('pem-jwk');

const jwksCache: { keys?: any[] } = {
  keys: null,
};

class Controller {
  constructor() {
    autoBind(this);
  }

  // This Healthcheck MUST respond to an unauthenticated GET request with
  // a 200 response. Any app-breaking errors should result in a 500 response.
  //
  // Ref: https://tools.ietf.org/html/draft-inadarei-api-health-check-05
  public async getHealth(req: Request, res: Response) {
    res.setHeader('Content-Type', 'application/health+json');

    try {
      // If everything is good then this is the expected output.

      const ftKnoxStatus = await this.getHealthEnvKnox(req, res);
      const configStatus = await this.getHealthConfig(req, res);
      const configAwsStatus = await this.getHealthConfigAws(req, res);

      let status: string = '';
      if(ftKnoxStatus && configStatus && configAwsStatus){
        status = 'pass';
      }
      else{
        status = 'fail';
      }
    

      return res.json({ status });

      // When something in the app is failing / taking too long etc, but the
      // application is still working for the most part you would return 200
      // with a status message of "warn" a good practice to display a
      // non-sensitive error describing the issue.
      //
      // res.json({ status: "warn", output: err.message });

      // When a test/check fails send 500 and status of failure. it is also
      // a good practice to display a non-sensitive error describing the issue.
      //
      // res.status(500).json({ status: "fail", output: err.message });
    } catch (err) {
      systemLogger.error(err.stack);
      return res.sendStatus(500);
    }
  }

  // This Healthcheck MUST respond to an unauthenticated GET request with
  // a 200 response. Any app-breaking errors should result in a 500 response.
  //
  // Ref: https://tools.ietf.org/html/draft-inadarei-api-health-check-05
  public async getHealthDetails(req: Request, res: Response) {
    res.setHeader('Content-Type', 'application/health+json');

    try {
      // If everything is good then this is the expected output.

      const ftKnoxStatus = await this.getHealthEnvKnox(req, res);
      const configStatus = await this.getHealthConfig(req, res);
      const configAwsStatus = await this.getHealthConfigAws(req, res);

      let status: string = '';
      if(ftKnoxStatus && configStatus && configAwsStatus){
        status = 'pass';
      }
      else{
        status = 'fail';
      }   

      return res.json({ ftKnox: ftKnoxStatus, config: configStatus, configAws: configAwsStatus });

      // When something in the app is failing / taking too long etc, but the
      // application is still working for the most part you would return 200
      // with a status message of "warn" a good practice to display a
      // non-sensitive error describing the issue.
      //
      // res.json({ status: "warn", output: err.message });

      // When a test/check fails send 500 and status of failure. it is also
      // a good practice to display a non-sensitive error describing the issue.
      //
      // res.status(500).json({ status: "fail", output: err.message });
    } catch (err) {
      systemLogger.error(err.stack);
      return res.sendStatus(500);
    }
  }

  // This Healthcheck MUST respond to an unauthenticated GET request with
  // a 200 response. Any app-breaking errors should result in a 500 response.
  //
  // Ref: https://tools.ietf.org/html/draft-inadarei-api-health-check-05
  public async getHealthConfig(req: Request, res: Response) {
    res.setHeader('Content-Type', 'application/health+json');

    try {
    
      const brand = config.brand;
      if(!brand){
        throw new Error('no brand in config');
      }

      const nodeEnv = config.nodeEnv;
      if(!nodeEnv){
        throw new Error('no NODE_ENV in config');
      }

      const corsWhitelist = configAws.corsWhitelist;
      if(!corsWhitelist) {
        throw new Error('invalid CORS_WHITELIST');
      }

      return true;

    } catch (err) {
      systemLogger.error(err.stack);
    }
    return false;
  }

  // This Healthcheck MUST respond to an unauthenticated GET request with
  // a 200 response. Any app-breaking errors should result in a 500 response.
  //
  // Ref: https://tools.ietf.org/html/draft-inadarei-api-health-check-05
  private async getHealthConfigAws(req: Request, res: Response) {
    res.setHeader('Content-Type', 'application/health+json');

    try {
    
      const wpApiUrl = configAws.wpApiUrl;
      if(!wpApiUrl){
        throw new Error('no wpApiUrlUrl in configAws');
      }

      const contractAddresses = configAws.contractAddresses;
      if(!contractAddresses){
        throw new Error('no contractAddresses in configAws');
      }

      const coinMarketCap = configAws.coinMarketCapAPIKey;
      if(!coinMarketCap){
        throw new Error('no coinMarketCapAPIKey in configAWS');
      }

      const ethNode = configAws.ethNodeUrl;
      if(!ethNode){
        throw new Error('no ethNodeUrl in configAWS');
      }

      
      return true;
    } catch (err) {
      systemLogger.error(err.stack);
    }
    return false;
  }

  private async getHealthEnvKnox(req: Request, res: Response): Promise<boolean> {
    try {
      // If everything is good then this is the expected output.
      const minter = minterFactory.createTokenMinter('TEST_USER');
      return minter.loadedCorrectly();
    } catch (err) {
      systemLogger.errorContext('rest.controllers.health.getHealthEnvKnox failed' +  err.message, {"message": err.message, "stack": err.stack});
    }
    
    return false;
  }

  // TODO: move this to it's own controller
  public async getJwks(req: Request, res: Response) {
    res.setHeader('Content-Type', 'application/health+json');

    // ugly proof of concept
    if (!jwksCache.keys) {
      jwksCache.keys = secretKeys.serviceAccounts
        // .filter( (k:any) => k.project_id === 'connectblockchain-stage')
        .map((k: any) => {
          const { project_id, private_key } = k;
          const pub = new NodeRSA(private_key).exportKey('pkcs8-public-pem');
          const jwk = pem2jwk.pem2jwk(pub);
          jwk.kid = project_id;
          return jwk;
        })
        .filter((jwk: any, idx: Number, jwks: any[]) => {
          return idx === jwks.findIndex(t => t.kid === jwk.kid);
        });
    }

    try {
      return res.json({ keys: jwksCache.keys });
    } catch (err) {
      systemLogger.error(err.stack);
      return res.sendStatus(500);
    }
  }

  // TODO: move this to it's own controller
  public async getVault(req: Request, res: Response) {
    res.setHeader('Content-Type', 'application/health+json');

    

    try {
      return res.json({ keys: jwksCache.keys });
    } catch (err) {
      systemLogger.error(err.stack);
      return res.sendStatus(500);
    }
  }

  // This Healthcheck MUST respond to an unauthenticated GET request with
  // a 200 response. Any app-breaking errors should result in a 500 response.
  //
  // Ref: https://tools.ietf.org/html/draft-inadarei-api-health-check-05
  public async getServiceUrl(req: Request, res: Response) {
    res.setHeader('Content-Type', 'application/health+json');

    try {
      // If everything is good then this is the expected output.

      const brand = config.brand;
      const hostname = config.hostname;
      const serviceRecords = secretKeys.serviceAccountKeys;
      const apiKeyService = await credentialService.checkHealthStatus(
        '11111111',
      );
      const mongoDbHost = config.mongodbUriKey;

      return res.json({
        brand,
        hostname,
        serviceRecords,
        apiKeyService,
        mongoDbHost,
      });

      // When something in the app is failing / taking too long etc, but the
      // application is still working for the most part you would return 200
      // with a status message of "warn" a good practice to display a
      // non-sensitive error describing the issue.
      //
      // res.json({ status: "warn", output: err.message });

      // When a test/check fails send 500 and status of failure. it is also
      // a good practice to display a non-sensitive error describing the issue.
      //
      // res.status(500).json({ status: "fail", output: err.message });
    } catch (err) {
      systemLogger.error(err.stack);
      return res.sendStatus(500);
    }
  }

  // This Healthcheck MUST respond to an unauthenticated GET request with
  // a 200 response. Any app-breaking errors should result in a 500 response.
  //
  // Ref: https://tools.ietf.org/html/draft-inadarei-api-health-check-05
  public async getApiKeyServiceInfo(req: Request, res: Response) {
    res.setHeader('Content-Type', 'application/health+json');

    try {
      // If everything is good then this is the expected output.

      credentialService
        .checkHealthStatus('bde99eb43340ae81690c951a')
        .then(resp => {
          return res.json({ apiKeyService: resp });
        })
        .catch(err => {
          systemLogger.error(err.stack);
          return res.status(500).json({ error: err });
        });

      // When something in the app is failing / taking too long etc, but the
      // application is still working for the most part you would return 200
      // with a status message of "warn" a good practice to display a
      // non-sensitive error describing the issue.
      //
      // res.json({ status: "warn", output: err.message });

      // When a test/check fails send 500 and status of failure. it is also
      // a good practice to display a non-sensitive error describing the issue.
      //
      // res.status(500).json({ status: "fail", output: err.message });
    } catch (err) {
      systemLogger.error(err.stack);
      return res.sendStatus(500);
    }
  }
}

export default new Controller();
