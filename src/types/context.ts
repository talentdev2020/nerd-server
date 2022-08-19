import { Request, Response } from 'express';
import { SentryLogger } from '../common/logger/logger';
import {
  UserApi,
  CryptoFavorites,
  WalletConfig,
  Bitly,
  Zendesk,
  SendEmail,
  Blockfunnels,
  LinkShortener,
  SendInBlue,
} from '../data-sources/';

import { WalletApi } from '../wallet-api';

export interface IUserClaims {
  permissions: string[];
  role: string;
  userId: string;
  authorized: boolean;
  twoFaEnabled: boolean;
  [prop: string]: any;
}

export enum EPermissions {
  CLIMB_VIEW_ACCOUNTING = 'CLIMB_VIEW_ACCOUNTING'
}

export interface DataSources {
  cryptoFavorites: CryptoFavorites;
  environment: WalletConfig;
  linkShortener: Bitly | LinkShortener;
  bitly: Bitly;
  zendesk: Zendesk;
  sendEmail: SendEmail;
  blockfunnels: Blockfunnels;
  sendinblue: SendInBlue;
}

export interface Context {
  req: Request;
  res: Response;
  wallet: WalletApi;
  dataSources: DataSources;
  user: UserApi | null;
  logger: SentryLogger;
}
