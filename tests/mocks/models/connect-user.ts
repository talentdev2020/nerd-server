import { Types } from 'mongoose';

export default {
  _id: new Types.ObjectId('60fd24fce7d789ae04cee939'),
  userId: '60fd24fce7d789ae04cee939',
  email: 'connectuser@test.com',
  password: 'Connecttest0!',
  firstName: 'Connect',
  lastName: 'User',
  displayName: 'Connect',
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
