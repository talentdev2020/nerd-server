import { logger, config } from '../common';
import { default as LicenseModel, ILicense, ILicenseOtherBrand } from 'src/models/license';
import userModel from 'src/models/user';
import { LicenseTypeModel } from 'src/models';
import CartProductModel  from '../models/cart-products';
import { 
  ILicenseType,  
  TGetCartAddressSource,
} from 'src/types';

import { getArchiveWalletsUpdatePipeline } from 'src/pipelines';


import coreEventHandler from 'src/event-handlers/wallet-server-core';

export class UserService {
  //privateLicenses singleton. Code should always call 'getLicenseTypes'
  private static privateLicenses: ILicenseType[];
  static async getLicenseTypes() {
    if (!this.privateLicenses) {
      try {
        this.privateLicenses = await LicenseTypeModel.find({}).exec();
      } catch(error) {
        throw error;
      }
    }
    return this.privateLicenses;
  }

  async assignUserLicense(transactionSource:TGetCartAddressSource, membershipId: string, quantityPurchased:number, userId: string, cartTransactionId: string, orderId:string) {      
      const user = await userModel.findById(userId,{email:1}).lean().exec();
      if (!user) throw new Error('User not found');

      const cartProduct = await CartProductModel.findOne({meprId:parseInt(membershipId)}).lean().exec();
      if (!cartProduct) {
        logger.criticalContext(
          `Shopping cart is trying to assign a license, but can't find wordpressMembershipId: ${membershipId}`,
          { "email": user.email, "tx": cartTransactionId, "wordPressMembershipId": membershipId });
          throw new Error("wordpressMembershipId not found");
      }      

      await this.assignCurrentBrandLicenses(cartProduct.licenses,quantityPurchased,userId,cartTransactionId);    
      this.emitOrderLicensesGranted(transactionSource, orderId, userId, user.email);
    
      // await this.assignOtherBrandsLicenses(mapping.licenses,membershipQuantity,userId,cartTransactionId);
  }

 private async assignCurrentBrandLicenses(mappedLicenses:{licenseTypeId: string; quantity: number;}[],  quantityPurchased:number,userId:string, cartTransactionId:string){  
  const toInsert: Array<Partial<ILicense>> = [];
  mappedLicenses.forEach(thisMapping => {
    const totalLicensesQuantity = thisMapping.quantity * quantityPurchased; 
    for (let i = 0; i < totalLicensesQuantity; i++) {
      toInsert.push({
        licenseTypeId: thisMapping.licenseTypeId,
        cartTransactionId,
        userId: userId,
        created: new Date(),
        inUse: true,
        ownershipHistory: [{
          receivedReason: `Shopping Cart order # ${cartTransactionId}`,
          received: new Date(),
        }],
      });  
    }
  });

  if (toInsert.length === 0)
    throw new Error('membership has no licenseType mapped');

  try {
    await LicenseModel.insertMany(toInsert);
  } catch(error) {
    throw error;
  }
 };

  private async assignOtherBrandsLicenses(mappedLicenses:{licenseTypeId: string; quantity: number;}[],  quantityPurchased:number,userId:string, cartTransactionId:string){
    if (config.brand === 'connect') {
      const toInsertOtherBrands: Array<ILicenseOtherBrand> = [];
      await UserService.getLicenseTypes();      
        //Find the licenseType for this inner license
        let thisLicenseType: ILicenseType = undefined;
        UserService.privateLicenses.map(licenseType => {
          if (licenseType._id) {
            thisLicenseType = licenseType;
          }
        });

        mappedLicenses.forEach(thisMapping => {
          const totalLicensesQuantity = thisMapping.quantity * quantityPurchased;
          for (let i = 0; i < totalLicensesQuantity; i++) {          
            toInsertOtherBrands.push({
              licenseTypeId: thisMapping.licenseTypeId,
              cartTransactionId,
              userId,
              destinationBrand: thisLicenseType.environmentType,
              destinationLicenseTypeId: thisLicenseType.destinationLicenseTypeId,
            });
          }
        }); 

        if (toInsertOtherBrands && toInsertOtherBrands.length > 0) {
          // TODO : call new microservice to insert license record for that brand
        }
    }
  }

