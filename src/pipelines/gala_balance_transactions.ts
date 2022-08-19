export const buildGalaBalanceTransactionsPipeline = (ethAddress: string) => [
  {
    $match: {
      contractName: 'GALA-ERC20',
      status: {
        $in: ['pending', 'confirmed'],
      },
      $or: [
        {
          from: ethAddress,
        },
        {
          to: ethAddress,
        },
      ],
    },
  },
  {
    $project: {
      _id: 0,
      id: '$hash',
      to: 1,
      from: 1,
      fromUser: {
        $eq: ['$from', ethAddress],
      },
      blockNumber: 1,
      isPending: {
        $eq: ['$status', 'pending'],
      },
      amount: 1,
      gasUsed: 1,
      gasPrice: 1,
      timestamp: 1,
      feeDivisor: {
        $pow: [10, '$gasPriceDecimals'],
      },
      tokenDivisor: {
        $pow: [10, '$decimalsStored'],
      },
    },
  },
  {
    $addFields: {
      fee: {
        $cond: [
          {
            $and: [
              {
                $gt: ['$gasUsed', 0],
              },
              '$fromUser',
            ],
          },
          {
            $concat: [
              {
                $toString: {
                  $trunc: [
                    {
                      $toDecimal: {
                        $divide: [
                          {
                            $multiply: ['$gasUsed', '$gasPrice'],
                          },
                          '$feeDivisor',
                        ],
                      },
                    },
                    6,
                  ],
                },
              },
              ' ETH',
            ],
          },
          {
            $cond: ['$fromUser', 'TBD', '0'],
          },
        ],
      },
      type: {
        $cond: ['$fromUser', 'Withdrawal', 'Deposit'],
      },
      to: ['$to'],
      amount: {
        $cond: [
          '$fromUser',
          {
            $subtract: [
              0,
              {
                $divide: ['$amount', '$tokenDivisor'],
              },
            ],
          },
          {
            $divide: ['$amount', '$tokenDivisor'],
          },
        ],
      },
      feeDivisor: '$$REMOVE',
      tokenDivisor: '$$REMOVE',
    },
  },
  {
    $project: {
      amount: 1,
      blockNumber: 1,
      from: 1,
      to: 1,
      id: 1,
      fee: 1,
      type: 1,
      timestamp: 1,
      feeString: {
        $cond: [
          {
            $eq: ['$fee', '0'],
          },
          '',
          {
            $concat: [', -', '$fee'],
          },
        ],
      },
      confirmedAmount: {
        $cond: [
          {
            $eq: ['$isPending', false],
          },
          {
            $trunc: ['$amount', 8],
          },
          0,
        ],
      },
      pendingAmount: {
        $trunc: ['$amount', 8],
      },
      status: {
        $cond: ['$isPending', 'Pending', 'Confirmed'],
      },
    },
  },
  {
    $sort: {
      timestamp: -1,
    },
  },
  {
    $group: {
      _id: 1,
      pendingBalance: {
        $sum: '$pendingAmount',
      },
      confirmedBalance: {
        $sum: '$confirmedAmount',
      },
      transactions: {
        $push: {
          id: '$id',
          status: '$status',
          blockNumber: '$blockNumber',
          fee: '$fee',
          to: '$to',
          from: '$from',
          timestamp: '$timestamp',
          type: '$type',
          amount: '$amount',
        },
      },
    },
  },
];
