import { subHours } from 'date-fns';
import { config, configAws } from '../common';

export const getPipeline = (userId: string, nudgeCode = configAws.nudgeCode) => [
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
      let: {
        affiliateId: '$affiliateId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$referredBy', '$$affiliateId'],
            },
          },
        },
        {
          $addFields: {
            unsubscriptions: {
              // @ts-ignore-next-line
              $ifNull: ['$unsubscriptions', []],
            },
          },
        },
        {
          $project: {
            _id: 0,
            id: { $toString: '$_id' },
            displayName: 1,
            profilePic: '$profilePhotoUrl',
            email: 1,
            unsubscribed: {
              $in: ['friend-nudge', '$unsubscriptions.list'],
            },
          },
        },
      ],
      as: 'friends',
    },
  },
  {
    $unwind: {
      path: '$friends',
    },
  },
  {
    $replaceRoot: {
      newRoot: '$friends',
    },
  },
  {
    $lookup: {
      from: 'game-activities',
      localField: 'id',
      foreignField: 'userId',
      as: 'gameActivity',
    },
  },
  {
    $addFields: {
      active: {
        $gt: ['$gameActivity', [] as []],
      },
      gameActivity: '$$REMOVE',
    },
  },
  {
    $lookup: {
      from: 'friend-nudges',
      let: { userId: '$id' },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$friend', '$$userId'],
            },
            userId,
            code: nudgeCode,
            created: {
              $gte: subHours(new Date(), configAws.nudgeTimeoutHours),
            },
          },
        },
      ],
      as: 'nudges',
    },
  },
  {
    $addFields: {
      canNudge: {
        $and: [
          { $eq: ['$nudges', [] as []] },
          { $eq: ['$unsubscribed', false] },
        ],
      },
    },
  },
  {
    $project: {
      id: 1,
      displayName: 1,
      profilePic: 1,
      email: 1,
      active: 1,
      canNudge: 1,
    },
  },
];
