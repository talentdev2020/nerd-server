import { Request, Response, NextFunction } from 'express';
import config from '../../common/config';
import * as crypto from 'crypto';
import { configAws } from 'src/common';

export default (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Content-Type', 'application/json');
  if (!req.headers['x-paywiser-signature']) {
    res.status(401);
    return res.json({ message: 'Missing Header', body: { ...req.body } });
  }

  const signature = req.headers['x-paywiser-signature'].toString();
  const secret = configAws.paywiserNotificationSecret;

  const hmac = crypto.createHmac('md5', secret);
  const body = (req as any).rawBody;

  hmac.update(body);
  const hash = hmac.digest('hex');

  if (signature !== hash) {
    res.status(401);
    return res.json({
      message: 'Invalid MD5 signature',
      body: { ...req.body },
    });
  }

  next();
};
