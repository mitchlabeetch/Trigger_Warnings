/**
 * Logging utility for consistent console output
 */
export declare class Logger {
    private context;
    constructor(context: string);
    private log;
    debug(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
}
export declare const logger: Logger;
export declare const createLogger: (context: string) => Logger;
//# sourceMappingURL=Logger.d.ts.map