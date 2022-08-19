import { configAws, WalletConfig } from 'src/common';
import Minter from '../minter';
import TokenMinterErc20Green from './token-minter-erc20';
import { IVaultRetrieveResponseData, WalletResultGreen } from 'src/types';
import { IMintDestination } from 'src/services/minter/connect/win-commission-minter';

export class GreenMinter extends Minter {
  minter: TokenMinterErc20Green;

  constructor(userId: string) {
    super();

    const address = configAws.contractAddresses.green;
    const walletConfig = WalletConfig.getWallet('green');

    const contract = this.getContractDataFromSecrets(
      address,
      walletConfig.decimalPlaces,
    );
    this.minter = new TokenMinterErc20Green(contract, userId);
  }

  async mint(
    walletResultGreen: WalletResultGreen,
    amountDecimal: number,
    currResult: IVaultRetrieveResponseData,
  ) {
    const greenTx = await this.minter.mintToGetFromVault({
      destinationAddress: walletResultGreen.receiveAddress,
      amountDecimal,
    });

    currResult.transactionId = greenTx.hash;
  }

  loadedCorrectly() {
    return this.minter.loadedCorrectly();
  }

  async getGasCost (toMint: IMintDestination) {
    const gasCost = await this.minter.getGasCost(toMint);
    return gasCost;
  }

}
