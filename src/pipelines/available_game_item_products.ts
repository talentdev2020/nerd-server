import { config } from '../common';

export const availableGameItemProductsPipeline = (game: string) => {
  const matchStage: { [key: string]: any } = {
    $match: {
      baseId: new RegExp('^0x', 'i'),
    },
  };

  if (game) {
    matchStage.$match.game = game;
  }

  return [
    matchStage,
    {
      $sort: {
        baseId: 1,
      },
    },
    {
      $lookup: {
        from: 'erc1155-tokens',
        localField: 'baseId',
        foreignField: 'baseId',
        as: 'token',
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
        _id: 0,
        invoiceAddress: 1,
        baseId: 1,
        price: {
          $toString: {
            $trunc: [
              {
                $divide: ['$usdPriceInCents', '$tokenPriceInCents'],
              },
            ],
          },
        },
        basePrice: {
          $toString: {
            $trunc: [
              {
                $divide: ['$usdBasePriceInCents', '$tokenPriceInCents'],
              },
            ],
          },
        },
        name: {
          $arrayElemAt: ['$token.name', 0],
        },
        description: {
          $arrayElemAt: ['$token.description', 0],
        },
        image: {
          $arrayElemAt: ['$token.image', 0],
        },
        game: {
          $arrayElemAt: ['$token.game', 0],
        },
        coin: 'GALA',
        rarity: {
          $arrayElemAt: ['$token.properties.rarity', 0],
        },
      },
    },
    {
      $lookup: {
        from: 'wallet-transactions',
        let: {
          baseId: '$baseId',
        },
        as: 'transactions',
        pipeline: [
          {
            $match: {
              $or: [
                {
                  to: '', //configAws.galaMasterNodeWalletAddress,
                },
                {
                  from: '', //configAws.galaMasterNodeWalletAddress,
                },
              ],
              $expr: {
                $eq: ['$$baseId', '$baseId'],
              },
            },
          },
          {
            $project: {
              qtySubTotal: {
                $cond: [
                  {
                    $eq: ['$from', ''], //configAws.galaMasterNodeWalletAddress],
                  },
                  {
                    $multiply: ['$amount', -1],
                  },
                  '$amount',
                ],
              },
            },
          },
          {
            $group: {
              _id: '',
              qtyLeft: {
                $sum: '$qtySubTotal',
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        qtyLeft: {
          $ifNull: [
            {
              $arrayElemAt: ['$transactions.qtyLeft', 0],
            },
            0,
          ],
        },
        transactions: '$$REMOVE',
      },
    },
  ];
};
