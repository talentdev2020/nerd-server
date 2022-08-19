import { Decimal128 } from 'bson';
import { Document, model, Schema } from 'mongoose'; // DAL communication & Mongo schema enforcement

export interface ICartProductResponse {
  success: boolean,
  data: ICartProduct | null,
  message: string
}
export interface ICartProduct extends Document {
  name: string,
  costUpfront: number,
  costSubscription: number,
  meprId: number,
  created: Date,
  lastUpdated: Date,
  id: string,
  licenses: [{
    licenseTypeId: string,
    quantity: number,
  }],
  costHistory:[
    {
      dateArchived:Date,
      costUpfront:number,
    }
  ]
}

export const cartProductSchema = new Schema({
  name: String,
  costUpfront: Number,
  costSubscription: Number,
  meprId: Number,
  created: Date,
  lastUpdated: Date,
  id: String,
  licenses: [{
    licenseTypeId: String,
    quantity: Number,
  }],
  costHistory:{
    dateArchived:Date,
    costUpfront:Number,
  },
});

cartProductSchema.post('save', async function (doc: ICartProduct, next: any) {
  if (!doc._id) {
    return;
  }
  const id = doc._id.toString();
  if (doc.id !== id) {
    doc.id = id;
    try {
      doc.save();
    } catch (err) {
      next(err);
    }
  }
});

const CartProduct = model<ICartProduct>(
  'cart-products',
  cartProductSchema,
);

export default CartProduct;
