import {
  ErrorResponseCode,
  IVaultRetrieveResponseData,
  IVaultItemRequest,
  IVaultItem,
  PasswordError,
  VaultError,
  WalletResultGreen,
  UserLockError,
  IVaultRetrieveResponse,
} from 'src/types';

import {
  GreenCoinResult,
  IVaultItemWithDbRecords,
  NotificationStatus,
  VaultWithdrawalEth,
  VaultWithdrawalEthStatus,  
} from 'src/models';

import {Types} from 'mongoose';

import { IMintDestination } from 'src/services/minter/connect/win-commission-minter';

import { UserApi } from 'src/data-sources';

import { addHours } from 'date-fns';
import { EthWallet } from 'src/wallet-api/coin-wallets';
import { WalletApi } from 'src/wallet-api';

import { logger, notify, WalletConfig, configAws } from '../common';

import { minterFactory, Minter } from './minter';

import { connectRewardsService } from './minter/connect';
import { userLocks } from "./user-locks";

class VaultMinterService {

  private THREE_MINUTES = 3 * 60 * 1000;
  private STUCK_STATUS = 'paid-fee';
  async mint(
    user: UserApi,
    wallet: WalletApi,
    items: IVaultItemRequest[],
    encryptionPasscode: string,
  ) {

    let lockId;

    try {
      this.ensureNoDuplicatedSymbols(items);
      
      // check if the user is already minting
      lockId = await userLocks.acquireLock('mint', user.userId, this.THREE_MINUTES);
      
      const dataResult: IVaultRetrieveResponseData[] = [];
      const ethWallet = wallet.coin('ETH') as EthWallet;
      const { receiveAddress } = await ethWallet.getWalletInfo(user);

      await this.checkPassword(user, encryptionPasscode, ethWallet);

      const minter = this.createMinter(user, dataResult);

      await this.getUnmintedBalance(minter, user, receiveAddress, items);

      const successfulComparedItems = this.compareUnmintedBalance(
        user,
        items,
        dataResult,
      );

      
      //If there is nothing readyToBeginMint then return, to continue does not make sense.
      if (successfulComparedItems.length <= 0) {
        return { data: dataResult };
      }     

      const feeAmount = successfulComparedItems[0].dbUnmintedItems.item.fees.amount;
      
      const walletResultGreen = await this.payFee(
        user,
        encryptionPasscode,
        ethWallet,
        dataResult,
        feeAmount  //pass readyToPayFeeInstead
      );
      
      const successfulPaidFeeItems = await this.setPaidFeeStatus(
        user,
        successfulComparedItems,
        dataResult,
      );

      //If there is nothing readyToMint then return, to continue does not make sense.
      if (successfulPaidFeeItems.length <= 0) {
        return { data: dataResult };
      }

      const result = await this.processMint(
        minter,
        user,
        walletResultGreen,
        successfulPaidFeeItems,
        dataResult,
      );

      return result;

    } catch (error) {

      if (error instanceof VaultError || error instanceof PasswordError) {                        
        logger.exceptionContext(error,`mint-process - unable to mint. error: ${error.response?.error?.message}`,{userId:user.userId});        
        return error.response;
      }

      if (error instanceof UserLockError){
        const toReturn:IVaultRetrieveResponse =  {
          error:{
            message:`unable to acquire lock: ${error.message}`,
            code:ErrorResponseCode.LockError,
          },
        };        
          
        logger.exceptionContext(error,`mint-process - lock error. Error: ${error.message}`,{userId:user.userId});
        return toReturn;
      } 

      logger.exceptionContext(error,`mint-process - unexpected error. Error: ${error.message}`,{userId:user.userId});

      return {
        error:{
          message:`unexpected error - Internal error`,
          code:ErrorResponseCode.InternalError,
        },
      }

    } finally {
      if (lockId){
        await userLocks.tryRemoveLock("mint", user.userId, lockId);
      }
    }
  }

  private ensureNoDuplicatedSymbols(items: IVaultItemRequest[]){
    const symbols = items.map(item => item.symbol.toUpperCase());
    const duplicateSymbols = symbols.filter((symbol, index) => symbols.indexOf(symbol) !== index)

    if (duplicateSymbols.length >= 1) {      
      throw new VaultError({
        error:{
          message:`Symbol(${duplicateSymbols.toString()}) ${duplicateSymbols.length === 1 ? 'is' : 'are'} duplicated`,
          code:ErrorResponseCode.ArgsValidationError,
        },
      });      
    }
  }

