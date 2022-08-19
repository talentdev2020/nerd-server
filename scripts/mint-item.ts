import { ethers } from 'ethers';
const abi = require('../src/common/ABI/erc1155.json');

const SEND_TO = '';
const NFT_BASE_ID = '';
const CONTRACT_ADDRESS = '';
const CONTRACT_OWNER_PRIVATE_KEY = '';
const ETHEREUM_NODE_URL = '';

(async () => {
  const provider = new ethers.providers.JsonRpcProvider(ETHEREUM_NODE_URL);
  const signer = new ethers.Wallet(CONTRACT_OWNER_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi as any, signer);

  const transaction = await contract.mintNonFungible(NFT_BASE_ID, [SEND_TO], {
    gasLimit: 175000,
  });

  console.log(transaction);
})();
