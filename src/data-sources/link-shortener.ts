import { RESTDataSource, RequestOptions } from 'apollo-datasource-rest';
import { configAws, logger } from '../common';
import { IUser } from '../models/user';
const jwt = require('jsonwebtoken');

class LinkShortener extends RESTDataSource {
  private readonly jwtOptions = {
    algorithm: 'RS256',
    expiresIn: '1m',
    issuer: 'urn:connectTrader',
    audience: 'urn:connectTrader',
    subject: 'connectTrader:subject',
  };
  baseURL = `${configAws.linkShortenerUrl}/api`;
  // baseURL = 'https://api-ssl.bitly.com/v4';
  public getSignedToken(payload: string | Buffer | object): string {
    try {
      const token = jwt.sign(payload, configAws.jwtPrivateKey, this.jwtOptions);
      return token;
    } catch (error) {
      logger.warn(`services.credential.sign.catch: ${error}`);
      throw error;
    }
  }

  willSendRequest(request: RequestOptions) {
    const token = this.getSignedToken({ role: 'system' });
    request.headers.set('Authorization', `Bearer ${token}`);
    request.headers.set('Content-Type', 'application/json');
  }

  private shortenLongUrl = async (url: string, userId?: string) => {
    this.baseURL;
    const body: { url: string; userId?: string } = { url };
    if (userId) {
      body.userId = userId;
    }
    const { shortUrl } = await this.post('/shorten', body);
    return shortUrl;
  };

  public async getLink(user: IUser) {
    try {
      if (!user) throw new Error('No user');
      logger.debug(
        `data-sources.linkShortener.getLink.affiliateId: ${user.affiliateId}`,
      );

      const encodedAffiliateId = encodeURIComponent(user.affiliateId);
      logger.debug(
        `data-sources.link-shortener.getLink.encodedAffiliateId: ${encodedAffiliateId}`,
      );
      // const longUrl = `${config.referralLinkDomain}?r=${encodedAffiliateId}&utm_source=galaappshare&utm_medium=${user.id}&utm_campaign=5e79504ffd8a5636a2c86ed2&utm_term=gala_own_your_game`;

      const longUrl = `${configAws.referralLinkDomain}?r=${encodedAffiliateId}&utm_medium=${user.id}&utm_campaign=5e79504ffd8a5636a2c86ed2`;

      //const shortUrl = await this.shortenLongUrl(longUrl, user.id);
      //return shortUrl;

      return longUrl;
    } catch (error) {
      logger.warn(`data-sources.link-shortener.getLink.catch: ${error}`);
      throw error;
    }
  }
}

export default LinkShortener;