  private async checkPassword(
    user: UserApi,
    encryptionPasscode: string,
    ethWallet: EthWallet,
  ) {
    try {
      const correctPassword = await ethWallet.checkPassword(
        user,
        encryptionPasscode,
      );

      if (!correctPassword) {
        throw new PasswordError({
          data: undefined,
          error: {
            code: ErrorResponseCode.InvalidEncryptionPassword,
            message: 'Invalid Encryption Passcode',
            stack: undefined,
          },
        });
      }
    } catch (err) {
      // logger.exceptionContext(err, 'mint', {
      //   source: 'vault.mint',
      //   user: JSON.stringify(user),
      // });

      throw new PasswordError({
        data: undefined,
        error: {
          code: ErrorResponseCode.InternalError,
          message: 'Internal Error: Password Validation.',
          stack: undefined,
        },
      });
    }
  }

  private async getUnmintedBalance(
    minter: Minter,
    user: UserApi,
    receivedAddress: string,
    items: IVaultItemRequest[]
  ) {
    const coinSearchPromises: Promise<IVaultItemRequest>[] = [];

    for (const item of items) {
      const itemSymbol = item.symbol.toLowerCase();

      coinSearchPromises.push(
        this.getItemUnmintedBalance(minter, user.userId, receivedAddress, itemSymbol, item, 'unminted')
      );
    }

    try {
      await Promise.all(coinSearchPromises);
    } catch (err) {
      // logger.exceptionContext(
      //   err,
      //   'error when looking for coins to mint : ' +
      //     JSON.stringify({ err, user, items }),
      //   {
      //     source: 'vault.mint',
      //   },
      // );

      throw new VaultError({
        error: {
          code: ErrorResponseCode.InternalError,
          message: 'Internal Error: failure to retrieve data',
        },
      });
    }
  }

  private compareUnmintedBalance(
    user: UserApi,
    items: IVaultItemRequest[],
    dataResult: IVaultRetrieveResponseData[],
  ) {
    const successfulItems: IVaultItemRequest[] = [];

    for (const item of items) {
      const itemSymbol = item.symbol.toLowerCase();
      const dbUnmintedItem = item.dbUnmintedItems;
      if (this.userHasPermission(user, item, dataResult)) {
        //success.
        if (Math.floor(dbUnmintedItem.item.balance) === Math.floor(item.amount)) {
          item.amount = dbUnmintedItem.item.balance; //always take the database balance as the ammount.
          successfulItems.push(item);
        } else {
          //If we got here, we are cancelling the request. The user is
          //requesting more than "unminted" transactions in the DB.
          notify.notifyUser(
            user.userId,
            'User Minting Hack/Mash',
            `User is attempting to hack the blockchain. ${itemSymbol} 
                    attempted: ${item.amount} / DB Available: ${dbUnmintedItem.item.balance}`,
            NotificationStatus.hidden,
          );

          const errorResponse: IVaultRetrieveResponseData = {
            symbol: itemSymbol,
            amount: item.amount,
            transactionId: undefined,
            error: {
              code: ErrorResponseCode.InternalError,
              message:
                'Internal Error - invalid amount',
              stack: undefined,
            },
          };
          dataResult.push(errorResponse);
        }
      }
    }
    return successfulItems;
  }

  private userHasPermission(
    user: UserApi,
    item: IVaultItemRequest,    
    dataResult: IVaultRetrieveResponseData[],
  ) {
    const itemSymbol = item.symbol.toLowerCase();

    if (itemSymbol === 'eth' && user.role !== 'admin') {
      //not enough permissions.
      logger.criticalContext(
        'MINT ERROR: failed the overall item.mint resolvers.vault.mint',
        {
          item: JSON.stringify(item),          
          user: JSON.stringify(user),
          error: 'Not enough permission to mint vault yet.',
          source: 'vault.mint',
        },
      );

      dataResult.push({
        symbol: itemSymbol,
        amount: item.amount,
        error: {
          code: ErrorResponseCode.InternalError,
          message: 'Internal Error - Not enough permissions',
        },
      });

      return false;
    }

    return true;
  }

  private async payFee(
    user: UserApi,
    encryptionPasscode: string,
    ethWallet: EthWallet,
    dataResult: IVaultRetrieveResponseData[],
    feeAmount: number,
  ) {
    const walletResultGreen = await this.getWalletResultGreen(
      user,
      ethWallet,
      dataResult,
    );
    
    try {

      const sendFee = await ethWallet.send(
        user,
        [{
          to: configAws.claimFeeReceiveAddress,
          amount: feeAmount.toString(),
        }],
        encryptionPasscode,
      );

      if (!sendFee.success) {
        throw new Error(sendFee.message);
      }
    } catch (error) {
      // logger.criticalContext('error when trying get pay fee', {
      //   errorMessage: error.message,
      //   source: 'vault.mint',
      // });

      let message = 'Internal Error unable to send fee';
      if (error.message === 'Insufficient ETH balance') {
        message = error.message;
      }

      throw new VaultError({
        data: dataResult.length >= 1 ? dataResult : undefined,
        error: {
          code: ErrorResponseCode.InternalError,
          message,
        },
      });
    }

    return walletResultGreen;
  }

