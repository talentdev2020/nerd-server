import { config } from 'src/common';
import Minter from './minter';
import GenericMinter from './generic';
import { GreenMinter } from './green';
import { ConnectMinter } from './connect';

const genericMinter = new GenericMinter();

class MinterFactory {
  createTokenMinter(userId: string): Minter {
    if (config.brand === 'green' || config.brand === 'liberty') {
      return new GreenMinter(userId);
    } else if (config.brand === 'connect') {
      return new ConnectMinter(userId);
    } else {
      return genericMinter;
    }
  }
}

const minterFactory = new MinterFactory();
export default minterFactory;
