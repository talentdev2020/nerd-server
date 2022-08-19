import * as mongoose from 'mongoose';
import { ICareclixUser } from 'src/types/ICareclixUser';

export interface ICareclixDemographicDoc
  extends mongoose.Document,
    ICareclixUser {}

export const dateOfBirthSchema = new mongoose.Schema({
  year: String,
  month: String,
  day: String,
});

export const careclixDemographicSchema = new mongoose.Schema({
  username: String,
  email: String,
  userId: String,
  firstName: String,
  lastName: String,
  dateOfBirth: Object,
  gender: String,
  phoneNumber: String,
  address: Object,
  productId: String,
  clinicIds: String,
  visitedTelemed: Boolean,
  sentToTelemed: Boolean,
  created: Date,
});

const CareclixDemographic = mongoose.model<ICareclixDemographicDoc>(
  'careclix-demographics',
  careclixDemographicSchema,
);

export default CareclixDemographic;
