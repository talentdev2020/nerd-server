import { config, configAws } from '../common';
import { ServerToServerService } from './server-to-server';

class GalaGamingApiService extends ServerToServerService {
  baseUrl = `${configAws.galaGamingApiUrl}/api`;

  public getGameJWT = async (userId: string) => {
    const jwtAxios = this.getAxios({ role: 'system' });

    const { data } = await jwtAxios.get(`${this.baseUrl}/token/${userId}`);

    return data.token;
  };
}

export default new GalaGamingApiService();
