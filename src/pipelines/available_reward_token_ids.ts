export interface ITokenIdsAvailable {
  tokenId: string;
}

export const availableRewardTokensPipeline = (
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
    $sort: {
      timestamp: 1,
      logIndex: 1,
    },
  },
  {
    $project: {
      tokenId: 1,
      _id: 0,
    },
  },
  {
    $limit: 10,
  },
];
