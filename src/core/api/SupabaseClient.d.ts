/**
 * Supabase client for backend communication
 * With comprehensive error handling, retry logic, and offline detection
 */
import type { Warning, WarningSubmission } from '@shared/types/Warning.types';
export declare class SupabaseClient {
    private static instance;
    private static userId;
    private static initializationPromise;
    private static supabaseAvailable;
    private static authenticationInProgress;
    /**
     * Initialize the Supabase client
     */
    static initialize(): Promise<void>;
    /**
     * Get or create the Supabase client instance
     */
    private static getInstance;
    /**
     * Sign in anonymously with timeout
     */
    private static signInAnonymously;
    /**
     * Get the current user ID
     * Returns null if user is not authenticated yet
     */
    static getUserId(): string | null;
    /**
     * Check if user is authenticated
     */
    static isAuthenticated(): boolean;
    /**
     * Check if user is online
     */
    private static checkOnlineStatus;
    /**
     * Sleep for specified milliseconds
     */
    private static sleep;
    /**
     * Calculate exponential backoff delay
     */
    private static getRetryDelay;
    /**
     * Retry wrapper for database operations
     */
    private static withRetry;
    /**
     * Check if error should not be retried
     */
    private static isNonRetryableError;
    /**
     * Fetch triggers for a specific video
     */
    static getTriggers(videoId: string): Promise<Warning[]>;
    /**
     * Submit a new trigger
     */
    static submitTrigger(submission: WarningSubmission): Promise<boolean>;
    /**
     * Vote on a trigger
     */
    static voteTrigger(triggerId: string, voteType: 'up' | 'down'): Promise<boolean>;
    /**
     * Check if user has already voted on a trigger
     */
    static getUserVote(triggerId: string): Promise<'up' | 'down' | null>;
    /**
     * Submit feedback
     */
    static submitFeedback(message: string, name?: string, email?: string): Promise<boolean>;
    /**
     * Get pending warnings for moderation
     */
    static getPendingWarnings(limit?: number, offset?: number): Promise<Warning[]>;
    /**
     * Approve a warning
     */
    static approveWarning(triggerId: string): Promise<boolean>;
    /**
     * Reject a warning
     */
    static rejectWarning(triggerId: string): Promise<boolean>;
    /**
     * Get warning statistics
     */
    static getStatistics(): Promise<{
        total: number;
        byCategory: Record<string, number>;
        byStatus: Record<string, number>;
    }>;
}
//# sourceMappingURL=SupabaseClient.d.ts.map