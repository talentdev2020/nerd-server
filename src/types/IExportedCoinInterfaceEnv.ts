import ICoinMetadata from './ICoinMetadata';

export default interface IExportedCoinInterfaceEnv {
  btc: ICoinMetadata;
  eth: ICoinMetadata;
  erc20s: ICoinMetadata[];
}
