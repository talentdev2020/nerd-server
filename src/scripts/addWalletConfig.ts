import connections from './connections';
import { walletConfigSchema, IWalletConfig } from '../models/wallet-config';
import { logger } from '../common';

void (async () => {
  const arcade = {
    prod: {
      backgroundColor: '#B38DF7',
      backgroundColorNew: '#671BCC',
      icon: 'arcade-share.png',
      accentColor: '#e8d1ff',
      textColor: '#6600CC',
      brand: 'arcade',
      referrerReward: 5,
      companyFee: 5,
      rewardCurrency: 'ARCADE',
      rewardAmount: 100,
      userBalanceThreshold: 20,
      shareLimit: 5,
      shareLinkBase: 'N/A',
      upgradeAccountName: 'Arcade+',
      upgradeBenefits: [
        'Basic Wallet',
        'Limited virtual game item',
        '$100 credit toward Arcade Soft Node',
        'Advanced sharing tools',
        '5 early access beta wallets to share',
        'Digital rewards for wallet shares',
      ],
      basicWalletBenefits: [
        'Send and receive BTC',
        'Send and receive ETH',
        'Hold early access game items*',
        'Advanced play access to Arcade games (coming soon)',
      ],
      coupon: {
        photo: 'instant-credit-arcade-soft-node.jpg',
        softnodeType: 'Arcade',
      },
    },
    local: {
      backgroundColor: '#B38DF7',
      backgroundColorNew: '#671BCC',
      icon: 'arcade-share.png',
      accentColor: '#e8d1ff',
      textColor: '#6600CC',
      brand: 'localhost',
      referrerReward: 5,
      companyFee: 5,
      rewardCurrency: 'ARCADE',
      rewardAmount: 100,
      userBalanceThreshold: 20,
      shareLimit: 5,
      shareLinkBase: 'N/A',
      upgradeAccountName: 'Arcade+',
      upgradeBenefits: [
        'Basic Wallet',
        'Limited virtual game item',
        '$100 credit toward Arcade Soft Node',
        'Advanced sharing tools',
        '5 early access beta wallets to share',
        'Digital rewards for wallet shares',
      ],
      basicWalletBenefits: [
        'Send and receive BTC',
        'Send and receive ETH',
        'Hold early access game items*',
        'Advanced play access to Arcade games (coming soon)',
      ],
      coupon: {
        photo: 'instant-credit-arcade-soft-node.jpg',
        softnodeType: 'Arcade',
      },
    },
  };

  const green = {
    prod: {
      backgroundColor: '#92D36E',
      backgroundColorNew: '#4A837A',
      icon: 'green-share.png',
      accentColor: '#e0f7e0',
      textColor: '#33cc33',
      brand: 'green',
      referrerReward: 5,
      companyFee: 5,
      rewardCurrency: 'GREEN',
      rewardAmount: 100,
      userBalanceThreshold: 20,
      shareLimit: 5,
      shareLinkBase: 'N/A',
      upgradeAccountName: 'Green+',
      upgradeBenefits: [
        'Basic Wallet',
        '$100 credit toward Green Soft Node',
        'Advanced sharing tools',
        '5 early access beta wallets to share',
        'Digital rewards for wallet shares',
      ],
      basicWalletBenefits: [
        'Send and receive BTC',
        'Send and receive ETH',
        'Send and receive GREEN',
      ],
      coupon: {
        photo: 'instant-credit-green-soft-node.jpg',
        softnodeType: 'Green',
      },
    },
    local: {
      backgroundColor: '#92D36E',
      backgroundColorNew: '#4A837A',
      icon: 'green-share.png',
      accentColor: '#e0f7e0',
      textColor: '#33cc33',
      brand: 'localhost',
      referrerReward: 5,
      companyFee: 5,
      rewardCurrency: 'GREEN',
      rewardAmount: 100,
      userBalanceThreshold: 20,
      shareLimit: 5,
      shareLinkBase: 'N/A',
      upgradeAccountName: 'Green+',
      upgradeBenefits: [
        'Basic Wallet',
        '$100 credit toward Green Soft Node',
        'Advanced sharing tools',
        '5 early access beta wallets to share',
        'Digital rewards for wallet shares',
      ],
      basicWalletBenefits: [
        'Send and receive BTC',
        'Send and receive ETH',
        'Send and receive GREEN',
      ],
      coupon: {
        photo: 'instant-credit-green-soft-node.jpg',
        softnodeType: 'Green',
      },
    },
  };

  const codex = {
    prod: {
      backgroundColor: '#75A9F9',
      backgroundColorNew: '#369AFF',
      icon: 'winx-share.png',
      accentColor: '#d9e8ff',
      textColor: '#0099ff',
      brand: 'codex',
      referrerReward: 5,
      companyFee: 5,
      rewardCurrency: 'WinX',
      rewardAmount: 100,
      userBalanceThreshold: 20,
      shareLimit: 5,
      shareLinkBase: 'N/A',
      upgradeAccountName: 'Codex+',
      upgradeBenefits: [
        'Basic Wallet',
        '$100 credit toward Codex Soft Node',
        'Advanced sharing tools',
        '5 early access beta wallets to share',
        'Digital rewards for wallet shares',
      ],
      basicWalletBenefits: ['Send and receive BTC', 'Send and receive ETH'],
      coupon: {
        photo: 'instant-credit-codex-soft-node.jpg',
        softnodeType: 'Codex',
      },
    },
    local: {
      backgroundColor: '#75A9F9',
      backgroundColorNew: '#369AFF',
      icon: 'winx-share.png',
      accentColor: '#d9e8ff',
      textColor: '#0099ff',
      brand: 'localhost',
      referrerReward: 5,
      companyFee: 5,
      rewardCurrency: 'WinX',
      rewardAmount: 100,
      userBalanceThreshold: 20,
      shareLimit: 5,
      shareLinkBase: 'N/A',
      upgradeAccountName: 'Codex+',
      upgradeBenefits: [
        'Basic Wallet',
        '$100 credit toward Codex Soft Node',
        'Advanced sharing tools',
        '5 early access beta wallets to share',
        'Digital rewards for wallet shares',
      ],
      basicWalletBenefits: ['Send and receive BTC', 'Send and receive ETH'],
      coupon: {
        photo: 'instant-credit-codex-soft-node.jpg',
        softnodeType: 'Codex',
      },
    },
  };

  const connect = {
    prod: {
      backgroundColor: '#75A9F9',
      backgroundColorNew: '#369AFF',
      icon: 'winx-share.png',
      accentColor: '#d9e8ff',
      textColor: '#0099ff',
      brand: 'connect',
      referrerReward: 5,
      companyFee: 5,
      rewardCurrency: 'WinX',
      rewardAmount: 100,
      userBalanceThreshold: 20,
      shareLimit: 5,
      shareLinkBase: 'N/A',
      upgradeAccountName: 'Connect+',
      upgradeBenefits: [
        'Basic Wallet',
        'Advanced sharing tools',
        '5 early access beta wallets to share',
        'Digital rewards for wallet shares',
      ],
      basicWalletBenefits: [
        'Send and receive BTC',
        'Send and receive ETH',
        'Send and receive GREEN',
      ],
      coupon: {
        photo: 'instant-credit-codex-soft-node.jpg',
        softnodeType: 'Codex',
      },
    },
    local: {
      backgroundColor: '#75A9F9',
      backgroundColorNew: '#369AFF',
      icon: 'winx-share.png',
      accentColor: '#d9e8ff',
      textColor: '#0099ff',
      brand: 'localhost',
      referrerReward: 5,
      companyFee: 5,
      rewardCurrency: 'WinX',
      rewardAmount: 100,
      userBalanceThreshold: 20,
      shareLimit: 5,
      shareLinkBase: 'N/A',
      upgradeAccountName: 'Connect+',
      upgradeBenefits: [
        'Basic Wallet',
        'Advanced sharing tools',
        '5 early access beta wallets to share',
        'Digital rewards for wallet shares',
      ],
      basicWalletBenefits: [
        'Send and receive BTC',
        'Send and receive ETH',
        'Send and receive GREEN',
      ],
      coupon: {
        photo: 'instant-credit-codex-soft-node.jpg',
        softnodeType: 'Codex',
      },
    },
  };
  const brand = 'connect';
  const basicWalletBenefits = [
    'Send and receive BTC',
    'Send and receive ETH',
    'Send and receive GREEN',
    'Hold early access game items*',
    'Advanced play access to Arcade games (coming soon)',
  ];
  const arcadeConfig = [arcade.prod, arcade.local];
  const greenConfig = [green.prod, green.local];
  const codexConfig = [codex.prod, codex.local];

  const connectConfig = [
    { ...connect.prod, basicWalletBenefits },
    { ...connect.local, basicWalletBenefits },
    { ...arcade.prod, brand, basicWalletBenefits },
    { ...arcade.local, basicWalletBenefits },
    { ...green.prod, brand, basicWalletBenefits },
    { ...green.local, basicWalletBenefits },
  ];

  const allConnections = await connections.allConnections.connect();

  const [
    arcadeStageModel,
    arcadeProdModel,
    codexStageModel,
    codexProdModel,
    connectStageModel,
    connectProdModel,
    greenStageModel,
    greenProdModel,
  ] = allConnections.map(connection => {
    return connection.model<IWalletConfig>('wallet-config', walletConfigSchema);
  });

  [connectStageModel, connectProdModel].map(async cnx => {
    await cnx.deleteMany({});
    await cnx.insertMany(connectConfig);
    logger.info('Connect Done');
  });

  [greenStageModel, greenProdModel].map(async cnx => {
    await cnx.deleteMany({});
    await cnx.insertMany(greenConfig);
    logger.info('Green Done');
  });

  [codexStageModel, codexProdModel].map(async cnx => {
    await cnx.deleteMany({});
    await cnx.insertMany(codexConfig);
    logger.info('Codex Done');
  });

  [arcadeStageModel, arcadeProdModel].map(async cnx => {
    await cnx.deleteMany({});
    await cnx.insertMany(arcadeConfig);
    logger.info('Arcade Done');
  });
})();
