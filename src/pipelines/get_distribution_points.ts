export const getPipeline = (userId: string, startDate: Date, endDate: Date) => [
  {
    $match: {
      userId,
      created: {
        $gte: startDate,
        $lte: endDate,
      },
    },
  },
  {
    $group: {
      _id: '$rewardType',
      pointType: { $first: '$rewardType' },
      amount: { $sum: '$amount' },
    },
  },
  {
    $addFields: {
      amount: {
        $round: ['$amount', 1],
      },
    },
  },
];
