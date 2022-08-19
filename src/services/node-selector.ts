//import { config } from '../common';
import { ServerToServerService } from './server-to-server';

interface SignatureResponse {
  transactionHash: string;
  userId: string;
  licenseId: string;
  machineId: string;
  address: string;
}

class NodeSelector extends ServerToServerService {
  baseUrl = '';
  //baseUrl = `${config.nodeSelectorUrl}`;

  public assignNodeToMineTransaction = async (transactionHash: string) => {
    const jwtAxios = this.getAxios({ role: 'system' });

    const { data } = await jwtAxios.post<SignatureResponse>(
      `${this.baseUrl}/node`,
      { transactionHash },
    );

    return data;
  };
}

export const nodeSelector = new NodeSelector();
export default nodeSelector;
