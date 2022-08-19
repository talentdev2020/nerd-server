import { Schema, model, Types } from 'mongoose';

/**
 * Status of the payment card tied to an IBAN
 */
export enum CardStatus {
  Shipped = "Shipped",
  Active = "Active",
  Inactive = "Inactive"
}

interface ICard {
  _id: Types.ObjectId,
  created: Date,
  updated: Date,
  status: CardStatus,
  expiryDate?: Date
}

const cardSchema = new Schema(
  {
    _id: Types.ObjectId,
    status: { type: String, required: true, enum: Object.values(CardStatus) },
    expiryDate: { type: Date },
  },
  { timestamps: { createdAt: 'created', updatedAt: 'updated' } },
);

/**
 * User's IBAN status based on Paywiser documentation
 * 
 * IBAN status:
 * A - active
 * U - suspended by user
 * S - suspended by system
 * C - Closed
 *
 */
export enum IbanStatus {
  Active = "A",
  SuspendedByUser = "U",
  SuspendedBySystem = "S",
  Closed = "C"
}

/**
 * User's IBAN
 */
export interface IIban {
  _id?: Types.ObjectId,
  created?: Date,
  updated?: Date,
  status: IbanStatus,
  ibanNumber: string,
  paywiserIbanId: string,
  currency: string,
  cards?: ICard[]
}

const ibanSchema = new Schema(
  {
    status: { type: String, required: true, enum: Object.values(IbanStatus) },
    ibanNumber: { type: String, required: true, index: true, unique: true },
    paywiserIbanId: { type: String, required: true, index: true, unique: true },
    currency: { type: String, required: true },
    cards: [cardSchema],
  },
  { timestamps: { createdAt: 'created', updatedAt: 'updated' } }
)

/**
 * Type of IBAN package purchased
 */
export enum IbanPackage {
  Digital = "digital",
  Blue = "blue",
  Black = "black"
}

/**
 * Status of the UserIban entity
 */
export enum UserIbanStatus {
  Purchased = "purchased",
  IbanCreated = "ibancreated"
}

export interface IUserIban {
  _id: Types.ObjectId,
  created: Date,
  updated: Date,
  userId: Types.ObjectId,
  packageName: IbanPackage,
  status: UserIbanStatus,
  iban?: IIban
}

const userIbanSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'user', required: true, index: true, unique: true },
    packageName: { type: String, required: true, enum: Object.values(IbanPackage) },
    status: { type: String, required: true, enum: Object.values(UserIbanStatus) },
    iban: ibanSchema,
  },
  { timestamps: { createdAt: 'created', updatedAt: 'updated' } }
)

/**
 * UserIban model represents the parent entity which contains the status,
 * purchased package and the actual IBAN data
 */
export const UserIban = model<IUserIban>("user-iban", userIbanSchema)
