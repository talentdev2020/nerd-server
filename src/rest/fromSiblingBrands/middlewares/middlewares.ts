import { Request, Response, NextFunction } from 'express';
const jwt = require('jsonwebtoken');
import { promisify } from 'util';
import { config, logger, configAws } from 'src/common';
import User from 'src/models/user';

export class MiddleWare {
  private verify = promisify(jwt.verify);
  private publicKey = configAws.jwtPublicKey;
  verifyAdminToken = async (req: Request, res: Response, next: NextFunction) => {
    let token: string;
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = await this.verify(token, this.publicKey);
      if (!decoded.claims.includes('MBCartReports'))
        throw new Error('Not allowed');
    } catch (error) {
      logger.exception(
        `rest.fromSiblingBrands.middlewares.verifyAdminToken token:"${token}" is not valid`,
      );
      return res.status(401).send();
    }
    next();
  };

  verifyUserToken = async (req: Request, res: Response, next: NextFunction) => {
    let token: string;
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = await this.verify(token, this.publicKey);
      if (!decoded.claims.includes('MBLicenseCount'))
        throw new Error('Not allowed');
    } catch (error) {
      logger.exception(
        `rest.fromSiblingBrands.middlewares.verifyUserToken token:"${token}" is not valid`,
      );
      return res.status(401).send();
    }
    next();
  };


  validateBodyForUser = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body?.ctx)
      return res.status(400).send();

    const { user } = req.body.ctx;
    if (!user || !user.userId)
      return res.status(400).send();

    next();
  }

  checkIfUserRelatedIdExist = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.ctx.user.userId;
      const userCount = await User.findById(userId).count().exec();
      if (!(userCount >= 1)) throw new Error('user not found');

    } catch (error) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({
        message: `UserRelatedId do not exist on ${config.brand}. Please contact support.`,
        code: '',
      })
    }
    next();
  }
}

export const authMiddleware = new MiddleWare();
export default authMiddleware;
