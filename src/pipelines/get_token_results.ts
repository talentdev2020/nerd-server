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
    $addFields: {
      token: {
        $ifNull: ['$baseId', '$tokenType'],
      },
    },
  },
  {
    $group: {
      _id: '$token',
      token: {
        $first: '$token',
      },
      amount: {
        $sum: '$quantity',
      },
    },
  },
  {
    $lookup: {
      from: 'erc1155-tokens',
      localField: 'token',
      foreignField: 'baseId',
      as: 'erc1155Token',
    },
  },
  {
    $project: {
      _id: 0,
      amount: {
        $floor: '$amount',
      },
      name: {
        $ifNull: [
          {
            $arrayElemAt: ['$erc1155Token.name', 0],
          },
          '$token',
        ],
      },
      imageUrl: {
        $arrayElemAt: ['$erc1155Token.image', 0],
      },
    },
  },
];