  private async getWalletResultGreen(
    user: UserApi,
    ethWallet: EthWallet,
    dataResult: IVaultRetrieveResponseData[],
  ) {
    try {
      const walletResultGreen = await ethWallet.getWalletInfo(user);

      return walletResultGreen;
    } catch (error) {
      logger.criticalContext('error when trying get walletResultGreen', {
        errorMessage: error.message,
        source: 'vault.mint',
      });

      throw new VaultError({
        data: dataResult.length >= 1 ? dataResult : undefined,
        error: {
          code: ErrorResponseCode.InternalError,
          message: 'Internal Error failure to get wallet',
        },
      });
    }
  }

  private async setPaidFeeStatus(
    user: UserApi,
    toSetPaidFeeItems: IVaultItemRequest[],
    dataResult: IVaultRetrieveResponseData[],
  ) {
    const successfulItems: IVaultItemRequest[] = [];

    for (const toSetPaidFeeItem of toSetPaidFeeItems) {
      try {        
          await this.updateMultipleCoinRecords(
            user.userId,
            'unminted',
            'paid-fee',
            toSetPaidFeeItem,
            toSetPaidFeeItem.symbol.toLowerCase(),
          );        
        successfulItems.push(toSetPaidFeeItem);
      } catch (error) {
        logger.criticalContext("error when tryign to set to 'paid-fee' : ", {
          errorMessage: error.message,
          userId: user.userId,
          itemBeingUpdated: JSON.stringify(toSetPaidFeeItem),
          source: 'vault.mint',
        });

        dataResult.push({
          symbol: toSetPaidFeeItem.symbol.toLowerCase(),
          amount: toSetPaidFeeItem.amount,
          error: {
            code: ErrorResponseCode.InternalError,
            message:
              'Internal Error: "error when tryign to set to paid-fee. Contact support"',
          },
        });
      }
    }

    return successfulItems;
  }

  private async processMint(
    minter: Minter,
    user: UserApi,
    walletResultGreen: WalletResultGreen,
    readyToMint: IVaultItemRequest[],
    dataResult: IVaultRetrieveResponseData[],
  ) {
    for (const ready of readyToMint) {
      const currSymbol = ready.symbol.toLowerCase();
      const currAmount = ready.amount + ready.dbUnmintedItems.item.stuckBalance;
      const currResult: IVaultRetrieveResponseData = {
        symbol: currSymbol,
        amount: currAmount,
      };

      try {
        await minter.mint(walletResultGreen, currAmount, currResult);

        ready.address = walletResultGreen.receiveAddress;
        ready.transactionId = currResult.transactionId;

        await this.saveMinting(
          user,
          currAmount,
          currSymbol,
          currResult,
          ready,
          dataResult,
        );
      } catch (error) {
        logger.exceptionContext(error, 'MINT overall error', {
          userId: user.userId,
          currSymbol,
          currAmount: currAmount.toString(),
          dataResult: JSON.stringify(dataResult),
          source: 'vault.mint',
        });

        currResult.error = {
          code: ErrorResponseCode.InternalError,
          message: 'Internal Error: attempt to mint resulted in failure (2)',
          stack: undefined,
        };
      }

      dataResult.push(currResult);
    }

    return {
      data: dataResult,
    };
  }

  createMinter(
    user: UserApi,
    dataResult?: IVaultRetrieveResponseData[],
  ) {
    try {
      //minterFactory.createTokenMinter could fail due missconfiguration.
      return minterFactory.createTokenMinter(user.userId);
    } catch (error) {
      throw new VaultError({
        data: dataResult?.length >= 1 ? dataResult : undefined,
        error: {
          code: ErrorResponseCode.InternalError,
          message: 'Internal Error unable get minter',
        },
      });
    }
  }

