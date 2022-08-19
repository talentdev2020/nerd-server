export enum OrderStatus {
  converting = 'CONVERTING',
  complete = 'COMPLETE',
  failed = 'FAILED',
  waiting = 'WAITING',
}

export interface IOrderStatus {
  orderId: string;
  status: OrderStatus;
  bought?: string;
  sold?: string;
  price?: number;
  quantity?: number;
}
