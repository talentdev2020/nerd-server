import {
  providers,
  utils,
  Contract,
  Wallet,
  constants,
  BigNumber,
} from 'ethers';
import {
  ICoinMetadata,
  IRewardTriggerValues,
  IRewardTriggerConfig,
  IUser,
} from '../../../types';
import {
  RewardDistributerConfig,
  IRewardAudit,
  RewardAudit,
} from '../../../models';
import { transactionService } from '../..';
//import { nodeSelector } from '../..';
import { UserHelper } from '../../../utils';
import { config, configAws, logger, AlertService, configSecrets } from '../../../common';
import { IWalletReferralCountAggregate } from '../../../pipelines';

export abstract class BaseReward {
  rewardConfig: ICoinMetadata;
  protected rewardWarnThreshold = BigNumber.from(configAws.rewardWarnThreshold);
  protected amountToUser: BigNumber;
  protected amountToReferrer: BigNumber;
  protected contract: Contract;
  protected rewardDistributerWallet: Wallet;
  protected logPath: string;
  protected ethProvider = new providers.JsonRpcProvider(configAws.ethNodeUrl);
  protected alertService = new AlertService(
    config.isDev ? 'wallet-monitoring-stage' : 'wallet-monitoring',
  );
  protected rewardDistributerWalletEthBalance: BigNumber;
  protected chainId = configAws.cryptoNetwork.toLowerCase().includes('main')
    ? 1
    : 3;
  protected requiredValues: IRewardTriggerValues;
  protected totalAmountPerAction: BigNumber;

  constructor(
    rewardConfig: ICoinMetadata,
    triggerConfig: IRewardTriggerConfig,
  ) {
    const { decimalPlaces } = rewardConfig;
    const { valuesRequired, amount } = triggerConfig;
    this.rewardConfig = rewardConfig;
    this.requiredValues = {
      referrer: valuesRequired?.referrer || 0,
      user: valuesRequired?.user || 0,
    };

    if (amount.toUser > 0) {
      this.amountToUser =
        decimalPlaces > 0
          ? utils.parseUnits(
              amount.toUser.toString(),
              this.rewardConfig.decimalPlaces,
            )
          : constants.One;
    } else {
      this.amountToUser = constants.Zero;
    }
    if (amount.toReferrer > 0) {
      this.amountToReferrer =
        decimalPlaces > 0
          ? utils.parseUnits(
              amount.toReferrer.toString(),
              this.rewardConfig.decimalPlaces,
            )
          : constants.One;
    } else {
      this.amountToReferrer = constants.Zero;
    }

    this.totalAmountPerAction = this.amountToUser.add(this.amountToReferrer);
    this.rewardDistributerWallet = new Wallet(
      configSecrets.rewardDistributorKey,
      this.ethProvider,
    );
    if (this.rewardConfig.abi && this.rewardConfig.contractAddress) {
      this.contract = new Contract(
        this.rewardConfig.contractAddress,
        this.rewardConfig.abi,
        this.rewardDistributerWallet,
      );
    }
  }

  logger = {
    info: (key: string, value: string) => {
      logger.info(`${this.logPath}.${key}: ${value}`);
    },
    debug: (key: string, value: string) => {
      logger.debug(`${this.logPath}.${key}: ${value}`);
    },
    warn: (key: string, value: string) => {
      logger.warn(`${this.logPath}.${key}: ${value}`);
    },
  };

  getNextNonce = async () => {
    const senderAddress = this.rewardDistributerWallet.address;
    const distrubuterConfig = await RewardDistributerConfig.findOneAndUpdate(
      { walletAddress: senderAddress },
      {
        $inc: { nonce: 1 },
      },
    );
    if (!distrubuterConfig) {
      throw new Error(
        `Distributer config not found for walletAddress: ${senderAddress}`,
      );
    }
    const { nonce } = distrubuterConfig;
    this.logger.debug('nonce', nonce.toString());
    return nonce;
  };

  protected checkGasThresholdAndAlert = async () => {
    const estWeiPerTx = BigNumber.from(60000000000000);
    const {
      pendingBalance,
    } = await transactionService.getEthBalanceAndTransactions(
      this.rewardDistributerWallet.address,
    );
    const estTxsRemaining = utils.parseEther(pendingBalance).div(estWeiPerTx);
    if (estTxsRemaining.lt(this.rewardWarnThreshold)) {
      this.sendBalanceAlert(
        pendingBalance,
        estTxsRemaining.toString(),
        'ETH for gas',
      );
    }
  };

  protected sendBalanceAlert = (
    currentBalance: string,
    txsRemaining: string,
    symbol: string,
  ) => {
    this.alertService.postMessage(
      `Low on ${symbol}!\nSend ${symbol} to ${this.rewardDistributerWallet.address} ASAP!\nCurrent balance: ${currentBalance} ${symbol}.\nEstimated ${txsRemaining} transactions until empty.`,
    );
  };