  async getAffiliateIdByAffiliateIdOrCustomerNumber(affiliateIdOrCustomerNumber: string) {
    if (!affiliateIdOrCustomerNumber)
      return affiliateIdOrCustomerNumber;

    let referredUsers: any;
    try {
      referredUsers = await userModel.find(
        {
          $or: [
            { affiliateId: affiliateIdOrCustomerNumber },
            { number: affiliateIdOrCustomerNumber },
          ],
        },
        { _id: 0, affiliateId: 1, number: 1 }
      )
        .limit(2)
        .lean()
        .exec();
    } catch (error) {
      logger.error(`Unable to find referred. error: ${error}`);
      return '';
    }

    // The next is hard validation in order to ensure data Integrity.    
    // the referred is not found.
    if (referredUsers.length < 1) {
      logger.error("referred not found");
      return '';
    }

    //More than one referred found
    if (referredUsers.length > 1) {
      logger.error("Unable to determinate referred more than one referred found");
      return '';
    }

    const referredUser = referredUsers[0];

    //the next two if's are informative, and could be removed.
    //which of the criteria was the referred found by.
    if (referredUser.affiliateId === affiliateIdOrCustomerNumber) {
      logger.info("referredUser found by affiliateId");
    }

    if (referredUser.number === affiliateIdOrCustomerNumber) {
      logger.info("referredUser found by customerNumber");
    }
    return referredUser.affiliateId;
  }

  //this function is similar to getAffiliateIdByAffiliateIdOrCustomerNumber, but is used for finding the unique reference Id to communicate with the Paywiser API 05/16/2022
  async getAffiliateIdByUserId (userId: string) {
    let user: any;
    let affiliateId: any;
    try {
      user = await userModel.findOne(
        {
          $or: [
            { id: userId},
          ],
        },
        { _id: 0, affiliateId: 1, id: 1 }
      )
        .lean()
        .exec();
    } catch (error) {
      logger.error(`Unable to find affiliateId. error: ${error}`);
      return '';
    }
    
    affiliateId = user.affiliateId;
    return affiliateId;
  }

  async getNameByCustomerNumber(affiliateIdOrCustomerNumber: string) {
    if (!affiliateIdOrCustomerNumber)
      return { match: false };

    let user: any;
    try {
      user = await userModel.find(
        {
          $or: [
            { affiliateId: affiliateIdOrCustomerNumber },
            { number: affiliateIdOrCustomerNumber },
          ],
        },
        { _id: 0, firstName: 1, lastName: 1, affiliateId: 1, number: 1 }
      )
        .limit(2)
        .lean()
        .exec();
    } catch (error) {
      logger.error(`Unable to find referred. error: ${error}`);
      return { match: false };
    }

    // The next is hard validation in order to ensure data Integrity.    
    // the referred is not found.
    if (user.length < 1) {
      logger.error("referred not found");
      return { match: false };
    }

    //More than one referred found
    if (user.length > 1) {
      logger.error("Unable to determinate referred more than one referred found");
      return { match: false };
    }

    const userFind = user[0];

    //the two next if's are informative, and could be removed.
    //wich of the criteria was the referred found by.
    if (userFind.affiliateId === affiliateIdOrCustomerNumber) {
      logger.info("referredUser found by affiliateId");
    }

    if (userFind.number === affiliateIdOrCustomerNumber) {
      logger.info("referredUser found by customerNumber");
    }
    return { match: true, firstName: userFind.firstName, lastName: userFind.lastName };
  }


async getWalletsDBInfo(userId:string){
   const walletInfo = await userModel.findById(userId,{"wallet.ethAddress":1, "wallet.ethBlockNumAtCreation":1, "wallet.btcAddress":1}).exec();
   return  {
    ethAddress:walletInfo.wallet.ethAddress,
    ethBlockNumAtCreation:walletInfo.wallet.ethBlockNumAtCreation,
    btcAddress:walletInfo.wallet.btcAddress,    
  };   
}

async archiveWallets(userId:string){
  let updated:any;
  try {
    const pipeline = getArchiveWalletsUpdatePipeline();
    updated = await userModel.updateOne({id:userId},pipeline);
  } catch (error) {
    logger.warnContext("unable to archive wallets",{userId});
    throw new Error("server error");
  }

  if (updated.modifiedCount !== 1) {
    throw new Error("user not found");
  }
}

//#region pseudo observer pattern
// TODO: replace this region for a observer pattern using nodejs events.
private emitOrderLicensesGranted(transactionSource:TGetCartAddressSource, orderId:string, userId:string, email:string){
  coreEventHandler.onOrderLicensesGranted(transactionSource,orderId,userId,email);  
}
//#endregion
}

export const userService = new UserService();
export default userService;