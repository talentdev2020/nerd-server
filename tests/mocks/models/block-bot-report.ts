import { Types } from 'mongoose';

export const blockbotReport1 = {
  _id: new Types.ObjectId('61099d7b57c5bc14980867b3'),
  userId: '60fd24fce7d789ae04cee939',
  DatePrepared: 1629137933511,
  TotalBlockbots: 3,
  Day: {
    _id: new Types.ObjectId('61099d7b57c5bc14980867b4'),
    TotalBlockbotsNow: 3,
    TotalBlockbotsPrevious: 3,
    TotalRewardsCoin: 338,
    TotalRewardsUsd: 3.38,
    AverageUsdPerBlockbot: 0.01,
    AveragePercentDifference: 0.02,
    Memory: 'Day',
    FriendActivations: [
      {
        _id: new Types.ObjectId('615364b0ce3de5150c2ab443'),
        Name: 'Blockbot',
        ActiveCount: 0,
        ActivationsCount: 0,
        Rewards: 0,
        RewardsAllTime: 350,
      },
      {
        _id: new Types.ObjectId('615364b0ce3de5150c2ab444'),
        Name: 'Droid',
        ActiveCount: 2,
        ActivationsCount: 1,
        Rewards: 18,
        RewardsAllTime: 400,
      },
    ],
    BlockchainActivations: [
      {
        _id: new Types.ObjectId('615364b0ce3de5150c2ab445'),
        Name: 'Blockbot',
        ActiveCount: 0,
        ActivationsCount: 0,
        Rewards: 0,
        RewardsAllTime: 12,
      },
      {
        _id: new Types.ObjectId('615364b0ce3de5150c2ab446'),
        Name: 'Droid',
        ActiveCount: 2,
        ActivationsCount: 1,
        Rewards: 18,
        RewardsAllTime: 22,
      },
    ],
  },
  Week: {
    _id: new Types.ObjectId('61099d7b57c5bc14980867b5'),
    TotalBlockbotsNow: 3,
    TotalBlockbotsPrevious: 2,
    TotalRewardsCoin: 1588,
    TotalRewardsUsd: 15.38,
    AverageUsdPerBlockbot: 0.01,
    AveragePercentDifference: 0.018,
    Memory: 'Week',
    FriendActivations: [
      {
        _id: new Types.ObjectId('615365b0a6f2264f421fee54'),
        Name: 'Blockbot',
        ActiveCount: 1,
        ActivationsCount: 1,
        Rewards: 80,
        RewardsAllTime: 250,
      },
      {
        _id: new Types.ObjectId('615365b0a6f2264f421fee55'),
        Name: 'Droid',
        ActiveCount: 2,
        ActivationsCount: 1,
        Rewards: 18,
        RewardsAllTime: 400,
      },
    ],
    BlockchainActivations: [
      {
        _id: new Types.ObjectId('615365b0a6f2264f421fee56'),
        Name: 'Blockbot',
        ActiveCount: 0,
        ActivationsCount: 0,
        Rewards: 0,
        RewardsAllTime: 12,
      },
      {
        _id: new Types.ObjectId('615365b0a6f2264f421fee57'),
        Name: 'Droid',
        ActiveCount: 2,
        ActivationsCount: 1,
        Rewards: 18,
        RewardsAllTime: 22,
      },
    ],
  },
  Month: {
    _id: new Types.ObjectId('61099d7b57c5bc14980867b6'),
    TotalBlockbotsNow: 3,
    TotalBlockbotsPrevious: 3,
    TotalRewardsCoin: 338,
    TotalRewardsUsd: 3.38,
    AverageUsdPerBlockbot: 0.01,
    AveragePercentDifference: 0.02,
    Memory: 'Month',
    FriendActivations: [
      {
        _id: new Types.ObjectId('615365b0a6f2264f421fee59'),
        Name: 'Blockbot',
        ActiveCount: 2,
        ActivationsCount: 10,
        Rewards: 120,
        RewardsAllTime: 350,
      },
      {
        _id: new Types.ObjectId('615365b0a6f2264f421fee5a'),
        Name: 'Droid',
        ActiveCount: 2,
        ActivationsCount: 10,
        Rewards: 350,
        RewardsAllTime: 400,
      },
    ],
    BlockchainActivations: [
      {
        _id: new Types.ObjectId('615365b0a6f2264f421fee5b'),
        Name: 'Blockbot',
        ActiveCount: 0,
        ActivationsCount: 0,
        Rewards: 0,
        RewardsAllTime: 12,
      },
      {
        _id: new Types.ObjectId('615365b0a6f2264f421fee5c'),
        Name: 'Droid',
        ActiveCount: 150,
        ActivationsCount: 120,
        Rewards: 18,
        RewardsAllTime: 22,
      },
    ],
  },
  Year: {
    _id: new Types.ObjectId('61099d7b57c5bc14980867b7'),
    TotalBlockbotsNow: 3,
    TotalBlockbotsPrevious: 3,
    TotalRewardsCoin: 338,
    TotalRewardsUsd: 3.38,
    AverageUsdPerBlockbot: 0.01,
    AveragePercentDifference: 0.02,
    Memory: 'Year',
    FriendActivations: [
      {
        _id: new Types.ObjectId('615365b0a6f2264f421fee5c'),
        Name: 'Blockbot',
        ActiveCount: 3,
        ActivationsCount: 30,
        Rewards: 350,
        RewardsAllTime: 350,
      },
      {
        _id: new Types.ObjectId('615365b0a6f2264f421fee5c'),
        Name: 'Droid',
        ActiveCount: 5,
        ActivationsCount: 5,
        Rewards: 400,
        RewardsAllTime: 400,
      },
    ],
    BlockchainActivations: [
      {
        _id: new Types.ObjectId('615365b0a6f2264f421fee5c'),
        Name: 'Blockbot',
        ActiveCount: 50,
        ActivationsCount: 50,
        Rewards: 12,
        RewardsAllTime: 12,
      },
      {
        _id: new Types.ObjectId('615365b0a6f2264f421fee5c'),
        Name: 'Droid',
        ActiveCount: 250,
        ActivationsCount: 250,
        Rewards: 22,
        RewardsAllTime: 22,
      },
    ],
  },
  Quarter: {
    _id: new Types.ObjectId('61099d7b57c5bc14980867b8'),
    TotalBlockbotsNow: 3,
    TotalBlockbotsPrevious: 3,
    TotalRewardsCoin: 338,
    TotalRewardsUsd: 3.38,
    AverageUsdPerBlockbot: 0.01,
    AveragePercentDifference: 0.02,
    Memory: 'Quarter',
    FriendActivations: [
      {
        _id: new Types.ObjectId('615365b0a6f2264f421fee63'),
        Name: 'Blockbot',
        ActiveCount: 3,
        ActivationsCount: 30,
        Rewards: 350,
        RewardsAllTime: 350,
      },
      {
        _id: new Types.ObjectId('615365b0a6f2264f421fee64'),
        Name: 'Droid',
        ActiveCount: 5,
        ActivationsCount: 5,
        Rewards: 400,
        RewardsAllTime: 400,
      },
    ],
    BlockchainActivations: [
      {
        _id: new Types.ObjectId('615365b0a6f2264f421fee65'),
        Name: 'Blockbot',
        ActiveCount: 50,
        ActivationsCount: 50,
        Rewards: 12,
        RewardsAllTime: 12,
      },
      {
        _id: new Types.ObjectId('615365b0a6f2264f421fee66'),
        Name: 'Droid',
        ActiveCount: 250,
        ActivationsCount: 250,
        Rewards: 22,
        RewardsAllTime: 22,
      },
    ],
  },
  All: {
    _id: new Types.ObjectId('61099d7b57c5bc14980867b9'),
    TotalBlockbotsNow: 3,
    TotalBlockbotsPrevious: 3,
    TotalRewardsCoin: 338,
    TotalRewardsUsd: 3.38,
    AverageUsdPerBlockbot: 0.01,
    AveragePercentDifference: 0.02,
    Memory: 'All',
    FriendActivations: [
      {
        _id: new Types.ObjectId('615365b0a6f2264f421fee68'),
        Name: 'Blockbot',
        ActiveCount: 3,
        ActivationsCount: 30,
        Rewards: 350,
        RewardsAllTime: 350,
      },
      {
        _id: new Types.ObjectId('615365b0a6f2264f421fee69'),
        Name: 'Droid',
        ActiveCount: 5,
        ActivationsCount: 5,
        Rewards: 400,
        RewardsAllTime: 400,
      },
    ],
    BlockchainActivations: [
      {
        _id: new Types.ObjectId('615365b0a6f2264f421fee6a'),
        Name: 'Blockbot',
        ActiveCount: 50,
        ActivationsCount: 50,
        Rewards: 12,
        RewardsAllTime: 12,
      },
      {
        _id: new Types.ObjectId('615365b0a6f2264f421fee6b'),
        Name: 'Droid',
        ActiveCount: 250,
        ActivationsCount: 250,
        Rewards: 22,
        RewardsAllTime: 22,
      },
    ],
  },
};

const otherblockbotReport = Object.assign({}, blockbotReport1);
otherblockbotReport.userId = '100000000000000000000000'; 
otherblockbotReport._id =  new Types.ObjectId('61099d7b57c5bc14980867b4'); 
export const blockbotReport2 = otherblockbotReport;