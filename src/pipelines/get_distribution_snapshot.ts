export const getPipeline = (userId: string) => [
  {
    $match: {
      startTime: {
        $exists: true,
      },
      endTime: {
        $exists: true,
      },
      error: {
        $in: ['', null],
      },
    },
  },
  {
    $project: {
      processId: 1,
      distributionDate: {
        $dateToString: {
          date: '$created',
          format: '%Y-%m-%d',
        },
      },
      startTime: 1,
      endTime: 1,
    },
  },
  {
    $group: {
      _id: '$distributionDate',
      distributionDate: {
        $first: '$distributionDate',
      },
      processes: {
        $push: {
          processId: '$processId',
          startTime: '$startTime',
          endTime: '$endTime',
        },
      },
    },
  },
  {
    $match: {
      'processes.processId': {
        $in: ['item-generator', 'token-generator'],
      },
    },
  },
  {
    $sort: {
      distributionDate: -1,
    },
  },
  {
    $limit: 1,
  },
  {
    $unwind: {
      path: '$processes',
    },
  },
  {
    $group: {
      _id: '',
      startDate: {
        $min: '$processes.startTime',
      },
      endDate: {
        $max: '$processes.endTime',
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
      from: 'distribution-results',
      let: {
        startDate: '$startDate',
        endDate: '$endDate',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                {
                  $gte: ['$created', '$$startDate'],
                },
                {
                  $lte: ['$created', '$$endDate'],
                },
                {
                  $eq: ['$userId', userId],
                },
              ],
            },
          },
        },
        {
          $project: {
            _id: 0,
            quantity: 1,
            tokenType: 1,
          },
        },
        {
          $group: {
            _id: '$tokenType',
            tokenType: {
              $first: '$tokenType',
            },
            quantity: {
              $sum: '$quantity',
            },
          },
        },
        {
          $addFields: {
            _id: '$$REMOVE',
            quantity: {
              $floor: '$quantity',
            },
          },
        },
      ],
      as: 'tokens',
    },
  },
  {
    $lookup: {
      from: 'promotional-rewards',
      let: {
        startDate: '$startDate',
        endDate: '$endDate',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                {
                  $eq: ['$userId', userId],
                },
                {
                  $gte: ['$created', '$$startDate'],
                },
                {
                  $lte: ['$created', '$$endDate'],
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: '',
            total: {
              $sum: '$amount',
            },
          },
        },
      ],
      as: 'points',
    },
  },
  {
    $project: {
      date: '$startDate',
      gala: {
        $reduce: {
          input: '$tokens',
          initialValue: 0,
          in: {
            $cond: [
              {
                $eq: ['$$this.tokenType', 'gala'],
              },
              {
                $add: ['$$value', '$$this.quantity'],
              },
              '$$value',
            ],
          },
        },
      },
      items: {
        $reduce: {
          input: '$tokens',
          initialValue: 0,
          in: {
            $cond: [
              {
                $eq: ['$$this.tokenType', 'item'],
              },
              {
                $add: ['$$value', '$$this.quantity'],
              },
              '$$value',
            ],
          },
        },
      },
      points: {
        $round: [{ $sum: '$points.total' }, 1],
      },
    },
  },
];
