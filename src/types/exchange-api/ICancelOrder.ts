export interface ICancelOrderRequest {
  uuid: string; // the uuid of the order the user desires to cancel
}

export type CancelResponse = ICancelOrderError | ICancelOrderResponse;
export interface ICancelOrderResponse {
  result: string; // indicates the status of operation
}
export interface ICancelOrderError {
  error: string;
}
export function isCancelOrderError(
  data: ICancelOrderResponse | ICancelOrderError,
): data is ICancelOrderError {
  return (data as ICancelOrderError).error !== undefined;
}
