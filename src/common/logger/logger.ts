import * as Sentry from '@sentry/node';
import { v4 as randomString } from 'uuid';
import config from '../config';
import autoBind = require('auto-bind');
import { CaptureContext } from '@sentry/types';

export interface IKeyValues {
  [key: string]: string | number | boolean;
}
export class SentryLogger {
  meta: IKeyValues;

  constructor(initialMetadata: IKeyValues = {}) {
    autoBind(this);
    this.meta = initialMetadata;
  }

  startSession(userId?: string) {
    if (userId) {
      Sentry.addBreadcrumb({
        category: 'auth',
        message: 'Authenticated user ' + userId,
        level: Sentry.Severity.Info,
      });
      this.meta.userId = userId;
    }
    this.meta.session = randomString();
  }
  setModule(moduleName: string) {
    this.meta.module = moduleName;
  }

  setResolverType(resolverType: string) {
    this.meta.resolverType = resolverType;
  }

  setResolverName(resolverName: string) {
    this.meta.resolverName = resolverName;
  }

  fatal(message: string) {
    Sentry.captureMessage(message, Sentry.Severity.Fatal);
  }
  fatalContext(message: string, vals: IKeyValues) {
    Sentry.captureMessage(message, {
      level: Sentry.Severity.Fatal,
      tags: vals,
    });
  }

  critical(message: string) {
    Sentry.captureMessage(message, Sentry.Severity.Critical);
  }
  criticalContext(message: string, vals: IKeyValues) {
    Sentry.captureMessage(message, {
      level: Sentry.Severity.Critical,
      tags: vals,
    });
  }

  error(message: string) {
    Sentry.captureMessage(message, Sentry.Severity.Error);
  }

  errorContext(message: string, vals: IKeyValues) {
    Sentry.captureMessage(message, {
      level: Sentry.Severity.Error,
      tags: vals,
    });
  }

  warnContext(message: string, vals: IKeyValues) {
    Sentry.captureMessage(message, {
      level: Sentry.Severity.Warning,
      tags: vals,
    });
  }

  warn(message: string) {
    Sentry.captureMessage(message, Sentry.Severity.Warning);
  }

  info(message: string) {
    if (!config.isProd) {
      Sentry.captureMessage(message, Sentry.Severity.Info);
    }
  }

  debugContext(message: string, vals: IKeyValues) {
    if (!config.isProd) {
      Sentry.captureMessage(message, {
        level: Sentry.Severity.Debug,
        tags: vals,
      });
    }
  }

  debug(message: string) {
    if (!config.isProd) {
      Sentry.captureMessage(message, Sentry.Severity.Debug);
    }
  }

  exceptionContext(err: any, message: string, vals: IKeyValues = {}) {
    vals['message'] = message;
    const ctx: CaptureContext = {
      tags: vals,
    };

    Sentry.captureException(err, ctx);
  }

  exception(err: any, context?: CaptureContext) {
    Sentry.captureException(err, context);
  }

  logKeyValues(
    keyValues: IKeyValues,
    loggingFunction: (message: string) => void,
  ) {
    if (typeof keyValues !== 'object') {
      this.error(`${keyValues} is not an object`);
    }
    Object.entries(keyValues).forEach(([key, value]) => {
      loggingFunction(`${key}: ${value}`);
    });
  }

  get obj() {
    return {
      fatal: (keyValPair: IKeyValues) => {
        this.logKeyValues(keyValPair, this.fatal);
      },
      critical: (keyValPair: IKeyValues) => {
        this.logKeyValues(keyValPair, this.critical);
      },
      error: (keyValPair: IKeyValues) => {
        this.logKeyValues(keyValPair, this.error);
      },
      warn: (keyValPair: IKeyValues) => {
        this.logKeyValues(keyValPair, this.warn);
      },
      info: (keyValPair: IKeyValues) => {
        if (!config.isProd) {
          this.logKeyValues(keyValPair, this.info);
        }
      },
      debug: (keyValPair: IKeyValues) => {
        if (!config.isProd) {
          this.logKeyValues(keyValPair, this.debug);
        }
      },
    };
  }

  get JSON() {
    return {
      error: (keyValPair: Object) => {
        this.error(JSON.stringify(keyValPair));
      },
      warn: (keyValPair: Object) => {
        this.warn(JSON.stringify(keyValPair));
      },
      info: (keyValPair: Object) => {
        this.info(JSON.stringify(keyValPair));
      },
      debug: (keyValPair: Object) => {
        this.debug(JSON.stringify(keyValPair));
      },
      debugContext: (
        keyValPair: Object,
        message: string,
        vals: IKeyValues = {},
      ) => {
        vals['message'] = message;
        this.debugContext(JSON.stringify(keyValPair), vals);
      },
      critical: (keyValPair: Object) => {
        this.critical(JSON.stringify(keyValPair));
      },
      fatal: (keyValPair: Object) => {
        this.fatal(JSON.stringify(keyValPair));
      },
    };
  }
}

const log: SentryLogger = new SentryLogger();
export default log;
