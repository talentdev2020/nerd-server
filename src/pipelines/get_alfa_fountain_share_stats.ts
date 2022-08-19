import { config } from '../common';

export const alfaFountainSharesPipeline = (userEthAddress: string) => [
  {
    $match: {
      'properties.tokenRun': 'alfa-fountain',
    },
  },
  {
    $lookup: {
      from: 'wallet-transactions',
      let: {
        baseId: '$baseId',
      },
      as: 'rewardStats',
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$$baseId', '$baseId'],
            },
          },
        },
        {
          $addFields: {
            userSubtotal: {
              $cond: [
                {
                  $eq: ['$to', userEthAddress],
                },
                '$amount',
                {
                  $cond: [
                    {
                      $eq: ['$from', userEthAddress],
                    },
                    {
                      $multiply: ['$amount', -1],
                    },
                    0,
                  ],
                },
              ],
            },
            masterNodeReceived: {
              $cond: [
                {
                  $eq: ['$to', ''], // config.galaMasterNodeWalletAddress],
                },
                '$amount',
                0,
              ],
            },
            masterNodeSent: {
              $cond: [
                {
                  $eq: ['$from', ''], // config.galaMasterNodeWalletAddress],
                },
                '$amount',
                0,
              ],
            },
          },
        },
        {
          $group: {
            _id: 1,
            masterNodeTotalReceived: {
              $sum: '$masterNodeReceived',
            },
            masterNodeTotalSent: {
              $sum: '$masterNodeSent',
            },
            userQuantity: {
              $sum: '$userSubtotal',
            },
          },
        },
      ],
    },
  },
  {
    $addFields: {
      totalMinted: {
        $ifNull: [
          {
            $arrayElemAt: ['$rewardStats.masterNodeTotalReceived', 0],
          },
          0,
        ],
      },
      totalSent: {
        $ifNull: [
          {
            $arrayElemAt: ['$rewardStats.masterNodeTotalSent', 0],
          },
          0,
        ],
      },
      userQuantity: {
        $ifNull: [
          {
            $arrayElemAt: ['$rewardStats.userQuantity', 0],
          },
          0,
        ],
      },
    },
  },
  {
    $project: {
      _id: 0,
      name: 1,
      image: 1,
      rarityIcon: '$properties.rarity.icon',
      description: 1,
      totalToBeMinted: '$properties.rarity.supplyLimit',
      totalRemaining: {
        $subtract: ['$totalMinted', '$totalSent'],
      },
      totalReferralsNeeded: '$properties.shareRequirement',
      ownedByUser: {
        $gt: ['$userQuantity', 0],
      },
    },
  },
  {
    $sort: {
      totalToBeMinted: -1,
    },
  },
];
