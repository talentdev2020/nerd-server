import { configAws } from '../common';
import { IOrderContext } from '../types';
import { RESTDataSource } from 'apollo-datasource-rest';

class Blockfunnels extends RESTDataSource {
  baseURL = configAws.blockfunnelsUrl;

  public async orderProduct(orderInfo: {
    productId: string;
    productAmount: number;
    context: IOrderContext;
    id: string; // userId
  }) {
    const encodedCredentials = '';
    // const encodedCredentials = Buffer.from(
    //   `gala:${config.blockfunnelsBasicAuthPassword}`,
    // ).toString('base64');
    const orderResponse = await this.post('/user/order', orderInfo, {
      headers: { Authorization: `Basic ${encodedCredentials}` },
    });
    return orderResponse;
  }
}

export default Blockfunnels;

export const blockfunnelsService = new Blockfunnels();
