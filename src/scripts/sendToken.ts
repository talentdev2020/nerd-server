// require('dotenv').config();
// import config from '../common/config';
// import { ethers } from 'ethers';
// import { ICoinMetadata } from '../types';
// import { BigNumber } from 'bignumber.js';
// import credentials from '../../credentials';
// import autoBind = require('auto-bind');
// import * as erc20Abi from '../common/ABI/erc20.json';

// interface IAccountKeys {
//   contractAddress: string;
//   owner: string;
//   pkey: string;
//   decimals: number;
// }

// interface ISendStuff {
//   toAddress: string;
//   value: string | number;
//   nonce: number;
// }

// class TokenMinter {
//   private contract: ethers.Contract;
//   private decimals: number;
//   constructor({ contractAddress, pkey, decimals }: IAccountKeys) {
//     this.decimals = decimals;
//     const provider = new ethers.providers.JsonRpcProvider(config.ethNodeUrl);
//     const signer = new ethers.Wallet(pkey, provider);
//     this.contract = new ethers.Contract(contractAddress, erc20Abi, signer);
//     autoBind(this);
//   }

//   private integerize(decimalizedString: string) {
//     return ethers.utils.parseUnits(decimalizedString, this.decimals);
//   }

//   public sendTokens(addresses: string[], values: string[]) {
//     const amounts = values.map(this.integerize);
//     return this.contract.distributeMinting(addresses, amounts);
//   }
// }

// function getRandomValue(numConfig: { min: number; max: number }) {
//   const { min, max } = numConfig;
//   return Math.random() * (+max - +min) + +min;
// }

// (async () => {
//   const { green: greenCredentials, arcade: arcadeCredentials } = credentials;
//   console.log(greenCredentials, arcadeCredentials);

//   // Send specific amounts
//   const specificAmounts: string[] = [];
//   const distConfig = {
//     min: 10,
//     max: 1000,
//     volume: 50,
//   };
//   // OR: get a bunch of random amounts based on the config above.
//   const randomAmounts: string[] = new Array(distConfig.volume)
//     .fill(0)
//     .map(() => getRandomValue(distConfig).toFixed(4));
//   // If specific amounts is empty use the randomAmounts array.
//   const amounts = specificAmounts.length ? specificAmounts : randomAmounts;

//   // Send transactions to a list of specific addresses.
//   const toAddresses: string[] = [];
//   // OR: Send all transactions to one address;
//   const toAddress = '0x59107980862b0C1826997D47617112eC35270C1F';

//   // If specific addresses aren't specify, repeat the single address to match the length of amounts.
//   const addresses = toAddresses.length
//     ? toAddresses
//     : new Array(amounts.length).fill(toAddress);
//   if (addresses.length !== amounts.length)
//     throw new Error('Address and amounts array length must match');

//   const arcadeSender = new TokenMinter(arcadeCredentials);
//   const greenSender = new TokenMinter(greenCredentials);

//   try {
//     const [greenResults, arcadeResults] = await Promise.all([
//       greenSender.sendTokens(addresses, amounts),
//       arcadeSender.sendTokens(addresses, amounts),
//     ]);
//     console.log(greenResults, arcadeResults);
//   } catch (error) {
//     console.log(error.stack);
//   }
// })();
