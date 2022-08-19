import { VaultRewardsEth, VaultWithdrawalEth, VaultWithdrawalEthStatus, STUCK_STATUS_VAULT_WITHDRAWAL_ETH } from 'src/models';
import { IVaultItemRequest, IBalanceAndStuckItemsEth } from 'src/types';

class ConnectRewardsService {  
  async getBalanceAndStuckItems(userId: string): Promise<IBalanceAndStuckItemsEth>  {
    const rewards = await this.getRewards(userId);
    const claimed = await this.getWithdrawed(userId);

    const balanceSummary:IBalanceAndStuckItemsEth = {
      balance:0,
      stuckBalance:0,
      stuckItemsIds:[] ,    
    }

    for (const reward of rewards) {
      balanceSummary.balance += Number(reward.amount);
    }

    for (const claimedItem of claimed) {
      balanceSummary.balance -= Number(claimedItem.total);
      if (claimedItem.status === STUCK_STATUS_VAULT_WITHDRAWAL_ETH){
        balanceSummary.stuckBalance += Number(claimedItem.total);
        balanceSummary.stuckItemsIds.push(claimedItem._id);
      }
    }    
    return balanceSummary;
  }
  
  async getRewards(userId: string) {
    const rewards = await VaultRewardsEth.find({ userId, dateAvailable: { $lte: new Date() } }).exec();
    return rewards;
  }
  
  async getWithdrawed(userId: string) {
    const rewards = await VaultWithdrawalEth.find({ userId }).exec();
    return rewards;
  }

  async updateMintState(newStatus: string, item: IVaultItemRequest, userId?:string) {
    switch (newStatus) {                
      case 'paid-fee':
        const transaction = await this.createConnectTransaction(userId,item.amount.toString());
        item.connectWithdrawalId = transaction._id;
        break;
      case 'minted':
        const allIds = [item.connectWithdrawalId, ...item.dbUnmintedItems.item.stuckItemsIds] ;
        await VaultWithdrawalEth.updateMany(
          { _id:{$in:allIds}},
          {
            transactionId: item.transactionId,
            toWalletAddress: item.address,
            status: VaultWithdrawalEthStatus.COMPLETE,
          }
        );
        break;
    }
  }

  private async createConnectTransaction(userId: string, total:string) {
    const withdrawal = await VaultWithdrawalEth.create({
      userId,
      date: new Date(),
      type: 'transfer',
      symbol: 'ETH',
      description: 'Withdrawal/Transfer',
      status: VaultWithdrawalEthStatus.SUBMITTED,
      total:total,
    });

    return withdrawal;
  }
}

export const connectRewardsService = new ConnectRewardsService();