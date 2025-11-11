/**
 * WARNING DEDUPLICATOR
 *
 * Intelligent deduplication system to prevent warning spam
 *
 * Problem: Multiple detection systems can trigger the same warning
 * - Subtitle says "[gunshot]" (85% confidence)
 * - Audio detects gunshot sound (90% confidence)
 * - Audio frequency detects high-energy transient (80% confidence)
 * - Visual shows muzzle flash (75% confidence)
 * → Without deduplication: User sees 4 warnings in 2 seconds (SPAM!)
 * → With deduplication: User sees 1 consolidated warning (98% confidence)
 *
 * Features:
 * - Temporal grouping (warnings within 2-second window)
 * - Cross-system deduplication (combine multi-source detections)
 * - Priority-based selection (keep highest confidence)
 * - Intelligent merging (aggregate descriptions)
 * - Rate limiting (prevent category spam)
 * - Smart display logic (configurable strategies)
 *
 * Created by: Claude Code (Legendary Session - Phase 6A)
 * Date: 2024-11-11
 */
import type { Warning } from '@shared/types/Warning.types';
export type DeduplicationStrategy = 'merge-all' | 'keep-highest' | 'suppress-duplicates' | 'show-all';
export interface DeduplicationConfig {
    strategy: DeduplicationStrategy;
    temporalWindow: number;
    categoryRateLimit: number;
    enableSmartMerging: boolean;
    minimumTimeBetweenSameCategory: number;
}
export declare class WarningDeduplicator {
    private config;
    private activeGroups;
    private processedWarningIds;
    private categoryRateLimits;
    private outputWarnings;
    private stats;
    constructor(config?: Partial<DeduplicationConfig>);
    /**
     * Process incoming warning (may be filtered, merged, or passed through)
     */
    processWarning(warning: Warning): Warning | null;
    /**
     * Check if warning is rate limited
     */
    private isRateLimited;
    /**
     * Check if warning is too soon after last warning of same category
     */
    private isTooSoonForCategory;
    /**
     * Update rate limit tracking
     */
    private updateRateLimit;
    /**
     * Find existing group or create new one
     */
    private findOrCreateGroup;
    /**
     * Get group key for warning
     */
    private getGroupKey;
    /**
     * Add warning to group
     */
    private addToGroup;
    /**
     * Extract source from warning
     */
    private extractSource;
    /**
     * Process group based on strategy
     */
    private processGroup;
    /**
     * Merge all warnings in group into one consolidated warning
     */
    private mergeWarnings;
    /**
     * Merge descriptions intelligently
     */
    private mergeDescriptions;
    /**
     * Keep only highest confidence warning
     */
    private keepHighestConfidence;
    /**
     * Clean old groups outside temporal window
     */
    private cleanOldGroups;
    /**
     * Get all output warnings (after deduplication)
     */
    getOutputWarnings(): Warning[];
    /**
     * Get statistics
     */
    getStats(): typeof this.stats & {
        activeGroups: number;
        deduplicationRate: number;
    };
    /**
     * Update configuration
     */
    updateConfig(config: Partial<DeduplicationConfig>): void;
    /**
     * Clear state
     */
    clear(): void;
    /**
     * Reset statistics
     */
    resetStats(): void;
    /**
     * Log statistics
     */
    logStats(): void;
}
//# sourceMappingURL=WarningDeduplicator.d.ts.map