import { Types } from 'mongoose';

export default {
  _id: new Types.ObjectId('60fd24fce7d789ae04cee939'),
  userId: '60fd24fce7d789ae04cee939',
  email: 'admin@test.com',
  password: 'Admin0!',
  firstName: 'Connect',
  role: 'admin',
  lastName: 'Admin',
  displayName: 'Admin',
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
};
