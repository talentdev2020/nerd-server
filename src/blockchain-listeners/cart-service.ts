import { config, configAws, logger } from '../common';
import { ServerToServerService } from '../services/server-to-server';
import { addDays, subDays } from 'date-fns';
import { CartStatus } from 'src/types';

export class CartService extends ServerToServerService {
  constructor() {
    super();
  }
 
  //**
  //  NOTE orderId that is in result will prepend with the following code: 
  // Woocommerce - wooc-<ID>
  // Memberpress - mepr-<ID>
  // */
  public getOrdersFromMeprCart = async (
    orderId: string,
  ): Promise<MemprTxOrders> => {
    const axios = this.getAxios({ role: 'system' });
    let realOrderId = orderId;
    if (orderId.toUpperCase().indexOf('.') > 0) {
      realOrderId = orderId.split('.')[1];
    }
    const requestUrl = `${configAws.wpApiUrl}/bb_wallet/v1/get_mepr_tx_order?ApiKey=${configAws.wpApiKey}&OrderId=${realOrderId}`;    
    try {
      const wpResponse = await axios.post<MemprTxOrders>(requestUrl);
      return wpResponse.data;
    } catch (err) {
      logger.exceptionContext(
        err,
        `Failed to getOrderFromMeprCart : ${configAws.wpApiUrl} | ${orderId}`,
        {},
      );
        throw new Error("Unable to acquire order data - server error");  
    }
  };

  public getOrdersFromWooCart = async (): Promise<WooTxOrders> => {
    const axios = this.getAxios({ role: 'system' });

    const currDate = new Date();
    const tomorrow = addDays(currDate, 1);
    const yesterday = subDays(currDate, 1);

    const result = await axios.post<WooTxOrders>(
      `${configAws.wpApiUrl}/bb_wallet/v1/get_woo_tx_orders?ApiKey=${configAws.wpApiKey}&date_start=${this.dateString(
        yesterday,
      )}&date_end=${this.dateString(tomorrow)}`,
      {},
    );

    //** NOTE orderId that is in result will prepend with the following code: */
    // Woocommerce - wooc-<ID>
    // Memberpress - mepr-<ID>

    return result.data;
  };

  public updateOrderToWooCart = async (
    woo_tx_id: string,
    address: string,
    balance: number,
    coinSymbol: string,
    orderId: string,
  ): Promise<WooTxOrders[]> => {
    const postBody: any = {
      ApiKey: configAws.wpApiKey,
      OrderId: woo_tx_id,
      Address: address,
      CoinSymbol: coinSymbol,
      AmtTotal: balance,
      BlockchainTxIds: woo_tx_id,
      OrderStatus: 'complete', // | 'failed'
    };

    try {
      const axios = this.getAxios({ role: 'system' });

      const result = await axios.post<WooTxOrders[]>(
        `${configAws.wpApiUrl}/bb_wallet/v1/update_wp_tx_order`,
        postBody,
      );

      return result.data;
    } catch (err) {
      logger.exceptionContext(
        err,
        `cart-service.CartService.updateOrderToWooCart :`,
        {
          postBody,
        },
      );
    }
  };

  public updateTransactionToMemberpressCart = async (
    address: string,
    balance: number,
    coinSymbol: string,
    orderId: string,
    status: CartStatus,
  ): Promise<MemprTxOrders[]> => {
    const postBody: any = {
      ApiKey: configAws.wpApiKey,
      OrderId: `mepr.${orderId}`,
      Address: address,
      CoinSymbol: coinSymbol,
      AmtTotal: balance,
      BlockchainTxIds: undefined,
      Status: CartStatus[status],
    };
    if (status === CartStatus.expired) {
      postBody.OrderStatus = 'failed';
    }

    try {
      const axios = this.getAxios({ role: 'system' });

      const result = await axios.post<MemprTxOrders[]>(
        `${configAws.wpApiUrl
        }/bb_wallet/v1/update_wp_tx_order`,
        postBody,
      );

      return result.data;
    } catch (err) {
      logger.exceptionContext(
        err,
        'cart-service.CartService.updateToWordpressCart',
        { postBody },
      );
    }
  };

  private dateString(val: Date) {
    return `${val.getFullYear}-${val.getMonth}-${val.getDay}`;
  }


    


}

export class MemprTxOrders {
  'success': number;
  'message': string;
  'status': string;
  'tx-json': string;
  'total': number;
}
export class MeprTxOrder {
  'status': string;
  'total': string;
}

