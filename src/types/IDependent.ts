export default interface IDependent {
  userId: string;
  firstName: string;
  lastName: string;
  height: string;
  weight: string;
  gender: string;
  title: string;
  dateOfBirth: Date;
  relationship: string;
  contactInformation: {
    contactPhoneType: string;
    countryCode: string;
    phoneNumber: string;
    email: string;
    country: string;
    state: string;
    zipCode: string;
  };
  blueDetails: {
    clinic: string;
    careclixId: string;
  };
  smsNotification: boolean;
  emailNotification: boolean;
  created: Date;
}

export interface IDependentInput {
  firstName: string;
  lastName: string;
  height: string;
  weight: string;
  gender: string;
  title: string;
  dateOfBirth: Date;
  relationship: string;
  contactInformation: {
    contactPhoneType: string;
    countryCode: string;
    phoneNumber: string;
    email: string;
    country: string;
    state: string;
    zipCode: string;
  };
  blueDetails: {
    clinic: string;
    careclixId: string;
  };
  smsNotification: boolean;
  emailNotification: boolean;
}
