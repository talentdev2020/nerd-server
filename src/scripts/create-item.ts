import { providers, Wallet, Contract, utils } from 'ethers';
import env from './script-config';
const abi = require('../common/ABI/erc1155.json') as any[];
import { logger } from '../common';

const { GALA_ADDRESS, MNEMONIC, ETH_NODE_URL } = env;
void (async () => {
  const createConfigs = [
    {
      isNF: true,
      uri:
        'https://gala-tokens.s3-us-west-2.amazonaws.com/sandbox-games/town-star/express-depot/express-depot.json',
    },
  ];
  logger.info('test');

  const provider = new providers.JsonRpcProvider(ETH_NODE_URL);
  const MINTER = Wallet.fromMnemonic(MNEMONIC).connect(provider);
  const mintContract = new Contract(GALA_ADDRESS, abi, MINTER);
  for (const createConfig of createConfigs) {
    const { isNF, uri } = createConfig;
    try {
      const { hash, wait } = await mintContract.create(uri, isNF, {
        gasPrice: utils.parseUnits('23', 'gwei'),
      });
      logger.info(hash);
      await wait(1);
    } catch (error) {
      logger.warn(error);
    }
  }
  logger.info('Done');
})();
