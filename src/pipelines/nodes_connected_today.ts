export const buildGalaBalanceTransactionsPipeline = (startDate: Date) => [
  // Stage 1
  {
    // enter query here
    $match: { start: { $gte: new Date(startDate) } },
  },

  // Stage 2
  {
    $addFields: {
      node: 1,
    },
  },

  // Stage 3
  {
    $group: {
      _id: {
        userId: '$userId',
        //        hardwareId: "$hardwareId",
      },
      userId: {
        $first: '$userId',
      },
      nodesRunning: {
        $sum: '$node',
      },
    },
  },

  // Stage 4
  {
    $sort: {
      nodesRunning: -1,
    },
  },
];
