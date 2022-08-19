export const referralRewardsPipeline = (userId: string) => [
  {
    $match: {
      id: userId,
    },
  },
  {
    $project: {
      id: 1,
      affiliateId: 1,
    },
  },
  {
    $lookup: {
      from: 'licenses',
      localField: 'id',
      foreignField: 'userId',
      as: 'licenses',
    },
  },
  {
    $lookup: {
      from: 'users',
      as: 'rewardsEarned',
      let: {
        affiliateId: '$affiliateId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$$affiliateId', '$referredBy'],
            },
          },
        },
        {
          $addFields: {
            upgradeCount: {
              $cond: ['$wallet.activations.gala.activated', 1, 0],
            },
          },
        },
        {
          $lookup: {
            from: 'licenses',
            localField: 'id',
            foreignField: 'userId',
            as: 'licenses',
          },
        },
        {
          $lookup: {
            from: 'game-activities',
            localField: 'id',
            foreignField: 'userId',
            as: 'gameActivities',
          },
        },
        {
          $group: {
            _id: 1,
            friendsJoined: {
              $sum: 1,
            },
            friendsPlayed: {
              $sum: {
                $cond: [
                  {
                    $gte: [{ $size: '$gameActivities' }, 3],
                  },
                  1,
                  0,
                ],
              },
            },
            btcEarned: {
              $sum: '$wallet.activations.gala.btcToReferrer',
            },
            galaEarned: {
              $sum: '$wallet.activations.gala.referrerReward.gala.amount',
            },
            goldUpgrades: {
              $sum: '$upgradeCount',
            },
            nodesPurchasedByReferrals: {
              $sum: {
                $size: '$licenses',
              },
            },
          },
        },
      ],
    },
  },
  {
    $project: {
      friendsJoined: {
        $ifNull: [
          {
            $arrayElemAt: ['$rewardsEarned.friendsJoined', 0],
          },
          0,
        ],
      },
      friendsPlayed: {
        $ifNull: [
          {
            $arrayElemAt: ['$rewardsEarned.friendsPlayed', 0],
          },
          0,
        ],
      },
      btcEarned: {
        $ifNull: [
          {
            $arrayElemAt: ['$rewardsEarned.btcEarned', 0],
          },
          0,
        ],
      },
      galaEarned: {
        $ifNull: [
          {
            $arrayElemAt: ['$rewardsEarned.galaEarned', 0],
          },
          0,
        ],
      },
      upgradedReferrals: {
        $ifNull: [
          {
            $arrayElemAt: ['$rewardsEarned.goldUpgrades', 0],
          },
          0,
        ],
      },
      nodesPurchasedByReferrals: {
        $ifNull: [
          {
            $arrayElemAt: ['$rewardsEarned.nodesPurchasedByReferrals', 0],
          },
          0,
        ],
      },
      nodesOwned: {
        $size: '$licenses',
      },
    },
  },
];
