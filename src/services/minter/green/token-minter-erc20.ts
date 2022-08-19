import { BigNumber, ethers, Wallet } from 'ethers';
import * as abi from 'src/common/ABI/erc20-green.json';
import { configAws, logger } from 'src/common';
import { ContractData } from 'src/types/eth-contracts/contract';
import { GreenCoinResult } from 'src/models';
import { ErrorResponseCode, VaultError } from 'src/types';

class TokenMinter {
  private contract: ethers.Contract;
  private decimalPlaces: number;
  private userId: string;
  private signer: Wallet;

  constructor(contractData: ContractData, userId: string) {
    const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);
    this.signer = new ethers.Wallet(contractData.privateKey, provider);
    this.contract = new ethers.Contract(contractData.address, abi, this.signer);
    this.decimalPlaces = contractData.decimalPlaces;
    this.userId = userId;
  }

  public loadedCorrectly = () => {
    try {
      if (this.signer && this.signer.address) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.log('Token.Minter.loadedCorrectly');
      console.log(err);
    }
  };

  private revertMinting = async () => {
    const userId = this.userId;
    return GreenCoinResult.updateMany(
      { userId, status: 'begin-mint' },
      { $set: { status: 'unminted', dateMint: new Date() } },
    );
  };

  public getGasCost = async (toMint: IMintDestination) => {
    const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);
    const feeData = await provider.getFeeData();

    const addresses: string[] = [toMint.destinationAddress];
    const amount: number = Math.floor(toMint.amountDecimal * Math.pow(10, this.decimalPlaces));
    const values: number[] = [amount];

    const data = this.contract.interface.encodeFunctionData('distributeMinting', [addresses, values]);
    const gasLimit = await this.signer.estimateGas({to: this.contract.address, data});
 
    let gasCost: string | number = feeData.maxFeePerGas.mul(gasLimit).add(feeData.maxPriorityFeePerGas).toString();
    gasCost = ethers.utils.formatEther(gasCost);
    gasCost = gasCost.substring(0, 10);
    gasCost = Number(gasCost);
    return gasCost;
  }

  public mintToGetFromVault = async (toMint: IMintDestination) => {
    // Decimal conversion (eg. token with 8 decimals: 1.05 → 105000000)
    const amount: number = Math.floor(
      toMint.amountDecimal * Math.pow(10, this.decimalPlaces),
    );

    // Call Data: ```function distributeMinting(address[] distAddresses, uint[] distValues) public onlyOwner returns (bool success)```
    const addresses: string[] = [toMint.destinationAddress];
    const values: number[] = [amount];

    console.log('tm.1');
    const data = this.contract.interface.encodeFunctionData(
      'distributeMinting',
      [addresses, values],
    );

    // Transaction data
    let tx: ethers.providers.TransactionRequest = {
      to: this.contract.address,
      data: data,
    };

    // Let ethers.js populate: gasPrice, nonce, gasLimit, and chainId
    // Reverts the status of pending distributions on error
    //   - ref: https://docs.ethers.io/v5/api/signer/#Signer-populateTransaction
    try {
      tx = await this.signer.populateTransaction(tx);
    } catch (error) {
      logger.exceptionContext(
        error,
        'Service.tokenGenerator.tokenMinter.populateTransaction.error',
        { tx: JSON.stringify(tx) },
      );
      await this.revertMinting();
      throw new VaultError({
        error: {
          code: ErrorResponseCode.BlockchainError,
          message: 'Infura Error: failure to populate transaction',
        },
      });
    }

    // Gas-tip multiplier
    if (configAws.gasTipMultiplier > 0) {
      const t = tx.maxPriorityFeePerGas as BigNumber;
      tx.maxPriorityFeePerGas = t
        .mul(configAws.gasTipMultiplier)
        .div(100)
        .add(t);
    }  
    
    // enforce maxPriorityFeePerGas to be less than or equal to maxFeePerGas.
    if ((tx.maxPriorityFeePerGas as BigNumber).gt(tx.maxFeePerGas as BigNumber)){
      tx.maxPriorityFeePerGas = tx.maxFeePerGas;
    }

    // Sign transaction
    const signedTx = await this.signer.signTransaction(tx);

    // Send the transaction to the provider for broadcasting
    // Reverts the status of pending distributions on error
    let response;
    try {
      response = await this.signer.provider.sendTransaction(signedTx);
    } catch (error) {
      logger.exceptionContext(
        error,
        'Service.tokenGenerator.tokenMinter.sendTransaction.error',
        { tx: JSON.stringify(tx) },
      );
      await this.revertMinting();
      throw new VaultError({
        error: {
          code: ErrorResponseCode.BlockchainError,
          message: 'Infura Error: failure to send green to user',
        },
      });
    }

    return { hash: response.hash, transaction: tx };
  };
}

export interface IMintDestination {
  destinationAddress: string;
  amountDecimal: number;
}

export default TokenMinter;
