import axios from 'axios';
import { logger, configAws } from '../common';
import { IJwtSignOptions } from '../types';
const jwt = require('jsonwebtoken');

export class ServerToServerService {
  private readonly jwtOptions = {
    algorithm: 'RS256',
    expiresIn: '1m',
    issuer: 'urn:connectTrader',
    audience: 'urn:connectTrader',
    subject: 'connectTrader:subject',
  };

  public sign(
    payload: string | Buffer | object,
    options: IJwtSignOptions = {},
  ): string {
    try {
      const combinedOptions = Object.assign(options, this.jwtOptions);
      const token = jwt.sign(payload, configAws.jwtPrivateKey, combinedOptions);
      return token;
    } catch (error) {
      logger.warn(`services.credential.sign.catch: ${error}`);
      throw error;
    }
  }

  protected getAxios(
    payload: string | Buffer | object,
    options?: IJwtSignOptions,
  ) {
    try {
      const token = this.sign(payload, options);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.defaults.headers.post['Content-Type'] = 'application/json';
      axios.defaults.headers.put['Content-Type'] = 'application/json';
      return axios;
    } catch (error) {
      logger.warn(`services.credential.getAxios.catch: ${error}`);
      throw error;
    }
  }
}
