export const simulateNodeDistributionPipeline = (
  startDate: Date,
  endDate: Date,
) =>
  // Pipeline
  [
    // Stage 1
    {
      $match: {
        'lastCheckIn.time': {
          $gte: startDate,
          $lte: endDate,
        },
        userId: { $exists: true },
      },
    },
    // Stage 2
    {
      $addFields: {
        stop: {
          $ifNull: ['$stop', endDate],
        },
        start: {
          $cond: [{ $lt: ['$start', startDate] }, startDate, '$start'],
        },
      },
    },
    // Stage 3
    {
      $addFields: {
        duration: {
          $subtract: ['$stop', '$start'],
        },
        nodesRunning: 1,
      },
    },
    // Stage 4
    {
      $match: {
        duration: {
          $gt: 0,
        },
      },
    },
    // Stage 5
    {
      $group: {
        _id: {
          machineId: '$hardwareId',
          userId: '$userId',
        },
        machineId: {
          $first: '$hardwareId',
        },
        userId: {
          $first: '$userId',
        },
        hashrate: {
          $avg: '$duration',
        },
        btcValue: {
          $sum: '$duration',
        },
        satoshiValue: {
          $sum: '$duration',
        },
        totalDuration: {
          $sum: '$duration',
        },
        nodesRunning: {
          $sum: '$nodesRunning',
        },
      },
    },
    // Needs to be on for 6 hrs
    {
      $match: {
        totalDuration: { $gte: 21600000 },
      },
    },
    // Stage 6
    {
      $addFields: {
        satoshiValue: {
          $toInt: {
            $floor: {
              $divide: ['$satoshiValue', 1],
            },
          },
        },
      },
    },
    // Stage 7
    {
      $sort: {
        satoshiValue: -1,
      },
    },
    // Stage 8
    {
      $group: {
        _id: '$userId',
        userId: {
          $first: '$userId',
        },
        nodes: {
          $push: {
            machineId: '$machineId',
            hashrate: '$hashrate',
            satoshiValue: '$satoshiValue',
            totalDuration: '$totalDuration',
          },
        },
      },
    },
    // Stage 9
    {
      $lookup: {
        from: 'licenses',
        localField: 'userId',
        foreignField: 'userId',
        as: 'licenses',
      },
    },
    // Stage 10
    {
      $addFields: {
        licenseCount: {
          $size: '$licenses',
        },
        licenses: '$$REMOVE',
        _id: '$$REMOVE',
      },
    },
    // Stage 11
    {
      $addFields: {
        licensedNodes: {
          $slice: ['$nodes', '$licenseCount'],
        },
        unlicensedNodes: {
          $slice: ['$nodes', '$licenseCount', 1000000],
        },
      },
    },
    // Stage 12
    {
      $addFields: {
        licensedNodesCount: { $size: '$licensedNodes' },
        unlicensedNodesCount: { $size: '$unlicensedNodes' },
      },
    },
    // Stage 13
    {
      $match: {
        $or: [
          {
            licensedNodes: {
              $gt: [] as [],
            },
          },
          {
            unlicensedNodes: {
              $gt: [] as [],
            },
          },
        ],
      },
    },
    // Stage 14
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: 'id',
        as: 'user',
      },
    },
    // Stage 15
    // {
    //   $match: {
    //     $or: [
    //       {
    //         'user.wallet.ethAddress': {
    //           $exists: true,
    //         },
    //       },
    //       {
    //         'user.distributionEthAddress': {
    //           $exists: true,
    //         },
    //       },
    //     ],
    //   },
    // },
    // Stage 16
    {
      $addFields: {
        address: {
          $ifNull: [
            {
              $arrayElemAt: ['$user.distributionEthAddress', 0],
            },
            {
              $ifNull: [
                {
                  $arrayElemAt: ['$user.wallet.ethAddress', 0],
                },
                '0x00',
              ],
            },
          ],
        },
        user: '$$REMOVE',
      },
    },
    // Stage 17
    {
      $unwind: {
        path: '$licensedNodes',
        preserveNullAndEmptyArrays: true,
      },
    },
    // Stage 18
    {
      $unwind: {
        path: '$unlicensedNodes',
        preserveNullAndEmptyArrays: true,
      },
    },
    // Stage 19
    {
      $addFields: {
        'unlicensedNodes.satoshiValue': {
          $toInt: {
            $divide: [
              {
                $ifNull: ['$unlicensedNodes.satoshiValue', 0],
              },
              20,
            ],
          },
        },
      },
    },
    // Stage 20
    {
      $group: {
        _id: '$userId',
        userId: {
          $first: '$userId',
        },
        address: {
          $first: '$address',
        },
        satoshiValue: {
          $sum: '$licensedNodes.satoshiValue',
        },
        hashrate: {
          $avg: '$licensedNodes.hashrate',
        },
        unlicensedSatoshiValue: {
          $sum: '$unlicensedNodes.satoshiValue',
        },
        power: {
          $sum: 1,
        },
        licensedTotalDuration: {
          $sum: '$licensedNodes.totalDuration',
        },
        unlicensedTotalDuration: {
          $sum: '$unlicensedNodes.totalDuration',
        },
        licenseCount: {
          $first: '$licenseCount',
        },
        licensedNodesCount: {
          $first: '$licensedNodesCount',
        },
        unlicensedNodesCount: {
          $first: '$unlicensedNodesCount',
        },
        nodesRunning: {
          $first: '$nodesRunning',
        },
      },
    },
    // Stage 21
    {
      $addFields: {
        hashrate: {
          $divide: [
            {
              $floor: {
                $divide: [
                  '$hashrate',
                  {
                    $pow: [10, 6],
                  },
                ],
              },
            },
            {
              $pow: [10, 6],
            },
          ],
        },
        satoshiValue: {
          $add: ['$satoshiValue', '$unlicensedSatoshiValue'],
        },
        totalDuration: {
          $add: ['$licensedTotalDuration', '$unlicensedTotalDuration'],
        },
        unlicensedSatoshiValue: '$$REMOVE',
      },
    },
    // Stage 22
    {
      $addFields: {
        hashrate: 1,
        power: 1,
      },
    },
  ];
