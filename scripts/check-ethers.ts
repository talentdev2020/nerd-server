import { ethers } from 'ethers';
const provider = new ethers.providers.JsonRpcProvider(
  'https://dev.eth.setpowerfree.com',
);

provider
  .getBlockNumber()
  .then(blockNumber => console.log(blockNumber))
  .catch(err => console.log(`getBlockNumber Error: ${err}`));
provider
  .getBalance('address')
  .then(balance => console.log(balance))
  .catch(err => console.log(`getBalance Error: ${err}`));
