import {
  IWalletsHealth,
  IWalletHealthDetail,
  IWalletsHealthStatusSummary,
  IWalletsBrokenDetail,
  ILeanWalletHealth,
  IWalletCredentialsHealth,
  IUserDBWalletHealth,
  IUserLeanWalletHealth,  
} from 'src/types';
import { credentialService, userService } from 'src/services';

export class WalletHealthHelper {
  getCredentialsHealth(keyNames:string[]):IWalletCredentialsHealth{
    const credentialsHealth:IWalletCredentialsHealth = {
      btcToken:!!keyNames.find(keyName=> keyName === "BTC-token"),
      btcPrivateKey:!!keyNames.find(keyName=> keyName === "BTC-xprivkey"),
      ethPrivateKey:!!keyNames.find(keyName=> keyName === "ETH-privatekey"),
      mnemonic:!!keyNames.find(keyName=> keyName === "x"),    
    }
    return credentialsHealth;
  }

  transformLeanWalletHealthToWalletsHealth(walletHealth:ILeanWalletHealth):IWalletsHealth{
    return {
      mnemonic:walletHealth.mnemonic,
      btc:{
       address:walletHealth.btcAddress,
       privateKey:walletHealth.btcPrivateKey,
       token:walletHealth.btcToken,  
      },
      eth:{
        address:walletHealth.ethAddress,
        blockNumAtCreation:walletHealth.ethBlockNumAtCreation,
        privateKey:walletHealth.ethPrivateKey,        
      },
     }
  }
  
  isEmpty(walletHealth:IWalletsHealth) {    
    const empty =  !walletHealth.mnemonic 
    && !walletHealth.eth.address 
    && !walletHealth.eth.blockNumAtCreation
    && !walletHealth.eth.privateKey
    && !walletHealth.btc.address
    && !walletHealth.btc.privateKey
    && !walletHealth.btc.token   
    return empty;
  }

  isOk(walletHealth:IWalletsHealth): boolean {
    const ok = walletHealth.mnemonic 
    && walletHealth.eth.address 
    && walletHealth.eth.blockNumAtCreation
    && walletHealth.eth.privateKey
    && walletHealth.btc.address
    && walletHealth.btc.privateKey
    && walletHealth.btc.token     
    return ok;
  }
 
  isBroken(walletHealth:IWalletsHealth): boolean {    
    const isBroken = !this.isOk(walletHealth) && !this.isEmpty(walletHealth);
    return isBroken;
  }
  
  joinSortedHealths(dBHealthInfo:IUserDBWalletHealth[], usersKeys:{userId:string;accountsIds:string[]}[]):IUserLeanWalletHealth[]{    
    const joinResult:IUserLeanWalletHealth[] = [];
    const credentialsLength = usersKeys.length;
    let keysCounter = 0;
    let currentUserKeys = usersKeys[keysCounter];

    for (let userCounter = 0, usersLength = dBHealthInfo.length; userCounter < usersLength; userCounter ++){
      const dbHealth = dBHealthInfo[userCounter];      
      let credentialsHealth:IWalletCredentialsHealth = {mnemonic:false, ethPrivateKey:false, btcPrivateKey:false, btcToken:false};

      while (keysCounter < credentialsLength && dbHealth.userId >= currentUserKeys.userId) {
        if (dbHealth.userId === currentUserKeys.userId) {
          credentialsHealth = walletHealthHelper.getCredentialsHealth(currentUserKeys.accountsIds);                 
        }
        keysCounter++;
        currentUserKeys = usersKeys[keysCounter];
      }      
      joinResult.push({...dbHealth, ...credentialsHealth});
    }
    return joinResult;
  }  
}

export const walletHealthHelper = new WalletHealthHelper(); 

export class WalletHealth {
  public readonly walletHealth: IWalletsHealth;
  public readonly btcHealthDetail: IWalletHealthDetail;
  public readonly ethHealthDetail: IWalletHealthDetail;
  public readonly brokenDetail: IWalletsBrokenDetail;
  public readonly isEmpty: boolean;
  public readonly isOk: boolean;
  public readonly isBroken: boolean;
  public readonly walletHealthStatusSummary: IWalletsHealthStatusSummary;
  public readonly isAutoReparable: boolean;
  public readonly isDbEmpty: boolean;
  public readonly areCredentialsEmpty: boolean;

  constructor(walletHealth: IWalletsHealth) {
    this.walletHealth = walletHealth;    
    this.isEmpty = this.getIsEmpty();
    this.isOk = this.getIsOk();
    this.isBroken = this.getIsBroken();
    this.isDbEmpty = this.getIsDbEmpty();
    this.areCredentialsEmpty = this.getAreCredentialsEmpty();
    this.btcHealthDetail = this.getBtcHealthDetail();
    this.ethHealthDetail = this.getEthHealthDetail();
    this.brokenDetail = this.getBrokenDetail();
    this.walletHealthStatusSummary = this.getWalletHealthStatusSummary();
    this.isAutoReparable = this.getIsAutoReparable();
  }
  
  private getBtcHealthDetail(): IWalletHealthDetail {
    const btcWalletHealth = this.walletHealth.btc;
    if (btcWalletHealth.address && btcWalletHealth.privateKey && btcWalletHealth.token){
      return {
        status:"OK",
      } 
    }
    
    if (!btcWalletHealth.address && !btcWalletHealth.privateKey && !btcWalletHealth.token){
      return {
        status:"EMPTY",
      } 
    }    
    
    if (!btcWalletHealth.token || !btcWalletHealth.privateKey){        
      return {
        status:"BROKEN",
        repairStrategy:"IRREPARABLE",        
        // usability:btcWalletHealth.address?"READ_ONLY":"NONE",  // comming soon
      }
    }

    return {
      status:"BROKEN",
      repairStrategy:"AUTOREPAIR",
      usability:"NONE",
    }
  }
 
