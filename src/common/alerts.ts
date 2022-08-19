import { configAws } from '../common';
import { ServerToServerService } from '../services/server-to-server';

export class AlertService extends ServerToServerService {
  private roomName: string;
  constructor(roomName: string) {
    super();
    this.roomName = roomName;
  }

  public postMessage = async (message: string) => {
    const axios = this.getAxios({ role: 'system' });

    const result = await Promise.all(
      configAws.alertApiUrls.map(url =>
        axios.post<{ success: boolean }>(`${url}/alert`, {
          message,
          room: this.roomName,
        }),
      ),
    );

    return result.every(({ data: { success } }) => success);
  };
}
