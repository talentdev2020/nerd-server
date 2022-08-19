import { configAws, logger } from '../common';
import { ServerToServerService } from './server-to-server';

class SimplexEventsService extends ServerToServerService {
  baseUrl = `${configAws.simplexEventsServiceUrl}`;

  saveEvents = async (userId: string) => {
    try {
      const jwtAxios = this.getAxios({ userId });
      const { data } = await jwtAxios.post(`${this.baseUrl}/events/save`);
      logger.debug(
        `services.simplex-events.saveEvents.data: ${JSON.stringify(data)}`,
      );
      return data;
    } catch (error) {
      logger.warn(`services.simplex-events.saveEvents.catch: ${error}`);
      return { success: false };
    }
  };
}

export const simplexEventsService = new SimplexEventsService();
