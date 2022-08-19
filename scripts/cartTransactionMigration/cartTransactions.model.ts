import {model, Schema } from 'mongoose';

const cartTransactionSchema = new Schema({
    data: String,  
    productId:String, 
    productName:String,
    quantity:Number, 
    memberId:String,
    migrationDataIncomplete:Boolean,
  });
  
export const CartTransactionModel = model(
    'cart-transaction',
    cartTransactionSchema,
  );
  