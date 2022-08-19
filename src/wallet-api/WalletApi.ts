import {
  logger,
  configAws,
  WalletConfig,  
} from '../common';
import { CoinWalletBase, Erc1155Wallet } from './coin-wallets';

export class WalletApi {
  private symbolToInterface: Map<string, CoinWalletBase> = new Map();
  private parentWalletSymbols = ['BTC', 'ETH'];

  public allCoins: CoinWalletBase[];
  public parentInterfaces: CoinWalletBase[];

  initialize() {
    this.allCoins = this.mapWalletInterfaces(configAws.displayedWallets);
    this.parentInterfaces = this.mapWalletInterfaces(
      this.parentWalletSymbols.map(symbol => symbol.toLowerCase()),
    );
    this.mapSymbolsToInterfaces(this.allCoins);
  }

  public getErc1155ItemInterface() {
    return new Erc1155Wallet(WalletConfig.getErc1155ContractConfig());
  }

  private mapSymbolsToInterfaces = (walletInterfaces: CoinWalletBase[]) => {
    walletInterfaces.forEach(walletInterface => {
      this.symbolToInterface.set(
        walletInterface.symbol.toLowerCase(),
        walletInterface,
      );
    });
  };

  public coin = (symbol: string) => {
    try {
      // logger.debug(`wallet-api.coin-wallet.WalletApi.coin.symbol: ${symbol}`);
      const walletInterface = this.symbolToInterface.get(symbol.toLowerCase());
      if (!walletInterface)
        throw new Error(`coinSymbol: ${symbol} not supported.`);
      return walletInterface;
    } catch (error) {
      logger.exceptionContext(
        error,
        `wallet-api.coin-wallet.WalletApi.coin.catch`,
        { symbol }
      );
      throw error;
    }
  };

  private mapWalletInterfaces = (
    displayedWalletSymbols: string[],
  ): CoinWalletBase[] => {
    try {
      return displayedWalletSymbols.map(symbol => {
        const coinConfig = WalletConfig.getWallet(symbol);
        if (!coinConfig) {
          throw new Error(`Wallet not configured for support: ${symbol}`);
        }
        const { WalletInterface } = coinConfig;
        return new WalletInterface(coinConfig);
      }) as CoinWalletBase[];
    } catch (error) {
      logger.exceptionContext(
        error,
        `wallet-api.coin-wallet.WalletApi.selectWalletInterface.catch`,
        {
          'displayWalletSymbols': JSON.stringify(displayedWalletSymbols),
        }
      );
      throw error;
    }
  };
}

export const walletApi = new WalletApi();
