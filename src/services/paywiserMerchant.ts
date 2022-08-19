import axios from 'axios';
import {
  IPaywiserMerchantPaymentRequest,
  IPaywiserMerchantRequestPaymentRequest,
  IPaywiserMerchantRequestPaymentResponse,
} from '../types';
import { config, configAws, logger } from '../common';
import { countryPhoneCodes, validNumberRegExp } from '../utils';
import { UserPaywiserModel } from '../models';

const POINT = '.';

class PaywiserMerchantService {
  public requestPayment = async (
    req: IPaywiserMerchantRequestPaymentRequest,
  ): Promise<IPaywiserMerchantRequestPaymentResponse> => {
    try {
      const url = `${configAws.paywiserMerchantHost}/RequestPayment`;
      const resp: {
        data: IPaywiserMerchantRequestPaymentResponse;
      } = await axios.post(url, req, {
        auth: {
          username: configAws.paywiserMerchantUsername,
          password: configAws.paywiserMerchantPassword,
        },
      });

      return resp.data;
    } catch (err) {
      logger.error(
        `services.paywiser.PaywiserMerchantService.requestPayment: ${
          err.message
        } : ${err.toString()}`,
      );
      throw err;
    }
    return undefined;
  };
}

export const paywiserMerchantService = new PaywiserMerchantService();
