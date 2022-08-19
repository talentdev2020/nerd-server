import { Types } from 'mongoose';

export interface IGetGameItemProductByBaseIdResult {
  _id: Types.ObjectId;
  hdPath: string;
  invoiceAddress: string;
  name: string;
  game: string;
  price: number;
  basePrice: number;
}

export const getGameItemProductByBaseId = (baseId: string) => [
  {
    $match: {
      baseId,
    },
  },
  {
    $lookup: {
      from: 'token-prices',
      as: 'tokenPrices',
      pipeline: [
        {
          $match: {
            token: 'GALA',
          },
        },
        {
          $sort: {
            timestamp: -1,
          },
        },
        {
          $limit: 1,
        },
      ],
    },
  },
  {
    $addFields: {
      tokenPriceInCents: {
        $divide: [
          {
            $arrayElemAt: ['$tokenPrices.usdPrice', 0],
          },
          {
            $pow: [
              10,
              {
                $subtract: [
                  {
                    $arrayElemAt: ['$tokenPrices.usdPriceDecimals', 0],
                  },
                  2,
                ],
              },
            ],
          },
        ],
      },
    },
  },
  {
    $project: {
      hdPath: 1,
      invoiceAddress: 1,
      name: 1,
      game: 1,
      price: {
        $trunc: [
          {
            $divide: ['$usdPriceInCents', '$tokenPriceInCents'],
          },
        ],
      },
      basePrice: {
        $trunc: [
          {
            $divide: ['$usdBasePriceInCents', '$tokenPriceInCents'],
          },
        ],
      },
    },
  },
];
