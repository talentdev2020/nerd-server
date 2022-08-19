import { Schema, model, Document } from 'mongoose';
import { ILicenseTypeMapping } from '../types';

export interface ILicenseTypeMappingDocument
  extends ILicenseTypeMapping,
    Document {}

export const licenseTypeMappingSchema = new Schema({
  licenseTypeId: { type: String, index: true },
  wordPressMembershipId: { type: String, index: true },
  created: Date,
});

licenseTypeMappingSchema.index(
  {
    licenseTypeId: 1,
    wordPressMembershipId: 1,
  },
  {
    unique: true,
  },
);

const LicenseTypeMappingModel = model<ILicenseTypeMappingDocument>(
  'License-type-mapping',
  licenseTypeMappingSchema,
);
export default LicenseTypeMappingModel;
