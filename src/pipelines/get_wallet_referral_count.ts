export interface IWalletReferralCountAggregate {
  id: string;
  ethAddress: string;
  upgradedReferrals: number;
  referralsWithWallet: number;
}

export const walletReferralCounts = (affiliateId: string) => [
  {
    $match: {
      affiliateId,
    },
  },
  {
    $lookup: {
      from: 'users',
      as: 'referrals',
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
          $project: {
            isUpgraded: '$wallet.activations.gala.activated',
            hasWallet: {
              $toBool: '$wallet.ethAddress',
            },
          },
        },
        {
          $group: {
            _id: '',
            isUpgraded: {
              $sum: {
                $cond: ['$isUpgraded', 1, 0],
              },
            },
            hasWallet: {
              $sum: {
                $cond: ['$hasWallet', 1, 0],
              },
            },
          },
        },
      ],
    },
  },
  {
    $project: {
      id: 1,
      ethAddress: '$wallet.ethAddress',
      upgradedReferrals: {
        $ifNull: [
          {
            $arrayElemAt: ['$referrals.isUpgraded', 0],
          },
          0,
        ],
      },
      referralsWithWallet: {
        $ifNull: [
          {
            $arrayElemAt: ['$referrals.hasWallet', 0],
          },
          0,
        ],
      },
    },
  },
];
