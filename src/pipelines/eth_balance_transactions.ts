import { TransactionType } from '../types/IWalletTransaction';

export interface IEthBalanceTransactions {
  pendingBalance: string;
  confirmedBalance: string;
  transactions: Array<{
    to: string;
    from: string;
    timestamp: number;
    blockNumber: number;
    fee: string;
    id: string;
    status: string;
    total: string;
    amount: string;
    type: string;
  }>;
}

export const ethBalanceTransactionsPipeline = (ethAddress: string) => [
  {
    $match: {
      $or: [
        {
          to: new RegExp(ethAddress, 'i'),
          type: {
            $in: [TransactionType.Eth, TransactionType.InternalEth],
          },
        },
        {
          from: new RegExp(ethAddress, 'i'),
          type: {
            $in: [TransactionType.Eth, TransactionType.InternalEth],
          },
        },
        {
          from: new RegExp(ethAddress, 'i'),
          gasUsed: {
            $gt: 0,
          },
        },
      ],
    },
  },
  {
    $addFields: {
      isFromUser: {
        $eq: [
          {
            $toLower: '$from',
          },
          ethAddress.toLowerCase(),
        ],
      },
      fee: {
        $multiply: ['$gasPrice', '$gasUsed'],
      },
      amountDivisor: {
        $pow: [10, '$decimalsStored'],
      },
      feeDivisor: {
        $pow: [10, '$gasPriceDecimals'],
      },
    },
  },
  {
    $project: {
      hash: 1,
      type: 1,
      status: 1,
      blockNumber: 1,
      timestamp: 1,
      isFromUser: 1,
      to: 1,
      from: 1,
      fee: {
        $cond: [
          '$isFromUser',
          {
            $divide: [
              {
                $subtract: [0, '$fee'],
              },
              '$feeDivisor',
            ],
          },
          0,
        ],
      },
      amount: {
        $cond: [
          {
            $in: ['$type', [TransactionType.Eth, TransactionType.InternalEth]],
          },
          {
            $cond: [
              '$isFromUser',
              {
                $divide: [
                  {
                    $subtract: [0, '$amount'],
                  },
                  '$amountDivisor',
                ],
              },
              {
                $divide: ['$amount', '$amountDivisor'],
              },
            ],
          },
          0,
        ],
      },
    },
  },
  {
    $group: {
      _id: '$hash',
      isFromUser: {
        $max: '$isFromUser',
      },
      to: {
        $first: '$to',
      },
      from: {
        $first: '$from',
      },
      timestamp: {
        $first: '$timestamp',
      },
      blockNumber: {
        $first: '$blockNumber',
      },
      amount: {
        $sum: {
          $cond: [
            {
              $in: [
                '$type',
                [TransactionType.Eth, TransactionType.InternalEth],
              ],
            },
            '$amount',
            0,
          ],
        },
      },
      fee: {
        $min: '$fee',
      },
      hash: {
        $first: '$hash',
      },
      status: {
        $first: '$status',
      },
    },
  },
  {
    $addFields: {
      amount: {
        $cond: [
          '$isFromUser',
          {
            $sum: ['$amount', '$fee'],
          },
          '$amount',
        ],
      },
    },
  },
  {
    $addFields: {
      amount: {
        $cond: [
          {
            $eq: ['$status', 'reverted'],
          },
          '$fee',
          '$amount',
        ],
      },
      status: {
        $cond: [
          {
            $eq: ['$status', 'reverted'],
          },
          'confirmed',
          '$status',
        ],
      },
    },
  },
  {
    $project: {
      _id: 0,
      id: '$hash',
      status: {
        $cond: [
          {
            $eq: ['$status', 'pending'],
          },
          'Pending',
          {
            $cond: [
              {
                $eq: ['$status', 'confirmed'],
              },
              'Confirmed',
              '$status',
            ],
          },
        ],
      },
      blockNumber: 1,
      timestamp: 1,
      fee: 1,
      to: 1,
      from: 1,
      amount: 1,
      type: {
        $cond: ['$isFromUser', 'Withdrawal', 'Deposit'],
      },
    },
  },
  {
    $addFields: {
      pendingTotal: '$amount',
      confirmedTotal: {
        $cond: [
          {
            $eq: ['$status', 'Confirmed'],
          },
          '$amount',
          0,
        ],
      },
    },
  },
  {
    $match: {
      pendingTotal: {
        $ne: 0,
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
      _id: '',
      pendingBalance: {
        $sum: '$pendingTotal',
      },
      confirmedBalance: {
        $sum: '$confirmedTotal',
      },
      transactions: {
        $push: {
          to: '$to',
          from: '$from',
          timestamp: '$timestamp',
          blockNumber: '$blockNumber',
          fee: {
            $toString: '$fee',
          },
          id: '$id',
          status: '$status',
          total: {
            $toString: '$pendingTotal',
          },
          amount: {
            $toString: '$amount',
          },
          type: '$type',
        },
      },
    },
  },
  {
    $project: {
      _id: 0,
      pendingBalance: {
        $toString: {
          $trunc: ['$pendingBalance', 8],
        },
      },
      confirmedBalance: {
        $toString: {
          $trunc: ['$confirmedBalance', 8],
        },
      },
      transactions: 1,
    },
  },
];
