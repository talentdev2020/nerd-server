import { config } from '../';
import configAws from '../config-aws';
import { systemLogger } from './';

class LogMessage {
  public logConfigAtStartup = () => {
    [
      ['ETH_NODE', configAws.ethNodeUrl],
      ['DISPLAYED_WALLETS', configAws.displayedWallets.join(',')],
      ['INDEXED_TRANSACTIONS', configAws.indexedTransactions],
      ['LINK_SHORTENER_URL', configAws.linkShortenerUrl],
    ].forEach(([label, value]) => {
      systemLogger.info(`CONFIG: ${label}=${value}`);
    });
  };
}

const logMessage = new LogMessage();
export default logMessage;
