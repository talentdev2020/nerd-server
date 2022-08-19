import axios from 'axios';
import configAws from '../common/config-aws';
import { ICareclixUser } from '../types';
import { CareclixDemographic } from 'src/models';

class CareclixService {
  
  public careclixDemographicSend = async (args: ICareclixUser) => {
    try {
      const randomNumber = ~~(Math.random() * 9000 + 1000).toString();
      const randomPassword = () => {
        const length = 8;
        const charset =
          'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let retVal = '';
        for (let i = 0, n = charset.length; i < length; ++i) {
          retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        //return random password with extra characters added to meet careclix criteria
        return retVal + '0a!3';
      };

      const passwordToSend = randomPassword();

      const sendToCareclix = {
        username:
          args.firstName.toLowerCase() +
          args.lastName.toLowerCase() +
          randomNumber,
        password: passwordToSend,
        confirmPassword: passwordToSend,
        email: args.email,
        clinicIds: [args.clinicIds],
        firstName: args.firstName,
        lastName: args.lastName,
        gender: args.gender,
        dateOfBirth: new Date(
          args.dateOfBirth.year,
          args.dateOfBirth.month,
          args.dateOfBirth.day,
        ).toISOString(),
        phoneNumber: {
          type: args.phoneNumber.type,
          countryCode: args.phoneNumber.countryCode,
          number: args.phoneNumber.number,
          code: args.phoneNumber.code,
        },
        address: {
          street: args.address.street,
          city: args.address.city,
          state: args.address.state,
          zipCode: args.address.zipCode,
          country: args.address.country,
        },
      };
      const stringified = JSON.stringify(sendToCareclix);
      const data: any = await axios
        .post(`${configAws.baseCareclixUrl}/v1/accounts`, {
          data: stringified,
        })
        .then(response => {
          if (response.status === 200) {
            CareclixDemographic.updateOne(
              { userId: args.userId },
              {
                $set: {
                  sentToTelemed: 'true',
                },
              },
            ).then(() => {
              return args.sentToTelemed;
            });
          } else {
            return 0;
          }
        });
      return data;
    } catch (err) {
      throw new Error(
        `An error happened while creating Careclix account: ${err.toString()}`,
      );
    }
  };
}

export const careclix = new CareclixService();
