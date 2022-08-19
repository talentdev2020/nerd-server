import { Types } from 'mongoose';

export default {
  _id: new Types.ObjectId('60fd24fce7d789ae04cee939'),
  userId: '60fd24fce7d789ae04cee939',
  email: 'blueuser@test.com',
  password: 'Bluetest0!',
  firstName: 'Blue',
  lastName: 'User',
  displayName: 'Blue',
  profilePhotoFilename: '',
  phone: '32233224',
  phoneCountry: 'US',
  language: 'en',
  referralContext: {},
  communicationConsent: true,
  activationTermsAndConditions: [
    {
      timestamp: new Date(),
      ipAddress: '127.0.0.1',
      text: '',
    },
  ],
  gender: 'Male',
  dateOfBirth: new Date(1980, 0, 1),
  country: 'United States',
  countryCode: 'US',
  countryPhoneCode: '380',
  clinic: 'shassan',
  street: 'Echols Ave',
  city: 'Clovis',
  state: 'New Mexico',
  zipCode: '88101',
};
