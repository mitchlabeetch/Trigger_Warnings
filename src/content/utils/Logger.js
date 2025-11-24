/**
 * Logging utility for consistent console output
 */
const LOG_PREFIX = '[TW]';
const ENABLE_DEBUG = true; // Set to false in production
export class Logger {
    context;
    constructor(context) {
        this.context = context;
    }
    log(level, ...args) {
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
    debug(...args) {
        this.log('debug', ...args);
    }
    info(...args) {
        this.log('info', ...args);
    }
    warn(...args) {
        this.log('warn', ...args);
    }
    error(...args) {
        this.log('error', ...args);
    }
}
// Create default logger instance
export const logger = new Logger('Global');
export const createLogger = (context) => new Logger(context);
//# sourceMappingURL=Logger.js.map