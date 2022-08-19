export interface Secrets {
  getSecretValue(secretName: string): Promise<string | any>;
}