  private async saveMinting(
    user: UserApi,
    currAmount: number,
    currSymbol: string,
    currResult: IVaultRetrieveResponseData,
    mintedItem: IVaultItemRequest,
    dataResult: IVaultRetrieveResponseData[],
  ) {
    try {
      await this.updateMultipleCoinRecords(
        user.userId,
        'paid-fee',
        'minted',
        mintedItem,
        currSymbol,
      );

      notify.notifyUser(
        user.userId,
        'Successful retrieving from Vault',
        `You successfully retrieved ${currAmount} ${currSymbol} from the Vault. To see the transaction on the blockchain, see https://etherscan.io/tx/${currResult.transactionId}`,
        NotificationStatus.unread,
      );
    } catch (error) {
      notify.notifyUser(
        user.userId,
        "User Minted Successfully, but DB didn't update",
        `User had trouble updating DB. Mint was successful, but transactions did not mark 'status': 'minted'. ${currSymbol} 
            amount: ${currAmount} | tx: ${currResult.transactionId}`,
        NotificationStatus.hidden,
      );

      logger.exceptionContext(
        error,
        "MINTED, but status didn't get set to 'minted' : ",
        {
          userId: user.userId,
          currSymbol,
          currAmount: currAmount.toString(),
          dataResult: JSON.stringify(dataResult),
          source: 'vault.mint',
        },
      );
    }
  }

  async getItemUnmintedBalance(
    minter: Minter,
    userId: string,
    receivedAddress: string,
    symbol: string,
    item: IVaultItemRequest,
    statusFilter?: string,
  ): Promise<IVaultItemRequest> {
    item.dbUnmintedItems = await this.searchForCoinResultsSummary(minter, userId, symbol, statusFilter, receivedAddress);
    return item;
  }

  async searchForCoinResultsSummary(
    minter: Minter,
    userId: string,
    symbol: string,
    statusFilter?: string,
    receiveAddress?: string,
  ): Promise<IVaultItemWithDbRecords> {
    const status = statusFilter;
    let symbolToCheck = symbol.toLowerCase();

    if (symbol === 'connect') {
      symbolToCheck = 'win';
    }

    const thisConfig = WalletConfig.getWalletConfigurations().find(
      coin => coin.symbol.toLowerCase() === symbolToCheck,
    );

    const result: IVaultItem & {stuckBalance:number, stuckItemsIds:Types.ObjectId[]}  = {
      contractAddress: thisConfig.contractAddress,
      name: thisConfig.name,
      symbol: thisConfig.symbol,
      icon: thisConfig.icon,
      balance: 0,    
      stuckBalance:0,
      stuckItemsIds:[],  
      fees: {
        symbolToMint: thisConfig.symbol,
        symbolAcceptFee: 'ETH',
        amount: 0,
        expires: addHours(Date.now(), 1),
        name: 'Gas Fees',
      },
    };

    switch (symbolToCheck) {
      case 'green':
        const greens = await GreenCoinResult.find({
          userId,
          $or:[{status},{status:this.STUCK_STATUS}],
        }).exec();
      
        greens.forEach(greenItemDB => {
          if (greenItemDB.status === "unminted"){
            result.balance += +greenItemDB.greenDecimal;
          }
          else if(greenItemDB.status === this.STUCK_STATUS) {
            result.stuckBalance += +greenItemDB.greenDecimal;
          }
        });

        const resultCombinedGreen: IVaultItemWithDbRecords = {
          item: result,
          dbRecords: greens,
        };

        const availableMint: IMintDestination = {
          destinationAddress: receiveAddress,
          amountDecimal: result.balance,
        }

        const gasCost = await minter.getGasCost(availableMint);
        result.fees.amount = gasCost;

        return resultCombinedGreen;
      case 'eth':
        ({balance:result.balance, stuckBalance:result.stuckBalance, stuckItemsIds:result.stuckItemsIds} = await connectRewardsService.getBalanceAndStuckItems(userId));
        result.name = 'Ethereum (Win Reward)';
        result.fees.amount = this.gasRandom();
        break;
    }
    return { item: result, dbRecords: [] };
  }  

  private async updateMultipleCoinRecords(
    userId: string,
    prevStatus: string,
    newStatus: string,
    item: IVaultItemRequest,
    coinSymbol: string = 'green',
  ) {
    if (coinSymbol === 'green') {
      await GreenCoinResult.updateMany(
        { userId, status: prevStatus },
        { $set: { status: newStatus, dateMint: new Date() } },
      );
    } else if (coinSymbol === 'eth') {      
      await connectRewardsService.updateMintState(newStatus,item,userId);
    }    
  }

  gasRandom() {
    const min: number = 8500;
    const max: number = 8899;
    const randFee: number = Math.floor(Math.random() * (max - min + 1)) + min;
    const feeAmt: number = randFee / +1000000;

    return feeAmt;
  }
}

const vaultMinterService = new VaultMinterService();
export default vaultMinterService;