function falsyCondition(fieldPathName: string) {
  return {
    $cond: [
      {
        $eq: [
          {
            $ifNull: [fieldPathName, ''],
          },
          '',
        ],
      },
      false,
      true,
    ],
  };
}

export const walletHealthPipeline = [
  {
    $match: {
      $nor: [{ id: null }, { id: '' }],
    },
  },
  {
    $project: {
      _id: 0,
      userId: '$id',
      email: 1,
      btcAddress: falsyCondition('$wallet.btcAddress'),
      ethAddress: falsyCondition('$wallet.ethAddress'),
      ethBlockNumAtCreation: falsyCondition('$wallet.ethBlockNumAtCreation'),
    },
  },
  {
    $sort: {
      userId: 1,
    },
  },
];