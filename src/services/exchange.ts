import { config, configAws } from '../common';
import { ServerToServerService } from './server-to-server';
import { AxiosResponse } from 'axios';
import {
  OrderStatus,
  IOrderStatus,
  IExchangeResponse,
  IBalanceResponse,
  IBalanceRequest,
  IBuyRequest,
  IBuyResponse,
  ICancelOrderRequest,
  IGetFeeResponse,
  IOrderbookRequest,
  IOrderbookResponse,
  ISellRequest,
  ISellResponse,
  ISwapStatusResponse,
  ExchangeEvent,
  SwapEvents,
  IMyOrdersResponse,
  TakerOrMaker,
  OrderStatusResponse,
  isOrderError,
  CancelResponse,
  isCancelOrderError,
  IMarketsResponse,
  ITicksResponse,
  IGetPrice,
  IGetPriceResponse,
  IItemQueryInput,
  IMySwapHistory,
  IGetHistorySummaryResponse,
} from '../types';

interface IAuthInfo {
  walletPassword: string;
  userId: string;
}

class ExchangeService extends ServerToServerService {

  public balance = async ({
    userId,
    coin,
    walletPassword,
    tokenId,
    rel,
    walletAddress,
  }: IAuthInfo & IBalanceRequest) => {
    const baseUrl = `${configAws.exchangeUrl}`;
    const pubUrl = `${baseUrl}/pub`;
    const authUrl = `${baseUrl}/auth`;

    const jwtAxios = this.getAxios({ userId, walletPassword });
    const { data } = await jwtAxios.post<any, AxiosResponse<IBalanceResponse>>(
      `${authUrl}/get-balance`,
      { userId, walletPassword, coin, tokenId, rel, walletAddress },
    );
    return data;
  };

  public buy = async ({
    userId,
    walletPassword,
    base,
    rel,
    quantityBase,
    quantityRel,
    price,
    tokenId,
  }: IBuyRequest & IAuthInfo) => {
    const baseUrl = `${configAws.exchangeUrl}`;
    const pubUrl = `${baseUrl}/pub`;
    const authUrl = `${baseUrl}/auth`;

    const jwtAxios = this.getAxios({ userId, walletPassword });
    const { data } = await jwtAxios.post<any, AxiosResponse<IBuyResponse>>(
      `${authUrl}/buy`,
      {
        base,
        rel,
        quantityBase,
        quantityRel,
        price,
        userId,
        walletPassword,
        tokenId,
      },
    );
    // if (isBuyError(data)) {
    //   throw data.error;
    // }
    return data;
  };

  public cancel = async ({
    walletPassword,
    userId,
    uuid,
  }: ICancelOrderRequest & IAuthInfo) => {
    const baseUrl = `${configAws.exchangeUrl}`;
    const pubUrl = `${baseUrl}/pub`;
    const authUrl = `${baseUrl}/auth`;

    const jwtAxios = this.getAxios({ userId, walletPassword });
    const { data } = await jwtAxios.post<any, AxiosResponse<CancelResponse>>(
      `${authUrl}/my-orders/cancel`,
      { uuid, userId, walletPassword },
    );
    if (isCancelOrderError(data)) {
      throw data.error;
    }
    return data;
  };
  public getMarkets = async () => {
    const baseUrl = `${configAws.exchangeUrl}`;
    const pubUrl = `${baseUrl}/pub`;
    const authUrl = `${baseUrl}/auth`;
    const jwtAxios = this.getAxios({});

    const { data } = await jwtAxios.get<any, AxiosResponse<IMarketsResponse>>(
      `${pubUrl}/markets`,
    );

    return data;
  };
  public getTicks = async () => {
    const baseUrl = `${configAws.exchangeUrl}`;
    const pubUrl = `${baseUrl}/pub`;
    const authUrl = `${baseUrl}/auth`;
    const jwtAxios = this.getAxios({});
    const { data } = await jwtAxios.get<any, AxiosResponse<ITicksResponse>>(
      `${pubUrl}/ticks`,
    );

    return data;
  };
  public getFee = async ({ coin }: { coin: string }) => {
    const baseUrl = `${configAws.exchangeUrl}`;
    const pubUrl = `${baseUrl}/pub`;
    const authUrl = `${baseUrl}/auth`;
    const jwtAxios = this.getAxios({});
    const { data } = await jwtAxios.get<any, AxiosResponse<IGetFeeResponse[]>>(
      `${pubUrl}/get-fees/${coin}`,
    );
    return data;
  };

