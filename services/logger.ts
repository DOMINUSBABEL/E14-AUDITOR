/**
 * Application Logger Service
 * Centralizes logging to allow for future enhancements.
 */
class Logger {
  info(...args: any[]) {
    console.info(...args);
  }

  warn(...args: any[]) {
    console.warn(...args);
  }

  error(...args: any[]) {
    console.error(...args);
  }

  debug(...args: any[]) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(...args);
    }
  }
}

export const logger = new Logger();
