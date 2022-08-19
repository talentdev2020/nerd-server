import { Document } from 'mongoose';

export interface AnyObj {
  [key: string]: any;
}

export interface AnyMongooseDoc extends Document, AnyObj {}

export function isStringArray(value:unknown): value is string[]{
  return Array.isArray(value) && !value.some(item => typeof item !== "string")
}