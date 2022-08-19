import { CoinSymbol } from '../types';

class BaseListener {
  public coinSymbol: CoinSymbol;

  listenForNewBalance: (walletId: string) => Promise<any>;
  removeListeners: (walletId: string) => Promise<void>;
}

export default BaseListener;
