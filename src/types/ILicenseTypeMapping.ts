import ILicenseType from './ILicenseType';

export interface ILicenseTypeMappingInput {
  licenseTypeId: string;
  wordPressMembershipId: string;
}

export default interface ILicenseTypeMapping extends ILicenseTypeMappingInput {
  created: Date;
}

export interface ILicenseTypeMappingFull {
  licenseType: ILicenseType;
  wordPressMemberships: { id: string; created: Date }[];
}
