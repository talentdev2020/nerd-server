import { Request } from 'express';
import { DataSources, Context } from 'src/types';
import { UserApi } from 'src/data-sources';

export default function create(
  req: Request,
  dataSources: DataSources,
  userApi: UserApi = undefined,
): Context {
  const context: Partial<Context> = {
    req: req,
    dataSources: dataSources,
    user: userApi,
  };

  return context as Context;
}
