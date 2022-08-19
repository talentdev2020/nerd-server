import { model, Document, Schema } from 'mongoose';
import { IDependent } from 'src/types';

export interface IDependentDocument extends IDependent, Document {}

export const DependentsSchema = new Schema({
  userId: String,
  firstName: String,
  lastName: String,
  height: String,
  weight: String,
  gender: String,
  title: String,
  dateOfBirth: Date,
  relationship: String,
  contactInformation: {
    contactPhoneType: String,
    countryCode: String,
    phoneNumber: String,
    email: String,
    country: String,
    state: String,
    zipCode: String,
  },
  blueDetails: {
    clinic: String,
    careclixId: String,
  },
  smsNotification: Boolean,
  emailNotification: Boolean,
  created: Date,
});

const Dependent = model<IDependentDocument>('Dependent', DependentsSchema);

export default Dependent;
