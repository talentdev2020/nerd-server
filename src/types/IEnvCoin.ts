import eSupportedInterfaces from './eSupportedInterfaces';

export default interface IEnvCoin {
  symbol: string;
  name: string;
  backgroundColor: string;
  icon: string;
  walletApi: eSupportedInterfaces;
  decimalPlaces: number;
  contractAddress: string | null;
  abi: any;
}
