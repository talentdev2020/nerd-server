import { subHours } from 'date-fns';
import { configAws } from '../common';

export const getPipeline = (userId: string, nudgeCode: string) => [
  {
    $match: {
      id: userId,
    },
  },
  {
    $project: {
      _id: 0,
      affiliateId: 1,
      firstName: 1,
    },
  },
  {
    $lookup: {
      from: 'users',
      localField: 'affiliateId',
      foreignField: 'referredBy',
      as: 'friends',
    },
  },
  {
    $project: {
      referrer: '$firstName',
      'friends.email': 1,
      'friends.firstName': 1,
      'friends.id': 1,
      'friends.wallet.shareLink': 1,
      'friends.unsubscriptions': 1,
      'friends.communicationConsent': 1,
    },
  },
  {
    $unwind: {
      path: '$friends',
    },
  },
  {
    $replaceRoot: {
      newRoot: {
        $mergeObjects: [
          '$friends',
          {
            referrer: '$referrer',
          },
        ],
      },
    },
  },
  {
    $addFields: {
      referralLink: '$wallet.shareLink',
      communicationConsent: {
        // @ts-ignore
        $ifNull: ['$communicationConsent', []],
      },
      wallet: '$$REMOVE',
    },
  },
  {
    $match: {
      'unsubscriptions.list': {
        $ne: 'friend-nudge',
      },
    },
  },
  {
    $lookup: {
      from: 'friend-nudges',
      let: {
        friendId: '$id',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$friend', '$$friendId'],
            },
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
    $match: {
      $expr: {
        $eq: [{ $size: '$nudges' }, 0],
      },
    },
  },
  {
    $lookup: {
      from: 'game-activities',
      localField: 'id',
      foreignField: 'userId',
      as: 'gameActivities',
    },
  },
  {
    $match: {
      $expr: {
        $eq: [{ $size: '$gameActivities' }, 0],
      },
    },
  },
  {
    $project: {
      email: 1,
      firstName: 1,
      userId: '$id',
      referrer: 1,
      referralLink: 1,
      communicationConsent: 1,
      emailVerified: 1,
    },
  },
];
