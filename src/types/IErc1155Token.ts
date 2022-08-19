import { RarityLabel } from './';
export interface IErc1155Token {
  createdBy: string;
  tokenId: string;
  uri: string;
  name: string;
  description: string;
  image: string;
  decimals: string;
  baseId: string;
  properties: {
    rarity: {
      icon: string;
      label: keyof typeof RarityLabel;
      hexcode: string;
      supplyLimit: number;
    };
    game: string;
  };

  localization: {
    uri: string;
    default: string;
    locales: string[];
  };
}
