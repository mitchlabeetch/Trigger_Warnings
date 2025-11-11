/**
 * Supabase client for backend communication
 * With comprehensive error handling, retry logic, and offline detection
 */
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@shared/constants/defaults';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds
export class SupabaseClient {
    static instance = null;
    static userId = null;
    static initializationPromise = null;
    /**
     * Initialize the Supabase client
     */
    static async initialize() {
        // Prevent multiple initialization attempts
        if (this.initializationPromise) {
            return this.initializationPromise;
        }
        if (this.instance)
            return;
        this.initializationPromise = (async () => {
            try {
                if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
                    throw new Error('Missing Supabase credentials');
                }
                this.instance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                    },
                });
                // Sign in anonymously
                await this.signInAnonymously();
                console.log('[TW Supabase] Initialized successfully');
            }
            catch (error) {
                console.error('[TW Supabase] Initialization failed:', error);
                this.initializationPromise = null;
                throw error;
            }
        })();
        return this.initializationPromise;
    }
    /**
     * Get or create the Supabase client instance
     */
    static async getInstance() {
        if (!this.instance) {
            await this.initialize();
        }
        return this.instance;
    }
    /**
     * Sign in anonymously with timeout
     */
    static async signInAnonymously() {
        if (!this.instance)
            return;
        try {
            // Add timeout to prevent hanging
            const signInPromise = this.instance.auth.signInAnonymously();
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Sign-in timeout after 10s')), 10000));
            const { data, error } = await Promise.race([signInPromise, timeoutPromise]);
            if (error) {
                console.error('[TW Supabase] Anonymous sign-in error:', error);
                return;
            }
            if (data?.user) {
                this.userId = data.user.id;
                console.log('[TW Supabase] Signed in anonymously:', this.userId);
            }
        }
        catch (error) {
            console.error('[TW Supabase] Error signing in:', error);
            // Extension continues to work without Supabase connection
        }
    }
    /**
     * Get the current user ID
     */
    static getUserId() {
        return this.userId || 'anonymous';
    }
    /**
     * Check if user is online
     */
    static checkOnlineStatus() {
        return typeof navigator !== 'undefined' ? navigator.onLine : true;
    }
    /**
     * Sleep for specified milliseconds
     */
    static sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Calculate exponential backoff delay
     */
    static getRetryDelay(attempt) {
        const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt), MAX_RETRY_DELAY);
        // Add jitter to prevent thundering herd
        return delay + Math.random() * 1000;
    }
    /**
     * Retry wrapper for database operations
     */
    static async withRetry(operation, operationName) {
        let lastError = null;
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            // Check online status before attempting
            if (!this.checkOnlineStatus()) {
                console.warn(`[TW Supabase] ${operationName}: Offline, skipping attempt ${attempt + 1}`);
                throw new Error('No internet connection');
            }
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                const errorMessage = error instanceof Error ? error.message : String(error);
                // Don't retry on certain errors
                if (this.isNonRetryableError(errorMessage)) {
                    console.error(`[TW Supabase] ${operationName}: Non-retryable error:`, errorMessage);
                    throw error;
                }
                // Don't retry on last attempt
                if (attempt === MAX_RETRIES) {
                    console.error(`[TW Supabase] ${operationName}: Max retries exceeded`);
                    break;
                }
                const delay = this.getRetryDelay(attempt);
                console.warn(`[TW Supabase] ${operationName}: Attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms...`, errorMessage);
                await this.sleep(delay);
            }
        }
        throw lastError || new Error(`${operationName} failed after ${MAX_RETRIES} retries`);
    }
    /**
     * Check if error should not be retried
     */
    static isNonRetryableError(errorMessage) {
        const nonRetryablePatterns = [
            'invalid',
            'unauthorized',
            'forbidden',
            'not found',
            'duplicate',
            'constraint',
            'validation',
        ];
        const lowerMessage = errorMessage.toLowerCase();
        return nonRetryablePatterns.some((pattern) => lowerMessage.includes(pattern));
    }
    /**
     * Fetch triggers for a specific video
     */
    static async getTriggers(videoId) {
        if (!videoId) {
            console.warn('[TW Supabase] getTriggers: Invalid video ID');
            return [];
        }
        try {
            return await this.withRetry(async () => {
                const client = await this.getInstance();
                const { data, error } = await client
                    .from('triggers')
                    .select('*')
                    .eq('video_id', videoId)
                    .eq('status', 'approved')
                    .order('start_time', { ascending: true });
                if (error) {
                    throw new Error(`Failed to fetch triggers: ${error.message}`);
                }
                // Transform database rows to Warning objects
                return (data || []).map((row) => ({
                    id: row.id,
                    videoId: row.video_id,
                    videoTitle: row.video_title || undefined,
                    categoryKey: row.category_key,
                    startTime: row.start_time,
                    endTime: row.end_time,
                    submittedBy: row.submitted_by,
                    status: row.status,
                    score: row.score || 0,
                    confidenceLevel: row.confidence_level || 0,
                    requiresModeration: row.status === 'pending', // Derive from status
                    description: row.description,
                    createdAt: new Date(row.created_at),
                    updatedAt: new Date(row.updated_at || row.created_at),
                    moderatedAt: row.moderated_at ? new Date(row.moderated_at) : undefined,
                    moderatedBy: row.moderated_by || undefined,
                }));
            }, 'getTriggers');
        }
        catch (error) {
            console.error('[TW Supabase] getTriggers failed:', error);
            // Return empty array on failure to not break the user experience
            return [];
        }
    }
    /**
     * Submit a new trigger
     */
    static async submitTrigger(submission) {
        // Validation
        if (!submission.videoId || !submission.categoryKey || !submission.platform) {
            console.error('[TW Supabase] submitTrigger: Invalid submission data');
            return false;
        }
        if (submission.startTime < 0 || submission.endTime <= submission.startTime) {
            console.error('[TW Supabase] submitTrigger: Invalid time range');
            return false;
        }
        try {
            await this.withRetry(async () => {
                const client = await this.getInstance();
                const userId = this.getUserId();
                const { error } = await client.from('triggers').insert({
                    video_id: submission.videoId,
                    platform: submission.platform,
                    category_key: submission.categoryKey,
                    start_time: submission.startTime,
                    end_time: submission.endTime,
                    description: submission.description || null,
                    submitted_by: userId,
                    status: 'pending',
                    score: 0,
                    confidence_level: submission.confidence || 75,
                });
                if (error) {
                    throw new Error(`Failed to submit trigger: ${error.message}`);
                }
                console.log('[TW Supabase] Trigger submitted successfully');
            }, 'submitTrigger');
            return true;
        }
        catch (error) {
            console.error('[TW Supabase] submitTrigger failed:', error);
            return false;
        }
    }
    /**
     * Vote on a trigger
     */
    static async voteTrigger(triggerId, voteType) {
        if (!triggerId || !voteType) {
            console.error('[TW Supabase] voteTrigger: Invalid parameters');
            return false;
        }
        try {
            await this.withRetry(async () => {
                const client = await this.getInstance();
                const userId = this.getUserId();
                // Insert or update vote
                const { error: upsertError } = await client
                    .from('trigger_votes')
                    .upsert({
                    trigger_id: triggerId,
                    user_id: userId,
                    vote_type: voteType,
                }, {
                    onConflict: 'trigger_id,user_id',
                });
                if (upsertError) {
                    throw new Error(`Failed to vote: ${upsertError.message}`);
                }
                console.log(`[TW Supabase] Vote ${voteType} recorded for trigger ${triggerId}`);
            }, 'voteTrigger');
            return true;
        }
        catch (error) {
            console.error('[TW Supabase] voteTrigger failed:', error);
            return false;
        }
    }
    /**
     * Check if user has already voted on a trigger
     */
    static async getUserVote(triggerId) {
        try {
            const client = await this.getInstance();
            const userId = this.getUserId();
            const { data, error } = await client
                .from('trigger_votes')
                .select('vote_type')
                .eq('trigger_id', triggerId)
                .eq('user_id', userId)
                .single();
            if (error || !data)
                return null;
            return data.vote_type;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Submit feedback
     */
    static async submitFeedback(message, name, email) {
        try {
            const client = await this.getInstance();
            const userId = this.getUserId();
            const { error } = await client.from('feedback').insert({
                name: name || null,
                email: email || null,
                message,
                submitted_by: userId,
            });
            if (error) {
                console.error('[TW Supabase] Error submitting feedback:', error);
                return false;
            }
            console.log('[TW Supabase] Feedback submitted successfully');
            return true;
        }
        catch (error) {
            console.error('[TW Supabase] Error in submitFeedback:', error);
            return false;
        }
    }
    /**
     * Get pending warnings for moderation
     */
    static async getPendingWarnings(limit = 50, offset = 0) {
        try {
            return await this.withRetry(async () => {
                const client = await this.getInstance();
                const { data, error } = await client
                    .from('triggers')
                    .select('*')
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false })
                    .range(offset, offset + limit - 1);
                if (error) {
                    throw new Error(`Failed to fetch pending warnings: ${error.message}`);
                }
                return (data || []).map((row) => ({
                    id: row.id,
                    videoId: row.video_id,
                    videoTitle: row.video_title || undefined,
                    categoryKey: row.category_key,
                    startTime: row.start_time,
                    endTime: row.end_time,
                    submittedBy: row.submitted_by,
                    status: row.status,
                    score: row.score || 0,
                    confidenceLevel: row.confidence_level || 0,
                    requiresModeration: row.status === 'pending', // Derive from status
                    description: row.description,
                    createdAt: new Date(row.created_at),
                    updatedAt: new Date(row.updated_at || row.created_at),
                    moderatedAt: row.moderated_at ? new Date(row.moderated_at) : undefined,
                    moderatedBy: row.moderated_by || undefined,
                }));
            }, 'getPendingWarnings');
        }
        catch (error) {
            console.error('[TW Supabase] getPendingWarnings failed:', error);
            return [];
        }
    }
    /**
     * Approve a warning
     */
    static async approveWarning(triggerId) {
        if (!triggerId) {
            console.error('[TW Supabase] approveWarning: Invalid trigger ID');
            return false;
        }
        try {
            await this.withRetry(async () => {
                const client = await this.getInstance();
                const { error } = await client
                    .from('triggers')
                    .update({
                    status: 'approved',
                    updated_at: new Date().toISOString(),
                })
                    .eq('id', triggerId);
                if (error) {
                    throw new Error(`Failed to approve warning: ${error.message}`);
                }
                console.log(`[TW Supabase] Warning ${triggerId} approved`);
            }, 'approveWarning');
            return true;
        }
        catch (error) {
            console.error('[TW Supabase] approveWarning failed:', error);
            return false;
        }
    }
    /**
     * Reject a warning
     */
    static async rejectWarning(triggerId) {
        if (!triggerId) {
            console.error('[TW Supabase] rejectWarning: Invalid trigger ID');
            return false;
        }
        try {
            await this.withRetry(async () => {
                const client = await this.getInstance();
                const { error } = await client
                    .from('triggers')
                    .update({
                    status: 'rejected',
                    updated_at: new Date().toISOString(),
                })
                    .eq('id', triggerId);
                if (error) {
                    throw new Error(`Failed to reject warning: ${error.message}`);
                }
                console.log(`[TW Supabase] Warning ${triggerId} rejected`);
            }, 'rejectWarning');
            return true;
        }
        catch (error) {
            console.error('[TW Supabase] rejectWarning failed:', error);
            return false;
        }
    }
    /**
     * Get warning statistics
     */
    static async getStatistics() {
        try {
            const client = await this.getInstance();
            // Get total count
            const { count: totalCount } = await client
                .from('triggers')
                .select('*', { count: 'exact', head: true });
            // Get by category
            const { data: categoryData } = await client
                .from('triggers')
                .select('category_key')
                .eq('status', 'approved');
            // Get by status
            const { data: statusData } = await client.from('triggers').select('status');
            const byCategory = {};
            categoryData?.forEach((row) => {
                byCategory[row.category_key] = (byCategory[row.category_key] || 0) + 1;
            });
            const byStatus = {};
            statusData?.forEach((row) => {
                byStatus[row.status] = (byStatus[row.status] || 0) + 1;
            });
            return {
                total: totalCount || 0,
                byCategory,
                byStatus,
            };
        }
        catch (error) {
            console.error('[TW Supabase] getStatistics failed:', error);
            return {
                total: 0,
                byCategory: {},
                byStatus: {},
            };
        }
    }
}
//# sourceMappingURL=SupabaseClient.js.map