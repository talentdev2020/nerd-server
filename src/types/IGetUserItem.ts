export interface IGetUserItemResponse {
  game: string;
  baseId: string;
  decimals: number | null;
  description: string;
  image: string;
  name: string;
  properties: {
    game: string;
    tokenRun: string;
    farmbot: {
      requiredQty: number;
    };
    rarity: {
      icon: string;
      label: string;
      hexcode: string;
      supplyLimit: 5856;
    };
  };
  balance: {
    confirmed: number;
    pending: number;
  };
}
