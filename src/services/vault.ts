// import { utils, BigNumber } from 'ethers';
// import * as erc1155Abi from '../common/ABI/erc1155.json';
// import { IWalletTransaction, TransactionType } from '../types';
// import { WalletTransaction, User } from '../models';
// import {
//   ethBalanceTransactionsPipeline,
//   IEthBalanceTransactions,
// } from '../pipelines';

// class VaultService {
//   erc1155Interface = new utils.Interface(erc1155Abi);
//   storeDecimalsFungible = 8;
//   TYPE_NF_BIT = BigInt(1) << BigInt(255);
//   NF_INDEX_MASK = BigInt(~0) << BigInt(128);

//   private isNonFungible = (tokenId: string) => {
//     return (BigInt(tokenId) & this.TYPE_NF_BIT) === this.TYPE_NF_BIT;
//   };

//   private getBaseType = (tokenId: string) => {
//     if (this.isNonFungible(tokenId)) {
//       const token = BigInt(tokenId);
//       return '0x' + (token & this.NF_INDEX_MASK).toString(16);
//     }
//     return tokenId;
//   };

//   private parseAmount = (
//     tokenId: string,
//     value: BigNumber,
//     decimals: number,
//   ) => {
//     const sliceEnd = this.storeDecimalsFungible - decimals;
//     const amountString = value.toString();
//     const fullHexAmount = value.toHexString();
//     const isNonFungible = this.isNonFungible(tokenId);
//     const amount =
//       !isNonFungible && sliceEnd < 0
//         ? amountString.slice(0, sliceEnd)
//         : amountString;
//     return {
//       amount,
//       fullHexAmount,
//       decimalsStored: isNonFungible ? 0 : this.storeDecimalsFungible,
//     };
//   };

//   private getIndexerId(
//     txHash: string,
//     type: TransactionType,
//     logIndex?: number,
//   ) {
//     const logIndexString = logIndex >= 0 ? logIndex.toString() : '';

//     return utils.sha256(utils.toUtf8Bytes(`${txHash}${type}${logIndexString}`));
//   }

//   parseTokenId = (tokenId: string) => {
//     return {
//       tokenId,
//       baseId: this.getBaseType(tokenId),
//       nft: this.isNonFungible(tokenId),
//     };
//   };

//   getUserIdByEthAddress = async (ethAddress: string) => {
//     const user = await User.findOne({ 'wallet.ethAddress': ethAddress });

//     return user?.id || null;
//   };

//   parseData = async (data: string, toUserId?: string) => {
//     const { name, args } = this.erc1155Interface.parseTransaction({
//       data,
//       value: '0x0',
//     });
//     if (name === 'safeTransferFrom') {
//       const [from, to, id, value] = args as [
//         string,
//         string,
//         BigNumber,
//         BigNumber,
//       ];
//       return {
//         from,
//         to,
//         operator: from,
//         fullHexAmount: value.toHexString(),
//         logIndex: 0,
//         contractMethod: name,
//         mintTransaction: false,
//         ...this.parseAmount(id.toHexString(), value, 8),
//         ...this.parseTokenId(id.toHexString()),
//       };
//     }
//   };

//   saveToDatabase(tx: IWalletTransaction) {
//     return WalletTransaction.create(tx);
//   }

//   getEthBalanceAndTransactions = async (ethAddress: string) => {
//     const [result] = (await WalletTransaction.aggregate(
//       ethBalanceTransactionsPipeline(ethAddress),
//     ));

//     return result
//       ? result
//       : ({
//           transactions: [],
//           pendingBalance: '0.0',
//           confirmedBalance: '0.0',
//         } as IEthBalanceTransactions);
//   };

//   public queueTransactions = async () => {
//     const nodePromise = eligibleNodes.initializeNodes();

//     const startDay = subDays(new Date(), config.startDateDaysAgo);
//     const start = startOfDay(startDay);
//     const end = endOfYesterday();

//     const pipeline = getPipeline(start, end);

//     const cursor = DistributionResult.aggregate<GetDistributionResults>(
//       pipeline,
//     )
//       .cursor({})
//       .exec();

//     await nodePromise;

//     return cursor.eachAsync(
//       async ({ token, users }: GetDistributionResults) => {
//         const activeUsers = flatten(
//           await Promise.all(
//             users.map(async (user) => {
//               const isActive = eligibleNodes.getIsUserActive(user.userId);

//               if (
//                 isActive ||
//                 token === 'gala' ||
//                 user.userId === config.masterNode.userId
//               ) {
//                 return user;
//               }

//               const newUsers = Array(+user.quantity)
//                 .fill('')
//                 .map(() => {
//                   const newNode = eligibleNodes.getNextNode();

//                   return {
//                     userId: newNode.userId,
//                     address: newNode.walletAddress,
//                     quantity: 1,
//                   };
//                 });

//               await auditor.auditReassignItems(token, user);

//               return newUsers;
//             }),
//           ),
//         );

//         const reducedUsers: Array<{
//           address: string;
//           userId: string;
//           quantity: string;
//         }> = activeUsers.reduce((aggr, curr) => {
//           const existing = aggr.findIndex((u) => u.userId === curr.userId);

//           if (existing < 0) {
//             return [...aggr, curr];
//           }

//           const { address, userId, quantity } = aggr[existing];

//           const existingBN = ethers.utils.bigNumberify(quantity.toString());

//           // eslint-disable-next-line no-param-reassign
//           aggr[existing] = {
//             address,
//             userId,
//             quantity: existingBN.add(curr.quantity.toString()).toString(),
//           };

//           return aggr;
//         }, []);

//         await auditor.auditItemMinting(token, reducedUsers);
//         const chunkedUsers = chunk(reducedUsers, 15);

//         await Promise.all(
//           chunkedUsers.map((sendTo) =>
//             this.enqueue({
//               sendTo,
//               token,
//             }),
//           ),
//         );
//       },
//     );
//   };


// }

// export const vaultService = new VaultService();
