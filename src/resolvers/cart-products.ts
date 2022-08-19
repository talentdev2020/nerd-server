import { LicenseTypeModel } from 'src/models';
import ResolverBase from 'src/common/Resolver-Base';
import { logger } from 'src/common';
import {
  ICartProduct,
  ICartProductResponse,
} from '../models';
import CartProductModel  from '../models/cart-products';
import { Context } from 'src/types';
import { updateAndStoreCartProductCostPipeline } from 'src/pipelines';
import { UpdateResult } from 'mongodb';

class Resolvers extends ResolverBase {

  getAllCartProducts = async () => {
    let products: ICartProduct[];
    try {
      products = await CartProductModel.find({})
        .select('id name costUpfront costSubscription created lastUpdated licenses meprId -_id')
        .exec();
    } catch (error) {
      logger.warn(`resolvers.cart-products.getAllProducts.catch: ${error}`);
      throw new Error("Unable to retrieve cart products: " + error.message);
    }
    return products;
  };

  getCartProductById = async ( 
    parent: any,
    args: {
      productId: string;
    },
  ): Promise<ICartProductResponse> => {
    const { productId } = args;
    
    try {
      const product: ICartProduct = await CartProductModel.findById(productId).exec();
      if (!product) {
          return {
            success: false,
            data: null,
            message: 'Cart product not found',
          }
      }
      
      return {
        success: true,
        data: product,
        message: 'Found the cart product successfully',
      }
    } catch (error) {
      logger.warn(`resolvers.cart-products.getCartProductById.catch: ${error}`);
      throw new Error("Unable to retrieve cart product: " + error.message);
    }
  };

  getCartProductByMeprId = async ( 
    parent: any,
    args: {
      meprId: number;
    },
  ): Promise<ICartProductResponse> => {
    const { meprId } = args;
    
    try {
      const product: ICartProduct = await CartProductModel.findOne({ meprId }).exec();
      if (!product) {
        return {
          success: false,
          data: null,
          message: 'Cart product not found',
        }
      }
      
      return {
        success: true,
        data: product,
        message: 'Found the cart product successfully',
      }
    } catch (error) {
      logger.warn(`resolvers.cart-products.getCartProductByMeprId.catch: ${error}`);
      throw new Error("Unable to retrieve cart product: " + error.message);
    }
  };

  createCartProduct = async (
    _parent: any,
    args: {
      name: string,
      costUpfront: number,
      costSubscription: number,
      meprId: number,
    },
    ctx: Context,
  ): Promise<ICartProduct> => {
    const { user } = ctx;
    this.requireAdmin(user);
    const { name, costUpfront, costSubscription, meprId } = args;
    try {
      if (meprId) {
        const product = await CartProductModel.findOne({ meprId }).exec();
        if (product) {
          throw new Error(`MeprId(${meprId}) already exists`);
        }
      }
      const productModel = new CartProductModel({
        name,
        costUpfront,
        costSubscription,
        meprId,
        created: new Date(),
      });
      const newProduct = await productModel.save();

      return newProduct;
    } catch (error) {
      logger.warn(`resolvers.cart-products.createProduct.catch: ${error}`);
      throw new Error("Unable to create cart product: " + error.message);
    }
  };

  updateCartProductCostUpFront = async (
    _parent:any,
    {meprId,costUpFront}:{meprId:number,costUpFront:number},
    {user}:Context,
  )=>{
    this.requireAdmin(user);    
    const updatePipeline = updateAndStoreCartProductCostPipeline(costUpFront);
    let updated:UpdateResult;
    try {      
      updated = await CartProductModel.updateOne({ meprId },updatePipeline).exec();
    } catch (error) {
      logger.error(`Failed to update price. Error: ${error.message}`);      
      return {
        success:false,
        message:"Failed to update price - server error", 
      }
    }
    if (updated.modifiedCount !== 1) {
      return {
        success:false,
        message:"cart product not found",
      }
    }
    return {
      success:true,
    }
  }

  setLinkLicenseTypeCartProduct = async (
    _parent:any,
    {meprId , licenses }:{meprId: number, licenses: Array<{licenseTypeId: string, quantity: number}>},
    {user}:Context,
  )=>{
    this.requireAdmin(user);
 
    try {   
      let licenseTypeIds = licenses.map(license => license.licenseTypeId);
      const result = await LicenseTypeModel.aggregate([
        { "$group": { "_id": null, "ids": { "$addToSet": "$id" }}}, 
        { "$project" : { "missingIds": { "$setDifference": [ licenseTypeIds, "$ids" ]}, "_id": 0 }},
      ])

      if(result[0].missingIds.length > 0) {
        return {
          success:false,
          message: `License Types ${result[0].missingIds.toString()} don't exist`,
        }
      }
      const cartProduct = await CartProductModel.findOne({ meprId });
      if (!cartProduct) {
        return {
          success:false,
          message:"cart product not found",
        }
      }
      if (cartProduct.licenses.length > 0) {
        licenseTypeIds = cartProduct.licenses.map(license => license.licenseTypeId);
        return {
          success:false,
          message: `License Types (${licenseTypeIds.toString()}) are already linked`,
        }
      }
      const updated = await CartProductModel.updateOne({ meprId }, [
        {
            $set:{
              licenses,
            },
        },
      ]).exec();

      return {
        success:true,
        message: "successfully linked license-types",
      }
    } catch (error) {
      logger.error(`Failed to link license-types. Error: ${error.message}`);      
      return {
        success:false,
        message: `Failed to link license-types. Error: ${error.message}`,      
      }
    }
  }
}

const resolvers = new Resolvers();
export default {
  Query: {
    getAllCartProducts: resolvers.getAllCartProducts,
    getCartProductById: resolvers.getCartProductById,
    getCartProductByMeprId: resolvers.getCartProductByMeprId,
  },
  Mutation: {
    createCartProduct: resolvers.createCartProduct,
    updateCartProductCostUpFront: resolvers.updateCartProductCostUpFront,
    setLinkLicenseTypeCartProduct: resolvers.setLinkLicenseTypeCartProduct,
  },
};