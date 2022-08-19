import { Injectable } from '@nestjs/common';
import {
  ClientProxyFactory,
  Transport,
  ClientProxy,
} from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { config, configAws, logger, ResolverBase } from 'src/common';
import { Context } from 'src/types/context';
import { ITimeStats } from 'src/types';

@Injectable()
class Resolvers extends ResolverBase {
  private client: ClientProxy;

  constructor() {
    super();
  }

  initialize = async () => {
    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: configAws.recordsMicroservice.host,
        port: configAws.recordsMicroservice.port,
      },
    });
  }

  checkIn = async (
    parent: any,
    args: {
      domain: string;
      hardwareId: string;
      minerIsActive: boolean;
      userId: string;
    },
    ctx: Context,
  ) => {
    try {
      const res = await firstValueFrom(
        this.client.send<ITimeStats>('check_in', args),
      );

      return res;
    } catch (error) {
      logger.warn(`resolvers.records.checkIn.catch:${error}`);
      return { error: error };
    }
  };
}

const resolvers = new Resolvers();

export default {
  Query: {
    checkIn: resolvers.checkIn,
  },
};
