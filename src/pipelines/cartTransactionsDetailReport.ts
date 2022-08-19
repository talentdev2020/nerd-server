import { CartStatus } from 'src/types';

const getPipeline = (
  startDate: Date,
  endDate: Date,
  BTCUSDPrice: string,
  ETHUSDPrice: string,
) => [
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "id",
      as: 'user',
    },
  },
  {
    $unwind: {
      path: "$user",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $match: {
      created: { $gte: new Date(startDate), $lte: new Date(endDate) },
    },
  },
  {
    $sort: {
      created: -1,
      _id: 1,
    },
  },
  {
    $project: {
      _id: 0,
      address: 1,
      name: 1,
      email: '$user.email',
      status: 1,
      productName: 1,
      productId: 1,
      totalUsd: 1,
      cryptoCurrency: "$currency",
      totalCryptoReceived: 1,
      created: 1,
      orderNumber: '$wp_id',
      totalCrypto: 1,
      quantity: 1,
      memberId: 1,
      userId: 1,
      conversionRate: 1,
    },
  },
  {
    $addFields: {
      currentValue: {
        $toString: {
          $multiply: [
            {
              $convert: {
                input: '$totalCryptoReceived',
                to: 'decimal',
                onError: 0,
              },
            },
            {
              $switch: {
                branches: [
                  {
                    case: { $eq: ['$cryptoCurrency', 'BTC'] },
                    then: { $toDecimal: BTCUSDPrice },
                  },
                  {
                    case: { $eq: ['$cryptoCurrency', 'ETH'] },
                    then: { $toDecimal: ETHUSDPrice },
                  },
                ],
                default: 1,
              },
            },
          ],
        },
      },
    },
  },
];

export default getPipeline;