  public getOrderbook = async ({ base, rel, tokenId }: IOrderbookRequest) => {
    const baseUrl = `${configAws.exchangeUrl}`;
    const pubUrl = `${baseUrl}/pub`;
    const authUrl = `${baseUrl}/auth`;

    const jwtAxios = this.getAxios({});
    const { data } = await jwtAxios.post<
      any,
      AxiosResponse<IOrderbookResponse>
    >(`${pubUrl}/order-book/all`, { base, rel, tokenId });
    return data;
  };
  public getPrice = async ({
    base,
    tokenId,
    rel,
    quantityBase,
    quantityRel,
    buyOrSell,
  }: IGetPrice) => {
    const baseUrl = `${configAws.exchangeUrl}`;
    const pubUrl = `${baseUrl}/pub`;
    const authUrl = `${baseUrl}/auth`;

    const jwtAxios = this.getAxios({});
    const { data } = await jwtAxios.post<any, AxiosResponse<IGetPriceResponse>>(
      `${pubUrl}/get-price`,
      {
        base,
        rel,
        tokenId,
        quantityBase,
        quantityRel,
        buyOrSell,
      },
    );
    return data;
  };
  public getOrderbookByNft = async ({
    base,
    rel,
    nftBaseId,
  }: IOrderbookRequest & { nftBaseId: string }) => {
    const baseUrl = `${configAws.exchangeUrl}`;
    const pubUrl = `${baseUrl}/pub`;
    const authUrl = `${baseUrl}/auth`;

    const jwtAxios = this.getAxios({});
    const { data } = await jwtAxios.post<
      any,
      AxiosResponse<IOrderbookResponse>
    >(`${pubUrl}/order-book/by-nft`, { base, rel, nftBaseId });
    return data;
  };
  public sell = async ({
    userId,
    walletPassword,
    base,
    rel,
    price,
    quantityBase,
    quantityRel,
    tokenId,
  }: ISellRequest & IAuthInfo) => {
    const baseUrl = `${configAws.exchangeUrl}`;
    const pubUrl = `${baseUrl}/pub`;
    const authUrl = `${baseUrl}/auth`;

    const jwtAxios = this.getAxios({ userId, walletPassword });
    const { data } = await jwtAxios.post<any, AxiosResponse<ISellResponse>>(
      `${authUrl}/sell`,
      {
        base,
        rel,
        quantityBase,
        quantityRel,
        tokenId,
        price,
        userId,
        walletPassword,
      },
    );
    // if (isSellError(data)) {
    //   throw data.error;
    // }
    return data;
  };
  public getMyOrders = async ({
    userId,
    base,
    rel,
    tokenId,
  }: {
    userId: string;
    base?: string;
    rel?: string;
    tokenId?: string;
  }) => {
    const baseUrl = `${configAws.exchangeUrl}`;
    const pubUrl = `${baseUrl}/pub`;
    const authUrl = `${baseUrl}/auth`;

    const jwtAxios = this.getAxios({});
    const {
      data: { result },
    } = await jwtAxios.post<
      any,
      AxiosResponse<IExchangeResponse<IMyOrdersResponse>>
    >(`${authUrl}/my-orders/open`, { userId, base, rel, tokenId });
    return result;
  };
  public getMyOrdersByNftBaseId = async ({
    userId,
    base,
    rel,
    nftBaseId,
  }: {
    userId: string;
    base: string;
    rel: string;
    nftBaseId: string;
  }) => {
    const baseUrl = `${configAws.exchangeUrl}`;
    const pubUrl = `${baseUrl}/pub`;
    const authUrl = `${baseUrl}/auth`;


    const jwtAxios = this.getAxios({ userId });
    const {
      data: { result },
    } = await jwtAxios.post<
      any,
      AxiosResponse<IExchangeResponse<IMyOrdersResponse>>
    >(`${authUrl}/my-orders/by-nft`, { userId, base, rel, nftBaseId });
    return result;
  };
  getClosedOrders = async ({
    userId,
    base,
    rel,
    tokenId,
  }: {
    userId: string;
    base?: string;
    rel?: string;
    tokenId?: string;
  }) => {
    const baseUrl = `${configAws.exchangeUrl}`;
    const pubUrl = `${baseUrl}/pub`;
    const authUrl = `${baseUrl}/auth`;


    const jwtAxios = this.getAxios({ userId });
    const { data } = await jwtAxios.post<any, AxiosResponse<IMySwapHistory>>(
      `${authUrl}/my-orders/closed`,
      { userId, base, rel, tokenId },
    );
    return data;
  };
  getOpenOrders = async ({
    userId,
    base,
    rel,
    tokenId,
  }: {
    userId: string;
    base: string;
    rel: string;
    tokenId: string;
  }) => {
    const baseUrl = `${configAws.exchangeUrl}`;
    const pubUrl = `${baseUrl}/pub`;
    const authUrl = `${baseUrl}/auth`;


    const jwtAxios = this.getAxios({ userId });
    const { data } = await jwtAxios.post<any, AxiosResponse<IMySwapHistory>>(
      `${authUrl}/my-orders/open`,
      { userId, base, rel, tokenId },
    );
    return data;
  };
  public getOrderStatus = async ({
    userId,
    uuid,
  }: {
    userId: string;
    uuid: string;
  }) => {
    const baseUrl = `${configAws.exchangeUrl}`;
    const pubUrl = `${baseUrl}/pub`;
    const authUrl = `${baseUrl}/auth`;


    const jwtAxios = this.getAxios({ userId });
    const { data } = await jwtAxios.post<
      any,
      AxiosResponse<OrderStatusResponse>
    >(`${authUrl}/my-orders/detail`, { userId, uuid });
    if (isOrderError(data)) {
      throw data.error;
    }
    return data;
  };
  public getItems = async (itemQuery: IItemQueryInput) => {
    const baseUrl = `${configAws.exchangeUrl}`;
    const pubUrl = `${baseUrl}/pub`;

    const jwtAxios = this.getAxios({});
    const { data } = await jwtAxios.post<
      any,
      AxiosResponse<IOrderbookResponse>
    >(`${pubUrl}/order-book/all`, itemQuery);

    return data;
  };
  public getHistory = async () => {
    const baseUrl = `${configAws.exchangeUrl}`;
    const pubUrl = `${baseUrl}/pub`;
    const authUrl = `${baseUrl}/auth`;


    const jwtAxios = this.getAxios({});
    const { data } = await jwtAxios.get<any, AxiosResponse<IOrderbookResponse>>(
      `${pubUrl}/history`,
    );

    return data;
  };
  // public getSold = async ({userId}:{userId:string}) => {
  //   const jwtAxios = this.getAxios({});
  //   const { data } = await jwtAxios.get<any, AxiosResponse<IOrderbookResponse>>(
  //     `${this.authUrl}/history`,
  //   );

