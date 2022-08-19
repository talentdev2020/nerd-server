import { ethers, utils } from 'ethers';
import { configSecrets, configAws, WalletConfig, logger } from 'src/common';
import { RewardDistributerConfig } from 'src/models';

class Erc20Reward {

  private getContract = (rewardCurrency: string, rewardAmount: number) => {
    const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);
    const rewardDistributerWallet: ethers.Wallet = new ethers.Wallet(
      configSecrets.rewardDistributorKey,
      provider,
    );

    try {
      const erc20Config = WalletConfig.getWalletConfigurations().find(
        coin => coin.symbol.toLowerCase() === rewardCurrency.toLowerCase(),
      );
      if (!erc20Config)
        throw new Error(
          `${rewardCurrency} not supported for erc20 reward distribution.`,
        );
      return {
        contract: new ethers.Contract(
          erc20Config.contractAddress,
          erc20Config.abi,
          rewardDistributerWallet,
        ),
        amount: utils.parseUnits(
          rewardAmount.toString(),
          erc20Config.decimalPlaces,
        ),
      };
    } catch (error) {
      throw error;
    }
  };

  //Sends rewards from central reward wallet, to user for action on site
  public send = async (
    rewardCurrency: string,
    rewardAmount: number,
    ethAddress: string,
  ) => {
    
    const provider = new ethers.providers.JsonRpcProvider(configAws.ethNodeUrl);
    const rewardDistributerWallet: ethers.Wallet = new ethers.Wallet(
      configSecrets.rewardDistributorKey,
      provider,
    );

    try {
      logger.JSON.debug({ rewardCurrency, rewardAmount, ethAddress });
      if (!ethAddress)
        throw new Error(`User ethAddress required to send ${rewardCurrency}`);
      const { contract, amount } = this.getContract(
        rewardCurrency,
        rewardAmount,
      );
      const { address: contractAddress } = contract;
      const walletAddress = rewardDistributerWallet.address;
      logger.obj.debug({ walletAddress });
      const distrubuterConfig = await RewardDistributerConfig.findOneAndUpdate(
        { walletAddress },
        {
          $inc: { nonce: 1 },
        },
      );
      if (!distrubuterConfig) {
        throw new Error(
          `Distributer config not found for walletAddress: ${walletAddress}`,
        );
      }
      const { nonce } = distrubuterConfig;
      logger.obj.debug({
        contractAddress,
        amount: amount.toString(),
        nonce,
      });
      const transaction = await contract.transfer(ethAddress, amount, {
        nonce,
      });
      transaction
        .wait(1)
        .then(
          ({
            transactionHash: receiptTxHash,
          }: ethers.providers.TransactionReceipt) => {
            logger.obj.debug({ receiptTxHash });
          },
        )
        .catch((error: Error) => {
          logger.obj.warn({ error: error.toString() });
        });
      const { hash } = transaction;
      logger.obj.debug({ hash });

      return hash;
    } catch (error) {
      logger.obj.warn({ error });
      throw error;
    }
  };
}

export const erc20Reward = new Erc20Reward();
