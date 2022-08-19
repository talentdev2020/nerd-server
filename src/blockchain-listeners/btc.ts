import { WalletClient } from 'bclient';
import * as autoBind from 'auto-bind';
import BaseListener from './base';
import { config, configAws, logger } from '../common';
//import { walletApi } from '../wallet-api/WalletApi';
//import BtcWalletApi from '../wallet-api/coin-wallets/btc-wallet';
import { CoinSymbol } from '../types';

class BtcBlockchainListener implements BaseListener {
  private walletClient = new WalletClient(configAws.bcoinWallet);
  //private walletApi = walletApi;
  //private btcWalletApi = this.walletApi.coin('BTC') as BtcWalletApi;
  public coinSymbol = CoinSymbol.btc;

  constructor() {
    autoBind(this);
  }

  publishNewBalance(walletId: string) {
    if (!configAws.supportsBtcPubsub) return;
    try {
      const payload = {
        walletId,
      };
      config.pubsub.publish(config.newBalance, payload);

    } catch (error) {
      logger.error(
        `blockchain-listeners.btc.publishNewBalance.catch: ${error}`,
      );
    }
  }

  public async listenForNewBalance(walletId: string) {
    try {
      
      // const token = await this.btcWalletApi.getToken(walletId);
      // logger.debug(
      //   `blockchain-listeners.btc.listenForNewBalance.token.length: ${token ? token.length : 0
      //   }`,
      // );
      // if (!token) return;

      if (configAws.supportsBtcPubsub) {
        await this.walletClient.open();
        logger.debug(
          `blockchain-listeners.btc.listenForNewBalance.walletId: ${walletId}`,
        );
      }

      // await this.walletClient.join(walletId, token);

      // this.walletClient.bind('balance', async wallet => {
      //   this.publishNewBalance(wallet);
      // });
    } catch (error) {
      logger.error(
        `blockchain-listeners.btc.listenForNewBalance.catch: ${error}`,
      );
    }
  }

  public async removeListeners(walletId: string) {
    if (walletId) await this.walletClient.leave(walletId);
  }
}

export default new BtcBlockchainListener();
