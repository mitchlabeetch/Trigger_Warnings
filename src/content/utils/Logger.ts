/**
 * Logging utility for consistent console output
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_PREFIX = '[TW]';
const ENABLE_DEBUG = true; // Set to false in production

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private log(level: LogLevel, ...args: any[]): void {
    const prefix = `${LOG_PREFIX} [${this.context}]`;

    switch (level) {
      case 'debug':
        if (ENABLE_DEBUG) {
          console.log(prefix, ...args);
        }
        break;
      case 'info':
        console.log(prefix, ...args);
        break;
      case 'warn':
        console.warn(prefix, ...args);
        break;
      case 'error':
        console.error(prefix, ...args);
        break;
    }
  }

  debug(...args: any[]): void {
    this.log('debug', ...args);
  }

  info(...args: any[]): void {
    this.log('info', ...args);
  }

  warn(...args: any[]): void {
    this.log('warn', ...args);
  }

  error(...args: any[]): void {
    this.log('error', ...args);
  }
}

// Create default logger instance
export const logger = new Logger('Global');
export const createLogger = (context: string): Logger => new Logger(context);
