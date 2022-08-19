import Minter from './minter';
import { IVaultRetrieveResponseData, WalletResultGreen } from 'src/types';

export default class GenericMinter extends Minter {
  async mint(
    _walletResultGreen: WalletResultGreen,
    _amountDecimal: number,
    _currResult: IVaultRetrieveResponseData,
  ) {
    return new Promise<void>(resolve => resolve());
  }

  loadedCorrectly() {
    return true;
  }
}
