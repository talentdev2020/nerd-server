export default function buildGetUserRewardsPipeline(
  userId: string,
  rewardNames: string[],
) {
  const pipeline = [
    {
      $match: {
        userId: userId,
        rewardName: { $in: rewardNames },
      },
    },
    {
      $group: {
        _id: '$userId',
        balance: {
          $sum: '$amount',
        },
      },
    },
  ];
  return pipeline;
}
