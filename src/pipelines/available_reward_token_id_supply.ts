export interface IRewardTokenSupply {
  supplyRemaining: number;
}

export const availableRewardTokenSupplyPipeline = (
  rewardWalletAddress: string,
  baseId: string,
) => [
  {
    $match: {
      $or: [
        {
          to: rewardWalletAddress,
        },
        {
          from: rewardWalletAddress,
        },
      ],
      status: {
        $in: ['pending', 'confirmed'],
      },
      baseId,
      tokenId: {
        $nin: ['$baseId', null, ''],
      },
    },
  },
  {
    $sort: {
      timestamp: 1,
      blockNumber: 1,
      logIndex: 1,
    },
  },
  {
    $group: {
      _id: '$tokenId',
      tokenId: {
        $first: '$tokenId',
      },
      lastOwner: {
        $last: '$to',
      },
      timestamp: {
        $last: '$timestamp',
      },
      logIndex: {
        $first: '$logIndex',
      },
    },
  },
  {
    $match: {
      lastOwner: rewardWalletAddress,
    },
  },
  {
    $group: {
      _id: 1,
      supplyRemaining: {
        $sum: 1,
      },
    },
  },
];
