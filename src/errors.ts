import { logger } from './common';

class ErrorHander {
  handleError = async (error: Error) => {
    try {
      logger.exceptionContext(
        error,
        'Uncaught exception. Caught on application.',
        {},
      );
    } catch (er) {
      const message = `Unable to log catch-all logging. Bubbling to kill process. Including ErrorUncaught ----${error.message} , and FailureToLogError ----${er.message} `;
      logger.exceptionContext(er, message, {});
    }
  };

  isTrustedError = async (error: Error) => {
    //TODO : mechanism to establish error severity
    return true;
  };
}

export default new ErrorHander();
