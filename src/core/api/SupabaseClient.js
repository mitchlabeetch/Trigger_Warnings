/**
 * Supabase client for backend communication
 */
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@shared/constants/defaults';
export class SupabaseClient {
    static instance = null;
    static userId = null;
    /**
     * Initialize the Supabase client
     */
    static async initialize() {
        if (this.instance)
            return;
        this.instance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        // Sign in anonymously
        await this.signInAnonymously();
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
     * Sign in anonymously
     */
    static async signInAnonymously() {
        if (!this.instance)
            return;
        try {
            const { data, error } = await this.instance.auth.signInAnonymously();
            if (error) {
                console.error('[TW Supabase] Anonymous sign-in error:', error);
                return;
            }
            if (data.user) {
                this.userId = data.user.id;
                console.log('[TW Supabase] Signed in anonymously:', this.userId);
            }
        }
        catch (error) {
            console.error('[TW Supabase] Error signing in:', error);
        }
    }
    /**
     * Get the current user ID
     */
    static getUserId() {
        return this.userId || 'anonymous';
    }
    /**
     * Fetch triggers for a specific video
     */
    static async getTriggers(videoId) {
        try {
            const client = await this.getInstance();
            const { data, error } = await client
                .from('triggers')
                .select('*')
                .eq('video_id', videoId)
                .eq('status', 'approved')
                .order('start_time', { ascending: true });
            if (error) {
                console.error('[TW Supabase] Error fetching triggers:', error);
                return [];
            }
            // Transform database rows to Warning objects
            return (data || []).map((row) => ({
                id: row.id,
                videoId: row.video_id,
                categoryKey: row.category_key,
                startTime: row.start_time,
                endTime: row.end_time,
                submittedBy: row.submitted_by,
                status: row.status,
                score: row.score || 0,
                confidenceLevel: row.confidence_level || 0,
                requiresModeration: row.requires_moderation || false,
                description: row.description,
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at || row.created_at),
            }));
        }
        catch (error) {
            console.error('[TW Supabase] Error in getTriggers:', error);
            return [];
        }
    }
    /**
     * Submit a new trigger
     */
    static async submitTrigger(submission) {
        try {
            const client = await this.getInstance();
            const userId = this.getUserId();
            const { error } = await client.from('triggers').insert({
                video_id: submission.videoId,
                category_key: submission.categoryKey,
                start_time: submission.startTime,
                end_time: submission.endTime,
                description: submission.description,
                submitted_by: userId,
                status: 'pending',
                score: 0,
                confidence_level: submission.confidence || 50,
                requires_moderation: true,
            });
            if (error) {
                console.error('[TW Supabase] Error submitting trigger:', error);
                return false;
            }
            console.log('[TW Supabase] Trigger submitted successfully');
            return true;
        }
        catch (error) {
            console.error('[TW Supabase] Error in submitTrigger:', error);
            return false;
        }
    }
    /**
     * Vote on a trigger
     */
    static async voteTrigger(triggerId, voteType) {
        try {
            const client = await this.getInstance();
            const userId = this.getUserId();
            // Call the stored procedure to handle voting
            const { error } = await client.rpc('handle_vote', {
                trigger_id_in: triggerId,
                user_id_in: userId,
                vote_type_in: voteType,
            });
            if (error) {
                console.error('[TW Supabase] Error voting on trigger:', error);
                return false;
            }
            console.log(`[TW Supabase] Vote ${voteType} recorded for trigger ${triggerId}`);
            return true;
        }
        catch (error) {
            console.error('[TW Supabase] Error in voteTrigger:', error);
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
                .from('votes')
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
}
//# sourceMappingURL=SupabaseClient.js.map