  private getEthHealthDetail(): IWalletHealthDetail {
    const ethWalletHealth = this.walletHealth.eth;
    if (ethWalletHealth.address && ethWalletHealth.privateKey && ethWalletHealth.blockNumAtCreation){
      return {
        status:"OK",
      };
    }
 
    if (!ethWalletHealth.address && !ethWalletHealth.privateKey && !ethWalletHealth.blockNumAtCreation){
      return {
        status:"EMPTY",
      }
    } 


    if (!ethWalletHealth.privateKey){
      return {
        status:"BROKEN",
        repairStrategy:"MNEMONIC",
        usability: ethWalletHealth.address?"READ_ONLY":"NONE",
      }
    }
 
    if (!ethWalletHealth.address){
      return {
        status:"BROKEN",
        repairStrategy:"PASSPHRASE_OR_MNEMONIC",
        usability:"NONE",
      }
    }  

    return {
      status: "BROKEN",
      repairStrategy:"AUTOREPAIR",
      usability:"NONE",
    }   
  }
 
  private getBrokenDetail() {    
    const btcHealthDetail = Object.assign({},this.btcHealthDetail);
    const ethHealthDetail = Object.assign({},this.ethHealthDetail);
    if (this.walletHealth.mnemonic){
      if (btcHealthDetail.status === "EMPTY"){      
        btcHealthDetail.repairStrategy = "MNEMONIC";       
      }
      if (ethHealthDetail.status === "EMPTY"){
        ethHealthDetail.repairStrategy = "MNEMONIC";
      }
    
      return {
        btcHealthDetail,
        ethHealthDetail,
      }
    } 
      
    
    if (btcHealthDetail.status === "EMPTY"){
      if (this.walletHealth.eth.privateKey){
        btcHealthDetail.repairStrategy = "MNEMONIC_AND_PASSPHRASE"; 
      }else {
        btcHealthDetail.repairStrategy = "IRREPARABLE"; 
      }
    }
    
    if (ethHealthDetail.repairStrategy === "MNEMONIC" || ethHealthDetail.status === "EMPTY"){
      ethHealthDetail.repairStrategy = "IRREPARABLE";
    } 
    
    return {
      btcHealthDetail,
      ethHealthDetail,
    }     
  }
 
  private getIsEmpty() {    
    const empty = walletHealthHelper.isEmpty(this.walletHealth);        
    return empty;
  }

  private getIsOk(): boolean {
    const ok = walletHealthHelper.isOk(this.walletHealth);         
    return ok;
  }
 
  private getIsBroken(): boolean {    
    const isBroken = !this.isOk && !this.isEmpty;    
    return isBroken;
  }
 
  private getWalletHealthStatusSummary() {    
    if (this.isOk){      
      return {
       status:"OK",
      }
    }   
     
    if (this.isEmpty){
      return {
       status:"EMPTY",
     };
    }

   return {
     status:"BROKEN",
     brokenDetail:this.brokenDetail,
   };  
  }

  private getIsAutoReparable(): boolean {
    const isAutoReparable =
        this.walletHealth.mnemonic &&
        (this.brokenDetail.ethHealthDetail.status === 'OK' ||
          this.brokenDetail.ethHealthDetail.repairStrategy === 'AUTOREPAIR') &&
        (this.brokenDetail.btcHealthDetail.status === 'OK' ||
          this.brokenDetail.btcHealthDetail.repairStrategy === 'AUTOREPAIR');
    
    return isAutoReparable;
  }

  private getIsDbEmpty(): boolean {
    const isDbEmpty =
        !this.walletHealth.btc.address &&
        !this.walletHealth.eth.address &&
        !this.walletHealth.eth.blockNumAtCreation;    
    return isDbEmpty;
  }

  private getAreCredentialsEmpty(): boolean {
    const areCredentialsEmpty =
      !this.walletHealth.mnemonic &&
      !this.walletHealth.eth.privateKey &&
      !this.walletHealth.btc.privateKey &&
      !this.walletHealth.btc.token;
    return areCredentialsEmpty;
  }
}

export default async function getWalletsHealth(
  userId: string,
): Promise<WalletHealth> {
  const dBInfoPromise = userService.getWalletsDBInfo(userId);
  const keyNamesPromise = credentialService.getAllKeyNamesByUserId(userId);

  const promiseResults = await Promise.all([dBInfoPromise, keyNamesPromise]);

  const dBInfoResult = promiseResults[0];
  const keyNamesResult = promiseResults[1];

  const ethAddress = !!dBInfoResult.ethAddress;
  const ethBlockNumAtCreation = !!dBInfoResult.ethBlockNumAtCreation;
  const btcAddress = !!dBInfoResult.btcAddress;

  const credentialsHealth = walletHealthHelper.getCredentialsHealth(keyNamesResult);

  return new WalletHealth({
    eth: {
      address: ethAddress,
      blockNumAtCreation: ethBlockNumAtCreation,
      privateKey: credentialsHealth.ethPrivateKey,
    },
    btc: {
      address: btcAddress,
      privateKey: credentialsHealth.btcPrivateKey,
      token: credentialsHealth.btcToken,
    },
    mnemonic:credentialsHealth.mnemonic,
  });
}