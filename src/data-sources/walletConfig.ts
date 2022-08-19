import db from './db';
import { WalletConfig } from '../models';

export default class WalletConfigDB extends db {
  model = WalletConfig;
}
