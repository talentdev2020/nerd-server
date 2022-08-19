import { readFile } from 'fs';
import { promisify } from 'util';
import { Secrets } from '../../types/secret';

const readFileAsync = promisify(readFile);

class LocalSecrets implements Secrets {
  private secretData: { [key: string]: string } | undefined = undefined;

  public async getSecretValue(secretName: string) {
    const secretData = await this.getSecretData();

    if (!secretData) {
      return undefined;
    }

    return secretData[secretName];
  }

  private async getSecretData() {
    if (this.secretData) {
      return this.secretData;
    }
    
    const secretsFile = await readFileAsync(`secrets.json`, { encoding: 'utf8' });
    this.secretData = JSON.parse(secretsFile);

    return this.secretData;
  }
}

export const localSecrets = new LocalSecrets();
