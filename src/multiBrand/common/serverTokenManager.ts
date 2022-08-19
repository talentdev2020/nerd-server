const jwt = require('jsonwebtoken');
import { logger, configAws } from 'src/common';
import { promisify } from 'util';
import { ETokenTypes } from '../types';

const jwtOptions = {
  algorithm: 'RS256',
  issuer: 'urn:connectTrader',
  audience: 'urn:connectTrader',
  subject: 'connectTrader:subject',
};

const oneMinute = 60;
const signPromisified = promisify(jwt.sign);

class TokenManager {  
  private currentToken: string = null;
  private expTime: number = null;
  private claims:string[];

  constructor(claims:string[]){
    this.claims = claims;
  }

  private sign = async(): Promise<{ token: string; expTime: number }>=> {
    const nextExpTime = Math.floor(Date.now() / 1000) + oneMinute * 5;
    try {
      const newToken = await signPromisified(
        { exp: nextExpTime, claims:this.claims},
        configAws.jwtPrivateKey,
        jwtOptions,
      );
      this.expTime = nextExpTime;
      return { token: newToken, expTime:nextExpTime };
    } catch (error) {
      logger.critical(`common.serverTokenManager.sign.catch: ${error}`);
      throw error;
    }
  }
  
  private currentSignPromise:Promise<{ token: string; expTime: number }>;
   getToken = async(): Promise<string>=> {
    if (this.expTime < Math.floor(Date.now() / 1000) || this.expTime === null) {
      let signResp:any;
      if (this.currentSignPromise)
        signResp = await this.currentSignPromise;
      else {      
        this.currentSignPromise = this.sign();
        try{
          signResp = await this.currentSignPromise;
        }finally{
          this.currentSignPromise = null;
        }
     }
      this.currentToken = signResp.token;
      this.expTime = signResp.expTime;        
    }
    return this.currentToken;
  }
}

const tokensMap = new Map <ETokenTypes,TokenManager>([
  [ETokenTypes.MULTIBRAND_ADMIN,new TokenManager(['MBCartReports'])],
  [ETokenTypes.MULTIBRAND_USER,new TokenManager(['MBLicenseCount'])],
]);

export default tokensMap;