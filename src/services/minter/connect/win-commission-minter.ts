import { BigNumber, ethers, utils } from 'ethers';

import { configAws, logger } from 'src/common';
import { ContractData } from 'src/types/eth-contracts/contract';

class WinCommisionMinter {
  //private userId: string;
  private localContractData: ContractData;

  constructor(contractData: ContractData, userId: string) {
    //this.userId = userId;
    this.localContractData = contractData;
  }

  public mintToGetFromVault = async (toMint: IMintDestination) => {
    //the signer should be the correct wallet. just need to send.
    //just took the send from ethWallet and put here. need to be careful of decimal conversion

    try {
      const provider = new ethers.providers.JsonRpcProvider(
        configAws.ethNodeUrl,
      );
      const signer = new ethers.Wallet(
        this.localContractData.privateKey,
        provider,
      );

      this.requireValidAddress(toMint.destinationAddress);
      const value = utils.parseEther(toMint.amountDecimal.toString());

      const ethAddress = await signer.getAddress();
      this.checkIfSendingToSelf(ethAddress, toMint.destinationAddress);
      const nonce = await this.getNonce(ethAddress);
      await this.requireEnoughBalanceToSendEther(ethAddress, value);

      const transaction: ethers.providers.TransactionRequest = {
        nonce,
        to: toMint.destinationAddress,
        value,
        gasLimit: 21001,
      };
      const txResponse = await signer.sendTransaction(transaction);
      const { hash } = txResponse;

      return { hash: hash, transaction: transaction };
    } catch (err) {
      logger.criticalContext(
        'services.token-generator.win-commission-minter.mintToGetFromVault critical failure',
        {
          errorMessage: err.message,
          toMint: JSON.stringify(toMint),
        },
      );
    }
  };

  public loadedCorrectly = () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(
        configAws.ethNodeUrl,
      );
      const signer = new ethers.Wallet(
        this.localContractData.privateKey,
        provider,
      );

      if (signer && signer.address) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.log('win-commission-minter.loadedCorrectly');
      console.log(err);
    }
  };

  protected async requireValidAddress(maybeAddress: string) {
    try {
      const provider = new ethers.providers.JsonRpcProvider(
        configAws.ethNodeUrl,
      );

      const isAddress = !!(await provider.resolveName(maybeAddress));
      if (!isAddress) throw new Error(`Invalid address ${maybeAddress}`);
    } catch (error) {
      throw error;
    }
  }

  protected checkIfSendingToSelf = (from: string, to: string) => {
    if (from.toLowerCase() === to.toLowerCase()) {
      throw new Error('Cannot send to yourself');
    }
  };

  protected async getNonce(ethAddress?: string) {
    const userEthAddress = ethAddress;
    try {
      const provider = new ethers.providers.JsonRpcProvider(
        configAws.ethNodeUrl,
      );

      const txCount = await provider.getTransactionCount(userEthAddress);
      return txCount;
    } catch (error) {
      logger.exceptionContext(error, `win-commission-minter.getNonce`, {
        ethAddress,
      });
      throw error;
    }
  }

  private async requireEnoughBalanceToSendEther(
    address: string,
    amount: BigNumber,
  ) {
    try {
      const { parseEther } = utils;
      const { confirmed } = await this.getBalanceNonIndexed(address);
      const weiConfirmed = parseEther(confirmed);
      const hasEnough = weiConfirmed.gte(amount);

      if (!hasEnough) throw new Error(`Insufficient account balance`);
    } catch (error) {
      logger.exceptionContext(
        error,
        `win-commission-minter.requireEnoughBalanceToSendEther.catch`,
        {
          address,
          amount: amount.toString(),
        },
      );
      throw error;
    }
  }

  private async getBalanceNonIndexed(address: string) {
    try {
      const provider = new ethers.providers.JsonRpcProvider(
        configAws.ethNodeUrl,
      );

      const balance = await provider.getBalance(address);
      const ethBalance = ethers.utils.formatEther(balance);

      return {
        unconfirmed: ethBalance, //same value, no sense. Pending?
        confirmed: ethBalance,
      };
    } catch (error) {
      logger.exceptionContext(
        error,
        `win-commission-minter.getBalanceNonIndexed.catch`,
        {
          address,
        },
      );
    }
    return {
      unconfirmed: 0,
      confirmed: '0',
    };
  }
}

export interface IMintDestination {
  destinationAddress: string;
  amountDecimal: number;
}

export default WinCommisionMinter;
