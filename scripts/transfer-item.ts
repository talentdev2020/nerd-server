import { ethers } from 'ethers';
const abi = require('../src/common/ABI/erc1155.json');

const SEND_FROM = '';
const SEND_TO = '';
const ITEM_ID = '';
const CONTRACT_ADDRESS = '';
const PRIVATE_KEY = '';
const ETHEREUM_NODE_URL = '';

(async () => {
  const provider = new ethers.providers.JsonRpcProvider(ETHEREUM_NODE_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi as any, signer);

  const transaction = await contract.safeTransferFrom(
    SEND_FROM,
    SEND_TO,
    ITEM_ID,
    '0x0',
    '0x0',
    {
      gasLimit: 150000,
    },
  );

  console.log(transaction);
})();
