import { awsSecrets } from './aws-secrets';
import { localSecrets } from './local-secrets';
import { Secrets } from '../../types/secret';

class SecretsFactory {
  public getSecretInstance(): Secrets {
    if (process.env.LOCAL_SECRETS && process.env.LOCAL_SECRETS.toLowerCase() === 'true') {
      return localSecrets;
    }

    return awsSecrets;
  }
}

export const secretsFactory = new SecretsFactory();