// {
//   "membership": {
//     "id": 9413,
//     "title": "Green Smart Node",
//     "content": "",
//     "excerpt": "",
//     "date": "2021-08-30 17:29:51",
//     "status": "publish",
//     "author": "1",
//     "date_gmt": "2021-08-30 17:29:51",
//     "modified": "2021-09-03 17:44:15",
//     "modified_gmt": "2021-09-03 17:44:15",
//     "group": "0",
//     "price": "2000.00",
//     "period": "1",
//     "period_type": "lifetime",
//     "signup_button_text": "Sign Up",
//     "limit_cycles": false,
//     "limit_cycles_num": "2",
//     "limit_cycles_action": "expire",
//     "limit_cycles_expires_after": "1",
//     "limit_cycles_expires_type": "days",
//     "trial": false,
//     "trial_days": "0",
//     "trial_amount": "0",
//     "trial_once": "1",
//     "group_order": "0",
//     "is_highlighted": false,
//     "plan_code": "",
//     "pricing_title": "Liberty Smart Node",
//     "pricing_show_price": true,
//     "pricing_display": "auto",
//     "custom_price": "",
//     "pricing_heading_txt": "",
//     "pricing_footer_txt": "",
//     "pricing_button_txt": "Sign Up",
//     "pricing_button_position": "footer",
//     "pricing_benefits": [
//       ""
//     ],
//     "register_price_action": "default",
//     "register_price": "",
//     "thank_you_page_enabled": "1",
//     "thank_you_page_type": "page",
//     "thank_you_message": "",
//     "thank_you_page_id": "9339",
//     "custom_login_urls_enabled": "1",
//     "custom_login_urls_default": "\/dashboard\/",
//     "custom_login_urls": [],
//     "expire_type": "none",
//     "expire_after": "1",
//     "expire_unit": "days",
//     "expire_fixed": "2021-09-03",
//     "tax_exempt": false,
//     "tax_class": "standard",
//     "allow_renewal": false,
//     "access_url": "",
//     "disable_address_fields": false,
//     "simultaneous_subscriptions": false,
//     "use_custom_template": false,
//     "custom_template": "page-left-sidebar.php",
//     "customize_payment_methods": false,
//     "custom_payment_methods": [],
//     "customize_profile_fields": false,
//     "custom_profile_fields": [],
//     "cannot_purchase_message": "You don't have access to purchase this item."
//   },
//   "member": {
//     "id": 10,
//     "email": "brant@blockchainjedi.com",
//     "username": "brant@blockchainjedi.com",
//     "nicename": "brantblockchainjedi-com",
//     "url": "",
//     "message": "",
//     "registered_at": "2021-08-24 06:13:11",
//     "first_name": "Brant",
//     "last_name": "Ninja",
//     "display_name": "Brant Ninja",
//     "address": {
//       "mepr-address-one": "",
//       "mepr-address-two": "",
//       "mepr-address-city": "",
//       "mepr-address-state": "",
//       "mepr-address-zip": "",
//       "mepr-address-country": ""
//     },
//     "profile": {}
//   },
//   "coupon": "0",
//   "subscription": "0",
//   "id": "272",
//   "amount": "2000.00",
//   "total": "2000.00",
//   "tax_amount": "0.00",
//   "tax_rate": "0.000",
//   "tax_desc": "",
//   "tax_class": "standard",
//   "trans_num": "t_612fecda16349",
//   "status": "complete",
//   "txn_type": "payment",
//   "gateway": "qyrwzz-62k",
//   "prorated": "0",
//   "created_at": "2021-09-01 21:12:58",
//   "expires_at": "0000-00-00 00:00:00",
//   "corporate_account_id": "0",
//   "parent_transaction_id": "0",
//   "tax_compound": "0",
//   "tax_shipping": "1",
//   "response": null,
//   "rebill": false,
//   "subscription_payment_index": false
// }

export class WooTxOrders {
  'success': number;
  'message': string;
  'orders': WooTxOrderDetail[];
  'orders-json': string;
}

export class WooTxOrderDetail {
  'id': string;
  'parent_id': number;
  'status': string;
  'currency': string;
  'version': string;
  'prices_include_tax': boolean;
  'date_created': WordpressDate;
  'discount_total': string;
  'discount_tax': string;
  'shipping_total': string;
  'shipping_tax': string;
  'cart_tax': string;
  'total': string;
  'total_tax': string;
  'customer_id': number;
  'order_key': string;
  'billing': any; //todo: update this
  'payment_method': string;
  'payment_method_title': string;
  'transaction_id': string;
  'customer_ip_address': string;
  'customer_user_agent': string;
  'created_via': string;
  'customer_note': string;
  'date_completed': WordpressDate;
  'date_paid': WordpressDate;
  'cart_hash': string;
  'number': string;
  'meta_data': WooTxOrderDetailMeta[];
  'line_items': any;
  'tax_lines': any[];
  'shipping_lines': any[];
  'fee_lines': any[];
  'coupon_lines': any[];
  'custom_field': any;
}

// "billing": {
//   "first_name": "Brant",
//   "last_name": "Frank",
//   "company": "asdf",
//   "address_1": "939393",
//   "address_2": "asdf",
//   "city": "lsoldid",
//   "state": "UT",
//   "postcode": "88888",
//   "country": "US",
//   "email": "brant@blockchain.com",
//   "phone": "8884441111"
// },
// "shipping": {
//   "first_name": "",
//   "last_name": "",
//   "company": "",
//   "address_1": "",
//   "address_2": "",
//   "city": "",
//   "state": "",
//   "postcode": "",
//   "country": ""
// },
// "custom_field": {
//   "currency_to_process": "BTC",
//   "currency_address": "",
//   "currency_value": "",
//   "currency_amount_to_process": "0.06289130",
//   "payment_type": "internal"
// }

export class WordpressDate {
  'date': string;
  'timezone_type': number;
  'timezone': string;
}

export class WooTxOrderDetailMeta {
  'id': number;
  'key': string;
  'value': string;
}
