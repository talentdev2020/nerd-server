import {
  eSupportedInterfaces,
  ItemTokenName,
  IRewardItemMetadata,
} from '../types';
import { configAws } from '.';
import * as erc1155Abi from './ABI/erc1155.json';
import Erc1155API from '../wallet-api/coin-wallets/erc1155-wallet';

class ItemRewardConfig {

  public getItemRewardConfig = (): Map<ItemTokenName, IRewardItemMetadata> => {
    const { contractAddresses, tokenIds } = configAws;

    const betaKey = {
      walletApi: eSupportedInterfaces.erc1155,
      name: 'Town Star Beta Key',
      backgroundColor: '#FFFFFF',
      icon:
        'https://gala-tokens.s3-us-west-2.amazonaws.com/images/sandbox-games/town-star/beta/beta-key.png',
      abi: erc1155Abi,
      decimalPlaces: 0,
      contractAddress: contractAddresses.gala,
      tokenId: tokenIds[ItemTokenName.BETA_KEY],
      symbol: '',
      supplyWarnThreshold: 1000,
      WalletInterface: Erc1155API, // Do not use. This is just to make typescript happy.
    };
    const alfaFountainOk = {
      walletApi: eSupportedInterfaces.erc1155,
      name: 'Alfa Fountain Ok',
      backgroundColor: '#FFFFFF',
      icon:
        'https://gala-tokens.s3-us-west-2.amazonaws.com/images/sandbox-games/town-star/alfa-fountain/alfa-fountain-ok.png',
      abi: erc1155Abi,
      decimalPlaces: 0,
      contractAddress: contractAddresses.gala,
      tokenId: tokenIds[ItemTokenName.ALFA_FOUNTAIN_OK],
      symbol: '',
      supplyWarnThreshold: 1000,
      WalletInterface: Erc1155API, // Do not use. This is just to make typescript happy.
    };
    const alfaFountainGood = {
      walletApi: eSupportedInterfaces.erc1155,
      name: 'Alfa Fountain Good',
      backgroundColor: '#FFFFFF',
      icon:
        'https://gala-tokens.s3-us-west-2.amazonaws.com/images/sandbox-games/town-star/alfa-fountain/alfa-fountain-good.png',
      abi: erc1155Abi,
      decimalPlaces: 0,
      contractAddress: contractAddresses.gala,
      tokenId: tokenIds[ItemTokenName.ALFA_FOUNTAIN_GOOD],
      symbol: '',
      supplyWarnThreshold: 1000,
      WalletInterface: Erc1155API, // Do not use. This is just to make typescript happy.
    };
    const alfaFountainGreat = {
      walletApi: eSupportedInterfaces.erc1155,
      name: 'Alfa Fountain Great',
      backgroundColor: '#FFFFFF',
      icon:
        'https://gala-tokens.s3-us-west-2.amazonaws.com/sandbox-games/town-star/alfa-fountain/alfa-fountain-great.json',
      abi: erc1155Abi,
      decimalPlaces: 0,
      contractAddress: contractAddresses.gala,
      tokenId: tokenIds[ItemTokenName.ALFA_FOUNTAIN_GREAT],
      symbol: '',
      supplyWarnThreshold: 1000,
      WalletInterface: Erc1155API, // Do not use. This is just to make typescript happy.
    };
    const alfaFountainMajestic = {
      walletApi: eSupportedInterfaces.erc1155,
      name: 'Alfa Fountain Majestic',
      backgroundColor: '#FFFFFF',
      icon:
        'https://gala-tokens.s3-us-west-2.amazonaws.com/images/sandbox-games/town-star/alfa-fountain/alfa-fountain-majestic.png',
      abi: erc1155Abi,
      decimalPlaces: 0,
      contractAddress: contractAddresses.gala,
      tokenId: tokenIds[ItemTokenName.ALFA_FOUNTAIN_MAJESTIC],
      symbol: '',
      supplyWarnThreshold: 100,
      WalletInterface: Erc1155API, // Do not use. This is just to make typescript happy.
    };
    
    const expressDepot = {
      walletApi: eSupportedInterfaces.erc1155,
      name: 'Express Depot',
      backgroundColor: '#FFFFFF',
      icon:
        'https://gala-tokens.s3-us-west-2.amazonaws.com/images/sandbox-games/town-star/express-depot/express-depot.png',
      abi: erc1155Abi,
      decimalPlaces: 0,
      contractAddress: contractAddresses.gala,
      tokenId: tokenIds[ItemTokenName.EXPRESS_DEPOT],
      symbol: '',
      supplyWarnThreshold: 1000,
      WalletInterface: Erc1155API, // Do not use. This is just to make typescript happy.
    };

    const results = new Map<ItemTokenName, IRewardItemMetadata>([
      [ItemTokenName.BETA_KEY, betaKey],
      [ItemTokenName.ALFA_FOUNTAIN_OK, alfaFountainOk],
      [ItemTokenName.ALFA_FOUNTAIN_GOOD, alfaFountainGood],
      [ItemTokenName.ALFA_FOUNTAIN_GREAT, alfaFountainGreat],
      [ItemTokenName.ALFA_FOUNTAIN_MAJESTIC, alfaFountainMajestic],
      [ItemTokenName.EXPRESS_DEPOT, expressDepot],
    ]);

    return results;
  }

};

const itemConfig = new ItemRewardConfig();
export default itemConfig;
