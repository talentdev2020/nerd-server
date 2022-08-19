import btcListener from './btc';

export const removeListeners = async (walletId: string) => {
  await Promise.all([btcListener.removeListeners(walletId)]);
};

export default {
  BTC: btcListener,
};
