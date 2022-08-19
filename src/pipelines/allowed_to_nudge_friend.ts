import { subHours } from 'date-fns';
import { config, configAws } from '../common';

export const getPipeline = (
  userId: string,
  friend: string,
  nudgeCode: string,
) => [
  {
    $match: {
      id: userId,
    },
  },
  {
    $project: {
      _id: 0,
      id: 1,
      affiliateId: 1,
    },
  },
  {
    $lookup: {
      from: 'users',
      pipeline: [
        {
          $match: {
            id: friend,
          },
        },
        {
          $addFields: {
            unsubscriptions: {
              // @ts-ignore-next-line
              $ifNull: ['$unsubscriptions', []],
            },
            communicationConsent: {
              // @ts-ignore-next-line
              $ifNull: ['$communicationConsent', []],
            },
          },
        },
        {
          $project: {
            _id: 0,
            id: 1,
            referredBy: 1,
            email: 1,
            emailVerified: 1,
            firstName: 1,
            referralLink: '$wallet.shareLink',
            communicationConsent: 1,
            unsubscribed: {
              $in: ['friend-nudge', '$unsubscriptions.list'],
            },
          },
        },
      ],
      as: 'friend',
    },
  },
  {
    $addFields: {
      friend: {
        $arrayElemAt: ['$friend', 0],
      },
    },
  },
  {
    $addFields: {
      isFriend: {
        $eq: ['$affiliateId', '$friend.referredBy'],
      },
    },
  },
  {
    $lookup: {
      from: 'friend-nudges',
      pipeline: [
        {
          $match: {
            code: nudgeCode,
            userId,
            friend,
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
      allowedToNudge: {
        $and: [
          { $eq: ['$nudges', [] as []] },
          { $eq: ['$friend.unsubscribed', false] },
        ],
      },
    },
  },
  {
    $project: {
      isFriend: 1,
      allowedToNudge: 1,
      email: '$friend.email',
      firstName: '$friend.firstName',
      referralLink: '$friend.referralLink',
      communicationConsent: '$friend.communicationConsent',
      emailVerified: '$friend.emailVerified',
    },
  },
];
