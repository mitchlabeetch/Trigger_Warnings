/**
 * Supabase client for backend communication
 */
import type { Warning, WarningSubmission } from '@shared/types/Warning.types';
export declare class SupabaseClient {
    private static instance;
    private static userId;
    /**
     * Initialize the Supabase client
     */
    static initialize(): Promise<void>;
    /**
     * Get or create the Supabase client instance
     */
    private static getInstance;
    /**
     * Sign in anonymously
     */
    private static signInAnonymously;
    /**
     * Get the current user ID
     */
    static getUserId(): string;
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
}
//# sourceMappingURL=SupabaseClient.d.ts.map