  //   return data;
  // }
  public getHistorySummary = async ({
    base,
    rel,
    nftBaseId,
    since,
  }: {
    base: string;
    rel: string;
    nftBaseId: string;
    since?: Date;
  }) => {
    const baseUrl = `${configAws.exchangeUrl}`;
    const pubUrl = `${baseUrl}/pub`;
    const authUrl = `${baseUrl}/auth`;


    const jwtAxios = this.getAxios({});
    const { data } = await jwtAxios.post<
      any,
      AxiosResponse<IGetHistorySummaryResponse>
    >(`${pubUrl}/history/summary`, { base, rel, nftBaseId, since });

    return data;
  };
  public extractOrderStatusFromSwapEvents = (swaps: ISwapStatusResponse[]) => {
    return swaps.map(swap => {
      const status = this.extractSwapStatusFromSwapEvents(swap);
      return {
        orderId: swap.uuid,
        status,
        bought: swap?.my_info?.other_coin,
        sold: swap?.my_info?.my_coin,
      };
    });
  };
  public extractSwapStatusFromSwapEvents = (swap: ISwapStatusResponse) => {
    return swap.events.reduce((accum, curr) => {
      if (accum === OrderStatus.failed) {
        return accum;
      }
      const eventStatus = this.determineOrderStatusFromSwapEvent(curr);
      if (eventStatus !== OrderStatus.converting) {
        return eventStatus;
      }
      return accum;
    }, OrderStatus.converting);
  };
  public determineOrderStatusFromSwapEvent = (event: ExchangeEvent) => {
    switch (event.type) {
      case SwapEvents.startFailed:
      case SwapEvents.negotiateFailed:
      case SwapEvents.takerFeeValidateFailed:
      case SwapEvents.makerPaymentTransactionFailed:
      case SwapEvents.makerPaymentDataSendFailed:
      case SwapEvents.makerPaymentWaitConfirmFailed:
      case SwapEvents.takerPaymentValidateFailed:
      case SwapEvents.takerPaymentWaitConfirmFailed:
      case SwapEvents.takerPaymentSpendFailed:
      case SwapEvents.makerPaymentRefundFailed:
      case SwapEvents.takerFeeSendFailed:
      case SwapEvents.makerPaymentValidateFailed:
      case SwapEvents.takerPaymentTransactionFailed:
      case SwapEvents.takerPaymentDataSendFailed:
      case SwapEvents.takerPaymentWaitForSpendFailed:
      case SwapEvents.makerPaymentSpendFailed:
      case SwapEvents.takerPaymentRefundFailed:
        return OrderStatus.failed;
      case SwapEvents.finished:
        return OrderStatus.complete;
      default:
        return OrderStatus.converting;
    }
  };
  public extractOrderInfoFromMyOrder = (
    orderStatusResponse: OrderStatusResponse,
  ): IOrderStatus => {
    if (isOrderError(orderStatusResponse)) {
      throw orderStatusResponse.error;
    }
    if (orderStatusResponse.type === TakerOrMaker.taker) {
      return {
        orderId: orderStatusResponse.order.request.uuid,
        status: OrderStatus.converting,
      };
    } else {
      return {
        orderId: orderStatusResponse.order.uuid,
        status: OrderStatus.converting,
      };
    }
  };
}
export const exchangeService = new ExchangeService();
