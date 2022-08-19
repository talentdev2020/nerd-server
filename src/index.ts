import * as Sentry from '@sentry/node';
import config from './common/config';
import configAws from './common/config-aws';
import configSecrets from './common/config-secret';
import logger from './common/logger/logger';

Sentry.init({
  dsn: config.sentryDsn,
  environment: config.isProd ? 'production' : 'staging',
  attachStacktrace: true,
  initialScope: scope => {
    scope.setTag('brand', config.brand);
    return scope;
  },
  beforeSend: (event, hint) => {
    if (process.env.DEBUG) {
      console.error(hint.originalException || hint.syntheticException);
      return null;
    }
    return event;
  },
});

async function main() {
  try {
    await configAws.initialize()
    await configSecrets.initialize();
    const server = require('./server');
    await server.default.initialize();
  } catch (error) {
    const message = `Exception on index main: ${error.message}`;
    logger.exceptionContext(error, message, {});
  }
}

main();