  protected checkIfUserValueRequirementMet = (value: number) => {
    logger.debugContext('checkIfUserValuerequirementsMet.value', { value });
    logger.debugContext('checkIfUserValuerequirementsMet.requiredValues.user', {
      user: this.requiredValues.user,
    });
    return value >= this.requiredValues.user;
  };

  protected checkIfReferrerValueRequirementMet = (value: number) => {
    logger.debugContext('checkIfReferrerValuerequirementsMet.value', { value });
    logger.debugContext(
      'checkIfReferrerValuerequirementsMet.requiredValues.user',
      { user: this.requiredValues.user },
    );
    return value >= this.requiredValues.referrer;
  };

  protected sendContractTransaction = async (
    data: string,
    fromUserId: string,
    toUserId?: string,
  ) => {
    const transaction = await this.rewardDistributerWallet.signTransaction({
      to: this.contract.address,
      data,
      value: '0x0',
      chainId: this.chainId,
    });
    //const parsedTx = utils.parseTransaction(transaction);
    //await nodeSelector.assignNodeToMineTransaction(parsedTx.hash);  //enable again if we decide to assign node for each transaction mined
    const txResponse = await this.ethProvider.sendTransaction(transaction);
    this.logger.debug(
      'sendContractTransaction',
      `${[fromUserId, toUserId, txResponse.hash].join(',')}`,
    );
    await transactionService.savePendingErc1155Transaction(
      txResponse,
      fromUserId,
      toUserId,
    );
    return txResponse;
  };
  abstract checkRewardThresholdAndAlert: () => Promise<boolean>;

  triggerReward = async (
    user: UserHelper,
    triggerValues: IRewardTriggerValues = {},
  ) => {
    logger.debugContext('triggerReward', { userId: user.self.id });
    logger.debugContext('triggerReward', {
      'triggerValues.user': triggerValues.user,
    });
    logger.debugContext('triggerReward', {
      'triggerValues.referrer': triggerValues.referrer,
    });
    logger.debugContext('triggerReward', {
      amountToUser: this.amountToUser.toString(),
    });
    logger.debugContext('triggerReward', {
      amountToReferrer: this.amountToReferrer.toString(),
    });

    if (
      this.amountToUser.gt(0) &&
      this.checkIfUserValueRequirementMet(triggerValues.user || 0)
    ) {
      logger.debugContext('triggerReward', {
        'sendToUser.name': this.rewardConfig.name,
      });
      this.sendRewardToUser(user.self, this.amountToUser, triggerValues.user);
    }
    if (
      this.amountToReferrer.gt(0) &&
      this.checkIfReferrerValueRequirementMet(triggerValues.referrer || 0)
    ) {
      logger.debugContext('triggerReward', {
        'sendToReferrer.name': this.rewardConfig.name,
      });
      const referrer = await user.getReferrer();
      logger.debugContext('triggerReward', { referrer: !!referrer });
      if (referrer) {
        this.sendRewardToReferrer(
          referrer,
          this.amountToReferrer,
          triggerValues.referrer,
        );
      }
    }
  };

  abstract sendRewardToAccount: (
    userId: string,
    ethAddress: string,
    amount: BigNumber,
    valueSent: number,
  ) => Promise<void>;

  protected sendRewardToReferrer = async (
    user: IWalletReferralCountAggregate,
    amount: BigNumber,
    valueSent?: number,
  ) => {
    logger.debugContext('sendRewardToReferrer', {
      'this.name': this.rewardConfig.name,
    });
    logger.debugContext('sendRewardToReferrer', { 'user.id': user.id });
    logger.debugContext('sendRewardToReferrer', {
      'user.ethAddress': user.ethAddress,
    });
    logger.debugContext('sendRewardToReferrer', { amount: amount.toString() });
    return this.sendRewardToAccount(
      user.id,
      user.ethAddress,
      amount,
      valueSent,
    );
  };

  protected sendRewardToUser = async (
    user: IUser,
    amount: BigNumber,
    valueSent: number,
  ) => {
    logger.debugContext('sendRewardToUser', {
      'this.name': this.rewardConfig.name,
    });
    logger.debugContext('sendRewardToUser', { 'user.id': user.id });
    logger.debugContext('sendRewardToUser', {
      'user.ethAddress': user?.wallet?.ethAddress,
    });
    logger.debugContext('sendRewardToUser', { amount: amount.toString() });
    return this.sendRewardToAccount(
      user.id,
      user?.wallet?.ethAddress,
      amount,
      valueSent,
    );
  };

  protected saveRewardAudit = (audit: IRewardAudit) => {
    return RewardAudit.create({
      rewardWalletAddress: this.rewardDistributerWallet.address,
      contractAddress: this.contract.address,
      rewardName: this.rewardConfig.name,
      decimalPlaces: this.rewardConfig.decimalPlaces,
      amountToReferrer: this.amountToReferrer.toString(),
      amountToUser: this.amountToUser.toString(),
      ...audit,
    });
  };
}
