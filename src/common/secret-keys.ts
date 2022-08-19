import configAws from './config-aws';
import { env } from './env';

class SecretKeys {
  public serviceAccounts: any;
  public serviceAccountKeys: any;

  constructor() {
    this.serviceAccounts = Object.entries(configAws.serviceAccounts).map(entry => {
      const [domain, serviceAccount]: any[] = entry;

      if (domain.includes(env.BLOCKFUNNELS_URL)) {
        serviceAccount.domain = env.APP_HOSTNAME;
      } else {
        serviceAccount.domain = domain;
      }

      return serviceAccount;
    });
    this.serviceAccountKeys = Object.entries(this.serviceAccounts).map(
      entry => {
        const [domain]: any[] = entry;
        return domain;
      },
    );
  }
}

const secretKeys = new SecretKeys();
export default secretKeys;
