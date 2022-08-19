import { subMinutes } from 'date-fns';

const minLastCheckIn = subMinutes(new Date(), 30);

// Todo the next pipeline needs to be modified in order to add
// the balance, (Need to clarify if return the sum btcTorrefer of all brands)
// and retrieve nodes upgraded for all brands not just gala.
export const getPipeline = (userId: string, brand = 'gala') => [
  {
    $match: {
      id: userId,
    },
  },
  {
    $project: {
      _id: 0,
      affiliateId: 1,
    },
  },
  {
    $lookup: {
      from: 'users',
      as: 'friends',
      let: { affiliateId: '$affiliateId' },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$referredBy', '$$affiliateId'],
            },
          },
        },
        {
          $project: {
            _id: 0,
            id: 1,
            hasUpgrade: {
              $cond: [`$wallet.activations.${brand}.activated`, 1, 0],
            },
          },
        },
        {
          $lookup: {
            from: 'licenses',
            as: 'nodesOwned',
            foreignField: 'userId',
            localField: 'id',
          },
        },
        {
          $addFields: {
            nodesOwned: { $size: '$nodesOwned' },
          },
        },
        {
          $lookup: {
            from: 'miningrecords',
            let: { id: '$id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$userId', '$$id'],
                  },
                  stop: { $eq: null as Object },
                  'lastCheckIn.time': { $gt: minLastCheckIn },
                },
              },
            ],
            as: 'nodesOnline',
          },
        },
        {
          $addFields: {
            nodesOnline: { $size: '$nodesOnline' },
          },
        },
      ],
    },
  },
  {
    $project: {
      nodesOnline: { $sum: '$friends.nodesOnline' },
      friendsJoined: { $size: '$friends' },
      nodesUpgraded: { $sum: '$friends.hasUpgrade' },
      nodesPurchased: { $sum: '$friends.nodesOwned' },
    },
  },
];
