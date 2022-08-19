export interface ICustomGraphQLError {
  message: string;
  code: String;
  stack?: String;
}



export function isICustomGraphQLError(
  data: ICustomGraphQLError | any,
): data is ICustomGraphQLError {
  const error = data as ICustomGraphQLError;
  if (typeof error?.code === 'string' && typeof error?.message === 'string')
    return true;
  return false;
}