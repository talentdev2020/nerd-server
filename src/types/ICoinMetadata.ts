import { eSupportedInterfaces } from '../types';
import {
  BtcWallet,
  EthWallet,
  DocWallet,
  Erc1155Wallet,
  Erc20Wallet,
} from '../wallet-api/coin-wallets';

export default interface ICoinMetadata {
  name: string;
  backgroundColor: string;
  icon: string;
  symbol: string;
  abi: any;
  contractAddress: string | null;
  decimalPlaces: number;
  walletApi: eSupportedInterfaces;
  tokenId?: string;
  WalletInterface:
    | typeof BtcWallet
    | typeof EthWallet
    | typeof DocWallet
    | typeof Erc1155Wallet
    | typeof Erc20Wallet;
}
