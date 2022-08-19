export interface IMyOrdersResponse {
  maker_orders: {
    [index: string]: IMakerOrderStatusResponse; // this index is the uuid of the order
  };
  taker_orders: {
    [index: string]: ITakerOrderStatusResponse; // this index is the uuid of the order
  };
}
export enum TakerOrMaker {
  taker = 'Taker',
  maker = 'Maker',
}
export type OrderStatusResponse =
  | IMakerOrderStatusResponseWrapper
  | ITakerOrderStatusResponseWrapper
  | IOrderError;

export function isOrderError(data: OrderStatusResponse): data is IOrderError {
  return (data as IOrderError).error !== undefined;
}
interface IMakerOrderStatusResponseWrapper {
  order: IMakerOrderStatusResponse;
  type: TakerOrMaker.maker;
}
export interface IMakerOrderStatusResponse {
  available_amount: string;
  base: string;
  created_at: number; // timestamp
  matches: {
    [index: string]: {
      //this index is the same as the taker_order_uuid
      connect: {
        dest_pub_key: string;
        maker_order_uuid: string;
        method: string;
        sender_pubkey: string;
        taker_order_uuid: string;
      };
      connected: {
        dest_pub_key: string;
        maker_order_uuid: string;
        method: string;
        sender_pubkey: string;
        taker_order_uuid: string;
      };
      last_updated: number;
      request: {
        action: string;
        base: string;
        base_amount: string;
        dest_pub_key: string;
        method: string;
        rel: string;
        rel_amount: string;
        sender_pubkey: string;
        uuid: string; // this is the same as the taker_order_uuid
      };
      reserved: {
        base: string;
        base_amount: string;
        dest_pub_key: string;
        maker_order_uuid: string;
        method: string;
        rel: string;
        rel_amount: string;
        sender_pubkey: string;
        taker_order_uuid: string;
      };
    };
  };
  max_base_vol: string;
  max_base_vol_rat: [];
  min_base_vol: string;
  min_base_vol_rat: [];
  price: string;
  price_rat: [];
  rel: string;
  started_swaps: string[]; // this is the uuid of the taker_orders whose swaps have begun
  uuid: string;
}
interface ITakerOrderStatusResponseWrapper {
  order: ITakerOrderStatusResponse;
  type: TakerOrMaker.taker;
}
export interface ITakerOrderStatusResponse {
  available_amount: string;
  base: string;
  created_at: number; // timestamp
  matches: {
    [index: string]: {
      connect: {
        dest_pub_key: string;
        maker_order_uuid: string;
        method: string;
        sender_pubkey: string;
        taker_order_uuid: string;
      };
      connected: {
        dest_pub_key: string;
        maker_order_uuid: string;
        method: string;
        sender_pubkey: string;
        taker_order_uuid: string;
      };
      last_updated: number;

      reserved: {
        base: string;
        base_amount: string;
        dest_pub_key: string;
        maker_order_uuid: string;
        method: string;
        rel: string;
        rel_amount: string;
        sender_pubkey: string;
        taker_order_uuid: string;
      };
    };
  };
  request: {
    action: string;
    base: string;
    base_amount: string;
    dest_pub_key: string;
    method: string;
    rel: string;
    rel_amount: string;
    sender_pubkey: string;
    uuid: string;
  };
}
interface IOrderError {
  error: string; // no order found error
}
