import Minter from '../minter';
import WinCommisionMinter from './win-commission-minter';

import { IVaultRetrieveResponseData, WalletResultGreen } from 'src/types';

export class ConnectMinter extends Minter {
  minter: WinCommisionMinter;

  constructor(userId: string) {
    super();

    const secretKey = this.getContractDataFromSecrets('', 0);
    this.minter = new WinCommisionMinter(secretKey, userId);
  }

  async mint(
    walletResultGreen: WalletResultGreen,
    amountDecimal: number,
    currResult: IVaultRetrieveResponseData,
  ) {
    const ethTx = await this.minter.mintToGetFromVault({
      destinationAddress: walletResultGreen.receiveAddress,
      amountDecimal,
    });

    currResult.transactionId = ethTx.hash;
  }

  loadedCorrectly() {
    return this.minter.loadedCorrectly();
  }
}
