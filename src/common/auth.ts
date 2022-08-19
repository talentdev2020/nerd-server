import secretKeys from 'src/common/secret-keys';
import { ServerAuth } from '@blockbrothers/firebasebb';
import { config } from 'src/common';

export default new ServerAuth(
  {
    serviceAccounts: secretKeys.serviceAccounts,
    mongoDbInfo: {
      connectionString: config.mongodbUri,
      domain: config.hostname,
    },
    sentryDsn: config.sentryDsn,
  },
  config.brand === 'gala' ? 'id' : 'custom',
);
