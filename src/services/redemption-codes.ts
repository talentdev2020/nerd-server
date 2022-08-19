import { IUserRedemptionCode, RedemptionCodes, UserCodeRedemptions } from "src/models";

export class RedemptionCodesService {

  async createRedemptionCode(redemptionCode: any) {
    return await RedemptionCodes.create(redemptionCode);
  }

  async getRedemptionCodes() {
    return await RedemptionCodes.find();
  }

  async getRedemptionCodesByUser(userId: string) {
    const redemptionCodes = await RedemptionCodes.find();
    const validUserRedemptionCodes = redemptionCodes
      .filter(x => x.isActive)
      .filter(x => x.redeemableBy === userId 
        || ( x.redeemableBy === undefined || x.redeemableBy === null ))

    const userRedemptions: IUserRedemptionCode[] = await Promise.all(validUserRedemptionCodes.map(async (code) => {
      const userCodeRedemptions = await UserCodeRedemptions.find({ userId: userId, code: code.code });
      
      const redemption : IUserRedemptionCode = {
        code: code.code,
        isActive: code.isActive,
        value: code?.value,
        redeemableBy: code?.redeemableBy,
        description: code?.description,
        redemptions: userCodeRedemptions,
        created: code.created,
        updated: code.updated,
      }

      return redemption;
    }));

    return userRedemptions ?? [];
  }

  async updateRedemptionCode(code: string, isActive: boolean) {
    await RedemptionCodes.findOneAndUpdate({ code: code }, { $set: { isActive: isActive }});
    return RedemptionCodes.findOne({ code: code });
  }

  async validateCode(code: string, userId: string) {
    // Check that the code is valid and that customer can use it
    const userCodes = await this.getRedemptionCodesByUser(userId);
    const validCode = userCodes.find(c => c.code === code);
    if (validCode === null || validCode === undefined) {
      return {
        success: false,
        message: `Code: ${code} doesn't exist for customer`,
      };
    }

    // Check for code redemptions by the customer
    const userCodeRedemptions = await UserCodeRedemptions.find({ code: code, userId: userId });
    
    // Check for redemption
    if (userCodeRedemptions?.length > 0) {
      return {
        success: false,
        message: `Code: ${code} already redeemed for customer`,
      }
    } else {
      const createCodeRedemption = {
        code: code,
        userId: userId,
      };

      const response = await UserCodeRedemptions.create(createCodeRedemption);
      if (response) {
        return {
          success: true,
          message: `Code: ${code} successfully redeemed for customer`,
        }
      }
    }

    return {
      success: false,
      message: `Error redeeming code: ${code} for customer`,
    }
  }
}

export const redemptionCodesService = new RedemptionCodesService();