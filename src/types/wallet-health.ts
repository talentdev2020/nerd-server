
export type TWalletStatus = "OK" | "BROKEN" | "EMPTY";
export type TBrokenWalletRepairStrategy  = "AUTOREPAIR" | "PASSPHRASE_OR_MNEMONIC" | "MNEMONIC" | "MNEMONIC_AND_PASSPHRASE" | "IRREPARABLE";
export type TBrokenWalletUsability = "READ_ONLY" | "NONE";

export interface IWalletHealthDetail {
  status:TWalletStatus,  
  repairStrategy?:TBrokenWalletRepairStrategy,
  usability?:TBrokenWalletUsability,
}

export interface IEthWalletHealth {
  address:boolean;
  blockNumAtCreation:boolean;
  privateKey:boolean;
}

export interface IBtcWalletHealth {
  address:boolean;  
  token:boolean;
  privateKey:boolean;
}

export interface IWalletsHealth {  
  eth:IEthWalletHealth;
  btc:IBtcWalletHealth;
  mnemonic:boolean;
}

export interface IWalletsBrokenDetail {
  btcHealthDetail: IWalletHealthDetail;
  ethHealthDetail: IWalletHealthDetail;
};

export interface IWalletsHealthStatusSummary {
  status: string;
  brokenDetail?: {
    btcHealthDetail: IWalletHealthDetail;
    ethHealthDetail: IWalletHealthDetail;
  };
};


export interface IDBWalletHealth{  
  ethAddress:boolean;
  btcAddress:boolean;
  ethBlockNumAtCreation:boolean;
}

export interface IWalletCredentialsHealth{  
  btcToken:boolean;
  btcPrivateKey:boolean;
  ethPrivateKey:boolean,
  mnemonic:boolean;
}

export interface ILeanWalletHealth extends IWalletCredentialsHealth, IDBWalletHealth{}


export interface IUserDBWalletHealth extends IDBWalletHealth{
  userId:string;
  email:string;  
}

export interface IUserWalletCredentialsHealth extends IWalletCredentialsHealth{
  userId:string;  
}

export interface IUserLeanWalletHealth extends ILeanWalletHealth{
  userId:string;
}