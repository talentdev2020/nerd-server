export interface ICareclixUser {
  username: string;
  email: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: IDateOfBirthInput;
  gender: string;
  phoneNumber: IPhoneNumberInput;
  address: IAddressInput;
  productId: string;
  clinicIds: string;
  visitedTelemed: boolean;
  sentToTelemed: boolean;
  created?: Date;
}

export interface ICareclixDemographic {
  userId: string;
  productId: string;
  username: string;
  email: string;
  clinicIds: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  phoneNumber: IPhoneNumberInput;
  address: IAddressInput;
  created: Date;
}

export interface IDateOfBirthInput {
  year: number;
  month: number;
  day: number;
}
export interface IPhoneNumberInput {
  type: string;
  countryCode: string;
  number: string;
  code: string;
}

export interface IAddressInput {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ICareclixConfirmTelemed {
  userId: string;
  visitedTelemed: boolean;
  sentToTelemed: boolean;
}
