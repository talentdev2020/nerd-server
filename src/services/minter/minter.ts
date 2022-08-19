import { ContractData } from 'src/types/eth-contracts/contract';
import { configSecrets } from 'src/common';

import { IVaultRetrieveResponseData, WalletResultGreen } from 'src/types';
import { IMintDestination } from 'src/services/minter/connect/win-commission-minter';

export default abstract class Minter {
  abstract mint(
    walletResultGreen: WalletResultGreen,
    amountDecimal: number,
    currResult: IVaultRetrieveResponseData,
  ): Promise<void>;

  abstract loadedCorrectly(): boolean;
  
  getGasCost(_toMint: IMintDestination) {
    return Promise.resolve(0);
  }

  protected getContractDataFromSecrets(
    address: string,
    decimalPlaces: number,
  ): ContractData {
    try {
      let privateKey = '';

      if (address) {
        privateKey = configSecrets.rewardPrivateKey;
      } else {
        privateKey = configSecrets.rewardDistributorKey;
      }

      const results: ContractData = {
        privateKey,
        address,
        decimalPlaces,
      };

      return results;
    } catch (err) {
      console.log(
        'token-minter-FACTORY_ADDRESS.getContractDataFromSecrets CommandFailedEvent.',
      );
      console.log(err);
    }
  }
}
