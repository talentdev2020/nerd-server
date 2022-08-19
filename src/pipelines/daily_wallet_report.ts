export default function buildDailyWalletReportPipeline() {
  const today = new Date();
  const oneDayAgo = new Date().setDate(new Date().getDate() - 1);
  return [
    {
      $match: {
        wallet: {
          $exists: true,
        },
      },
    },
    {
      $addFields: {
        'wallet.userCreated': '$created',
      },
    },
    {
      $replaceRoot: {
        newRoot: '$wallet',
      },
    },
    {
      $addFields: {
        oneDayAgo: new Date(oneDayAgo),
        daysSinceWalletCreated: {
          $ifNull: [
            {
              $divide: [
                {
                  $subtract: [today, '$createdAt'],
                },
                86400000,
              ],
            },
            0,
          ],
        },
      },
    },
    {
      $addFields: {
        daysSinceWalletCreated: {
          $ceil: '$daysSinceWalletCreated',
        },
        walletCreatedInLastDay: {
          $cond: [
            {
              $gt: ['$createdAt', '$oneDayAgo'],
            },
            1,
            0,
          ],
        },
        galaTimestamp: {
          $ifNull: ['$activations.gala.timestamp', 0],
        },
        galaUpgraded: {
          $cond: ['$activations.gala.activated', 1, 0],
        },
        galaUpgradedInLastDay: {
          $cond: [
            {
              $gt: ['$activations.gala.timestamp', '$oneDayAgo'],
            },
            1,
            0,
          ],
        },
        galaBtcToReferrer: {
          $ifNull: ['$activations.gala.btcToReferrer', 0],
        },
        galaBtcToCompany: {
          $ifNull: ['$activations.gala.btcToCompany', 0],
        },
        galaBtcToReferrer24: {
          $cond: [
            {
              $gt: ['$activations.gala.timestamp', '$oneDayAgo'],
            },
            '$activations.gala.btcToReferrer',
            0,
          ],
        },
        galaBtcToCompany24: {
          $cond: [
            {
              $gt: ['$activations.gala.timestamp', '$oneDayAgo'],
            },
            '$activations.gala.btcToCompany',
            0,
          ],
        },
        greenTimestamp: {
          $ifNull: ['$activations.green.timestamp', 0],
        },
        greenUpgraded: {
          $cond: ['$activations.green.activated', 1, 0],
        },
        greenUpgradedInLastDay: {
          $cond: [
            {
              $gt: ['$activations.green.timestamp', '$oneDayAgo'],
            },
            1,
            0,
          ],
        },
        greenBtcToReferrer: {
          $ifNull: ['$activations.green.btcToReferrer', 0],
        },
        greenBtcToCompany: {
          $ifNull: ['$activations.green.btcToCompany', 0],
        },
        greenBtcToReferrer24: {
          $cond: [
            {
              $gt: ['$activations.green.timestamp', '$oneDayAgo'],
            },
            '$activations.green.btcToReferrer',
            0,
          ],
        },
        greenBtcToCompany24: {
          $cond: [
            {
              $gt: ['$activations.green.timestamp', '$oneDayAgo'],
            },
            '$activations.green.btcToCompany',
            0,
          ],
        },
        winxTimestamp: {
          $ifNull: ['$activations.winx.timestamp', 0],
        },
        winxUpgraded: {
          $cond: ['$activations.winx.activated', 1, 0],
        },
        winxUpgradedInLastDay: {
          $cond: [
            {
              $gt: ['$activations.winx.timestamp', '$oneDayAgo'],
            },
            1,
            0,
          ],
        },
        winxBtcToReferrer: {
          $ifNull: ['$activations.winx.btcToReferrer', 0],
        },
        winxBtcToCompany: {
          $ifNull: ['$activations.winx.btcToCompany', 0],
        },
        winxBtcToReferrer24: {
          $cond: [
            {
              $gt: ['$activations.winx.timestamp', '$oneDayAgo'],
            },
            '$activations.winx.btcToReferrer',
            0,
          ],
        },
        winxBtcToCompany24: {
          $cond: [
            {
              $gt: ['$activations.winx.timestamp', '$oneDayAgo'],
            },
            '$activations.winx.btcToCompany',
            0,
          ],
        },
      },
    },
    {
      $group: {
        _id: 1,
        galaAccounts24: {
          $sum: '$walletCreatedInLastDay',
        },
        galaUpgraded24: {
          $sum: '$galaUpgradedInLastDay',
        },
        galaBtcToReferrer24: {
          $sum: '$galaBtcToReferrer24',
        },
        galaBtcToCompany24: {
          $sum: '$galaBtcToCompany24',
        },
        galaAccountsTotal: {
          $sum: 1,
        },
        galaUpgradedTotal: {
          $sum: '$galaUpgraded',
        },
        galaBtcToReferrer: {
          $sum: '$galaBtcToReferrer',
        },
        galaBtcToCompany: {
          $sum: '$galaBtcToCompany',
        },
        maxDaysWalletCreated: {
          $max: '$daysSinceWalletCreated',
        },
        greenAccounts24: {
          $sum: '$walletCreatedInLastDay',
        },
        greenUpgraded24: {
          $sum: '$greenUpgradedInLastDay',
        },
        greenBtcToReferrer24: {
          $sum: '$greenBtcToReferrer24',
        },
        greenBtcToCompany24: {
          $sum: '$greenBtcToCompany24',
        },
        greenAccountsTotal: {
          $sum: 1,
        },
        greenUpgradedTotal: {
          $sum: '$greenUpgraded',
        },
        greenBtcToReferrer: {
          $sum: '$greenBtcToReferrer',
        },
        greenBtcToCompany: {
          $sum: '$greenBtcToCompany',
        },
        winxAccounts24: {
          $sum: '$walletCreatedInLastDay',
        },
        winxUpgraded24: {
          $sum: '$winxUpgradedInLastDay',
        },
        winxBtcToReferrer24: {
          $sum: '$winxBtcToReferrer24',
        },
        winxBtcToCompany24: {
          $sum: '$winxBtcToCompany24',
        },
        winxAccountsTotal: {
          $sum: 1,
        },
        winxUpgradedTotal: {
          $sum: '$winxUpgraded',
        },
        winxBtcToReferrer: {
          $sum: '$winxBtcToReferrer',
        },
        winxBtcToCompany: {
          $sum: '$winxBtcToCompany',
        },
      },
    },
    {
      $addFields: {
        galaAccountsAverage: {
          $divide: ['$galaAccountsTotal', '$maxDaysWalletCreated'],
        },
        galaUpgradeAverage: {
          $divide: ['$galaUpgradedTotal', '$maxDaysWalletCreated'],
        },
        galaBtcToReferrerAverage: {
          $divide: ['$galaBtcToReferrer', '$maxDaysWalletCreated'],
        },
        galaBtcToCompanyAverage: {
          $divide: ['$galaBtcToCompany', '$maxDaysWalletCreated'],
        },
        greenAccountsAverage: {
          $divide: ['$greenAccountsTotal', '$maxDaysWalletCreated'],
        },
        greenUpgradeAverage: {
          $divide: ['$greenUpgradedTotal', '$maxDaysWalletCreated'],
        },
        greenBtcToReferrerAverage: {
          $divide: ['$greenBtcToReferrer', '$maxDaysWalletCreated'],
        },
        greenBtcToCompanyAverage: {
          $divide: ['$greenBtcToCompany', '$maxDaysWalletCreated'],
        },
        winxAccountsAverage: {
          $divide: ['$winxAccountsTotal', '$maxDaysWalletCreated'],
        },
        winxUpgradeAverage: {
          $divide: ['$winxUpgradedTotal', '$maxDaysWalletCreated'],
        },
        winxBtcToReferrerAverage: {
          $divide: ['$winxBtcToReferrer', '$maxDaysWalletCreated'],
        },
        winxBtcToCompanyAverage: {
          $divide: ['$winxBtcToCompany', '$maxDaysWalletCreated'],
        },
      },
    },
    {
      $project: {
        gala: {
          accounts24: '$galaAccounts24',
          upgraded24: '$galaUpgraded24',
          btcToReferrer24: '$galaBtcToReferrer24',
          btcToCompany24: '$galaBtcToCompany24',
          accountsTotal: '$galaAccountsTotal',
          upgradedTotal: '$galaUpgradedTotal',
          btcToReferrer: '$galaBtcToReferrer',
          btcToCompany: '$galaBtcToCompany',
          accountsAverage: '$galaAccountsAverage',
          upgradeAverage: '$galaUpgradeAverage',
          btcToReferrerAverage: '$galaBtcToReferrerAverage',
          btcToCompanyAverage: '$galaBtcToCompanyAverage',
        },
        green: {
          accounts24: '$greenAccounts24',
          upgraded24: '$greenUpgraded24',
          btcToReferrer24: '$greenBtcToReferrer24',
          btcToCompany24: '$greenBtcToCompany24',
          accountsTotal: '$greenAccountsTotal',
          upgradedTotal: '$greenUpgradedTotal',
          btcToReferrer: '$greenBtcToReferrer',
          btcToCompany: '$greenBtcToCompany',
          accountsAverage: '$greenAccountsAverage',
          upgradeAverage: '$greenUpgradeAverage',
          btcToReferrerAverage: '$greenBtcToReferrerAverage',
          btcToCompanyAverage: '$greenBtcToCompanyAverage',
        },
        winx: {
          accounts24: '$winxAccounts24',
          upgraded24: '$winxUpgraded24',
          btcToReferrer24: '$winxBtcToReferrer24',
          btcToCompany24: '$winxBtcToCompany24',
          accountsTotal: '$winxAccountsTotal',
          upgradedTotal: '$winxUpgradedTotal',
          btcToReferrer: '$winxBtcToReferrer',
          btcToCompany: '$winxBtcToCompany',
          accountsAverage: '$winxAccountsAverage',
          upgradeAverage: '$winxUpgradeAverage',
          btcToReferrerAverage: '$winxBtcToReferrerAverage',
          btcToCompanyAverage: '$winxBtcToCompanyAverage',
        },
      },
    },
  ];
}
