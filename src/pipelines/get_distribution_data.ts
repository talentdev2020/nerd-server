export const getPipeline = (email: string, startDate: Date, endDate: Date) => [
  {
    $match: {
      email,
    },
  },
  {
    $project: {
      _id: 0,
      firstName: 1,
      lastName: 1,
      email: 1,
      id: 1,
    },
  },
  {
    $lookup: {
      from: 'promotional-rewards',
      let: {
        userId: '$id',
      },
      pipeline: [
        {
          $match: {
            created: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $group: {
            _id: '',
            points: {
              $push: '$$ROOT',
            },
          },
        },
        {
          $addFields: {
            _id: '$$REMOVE',
            totalPoolPoints: {
              $sum: '$points.amount',
            },
            userPoints: {
              $filter: {
                input: '$points',
                cond: {
                  $eq: ['$$this.userId', '$$userId'],
                },
              },
            },
          },
        },
        {
          $addFields: {
            points: '$$REMOVE',
          },
        },
        {
          $unwind: {
            path: '$userPoints',
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              totalPoolPoints: '$totalPoolPoints',
              pointType: '$userPoints.rewardType',
              amount: '$userPoints.amount',
            },
          },
        },
      ],
      as: 'points',
    },
  },
  {
    $addFields: {
      totalPoolPoints: {
        $arrayElemAt: ['$points.totalPoolPoints', 0],
      },
    },
  },
  {
    $unwind: {
      path: '$points',
    },
  },
  {
    $group: {
      _id: '$points.pointType',
      firstName: {
        $first: '$firstName',
      },
      lastName: {
        $first: '$lastName',
      },
      email: {
        $first: '$email',
      },
      userId: {
        $first: '$id',
      },
      totalPoolPoints: {
        $first: '$totalPoolPoints',
      },
      pointType: {
        $first: '$points.pointType',
      },
      amount: {
        $sum: '$points.amount',
      },
    },
  },
  {
    $group: {
      _id: '',
      firstName: {
        $first: '$firstName',
      },
      lastName: {
        $first: '$lastName',
      },
      email: {
        $first: '$email',
      },
      userId: {
        $first: '$userId',
      },
      totalPoolPoints: {
        $first: '$totalPoolPoints',
      },
      points: {
        $push: {
          pointType: '$pointType',
          amount: '$amount',
        },
      },
    },
  },
  {
    $addFields: {
      _id: '$$REMOVE',
    },
  },
  {
    $lookup: {
      from: 'wallet-transactions',
      let: {
        userId: '$userId',
      },
      pipeline: [
        {
          $match: {
            mintTransaction: true,
            $expr: {
              $and: [
                {
                  $gte: [
                    {
                      $toDate: {
                        $multiply: ['$timestamp', 1000],
                      },
                    },
                    startDate,
                  ],
                },
                {
                  $lte: [
                    {
                      $toDate: {
                        $multiply: ['$timestamp', 1000],
                      },
                    },
                    endDate,
                  ],
                },
                {
                  $eq: ['$toUser', '$$userId'],
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: '$baseId',
            baseId: {
              $first: '$baseId',
            },
            amount: {
              $sum: '$amount',
            },
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
          $addFields: {
            amount: {
              $divide: [
                '$amount',
                {
                  $pow: [
                    10,
                    {
                      $arrayElemAt: ['$token.decimals', 0],
                    },
                  ],
                },
              ],
            },
            token: {
              $arrayElemAt: ['$token.name', 0],
            },
          },
        },
        {
          $project: {
            _id: 0,
            token: 1,
            amount: 1,
          },
        },
      ],
      as: 'tokensReceived',
    },
  },
];
