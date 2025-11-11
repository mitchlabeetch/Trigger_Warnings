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

import type { Warning, TriggerCategory } from '@shared/types/Warning.types';
import { Logger } from '@shared/utils/logger';

const logger = new Logger('WarningDeduplicator');

export type DeduplicationStrategy =
  | 'merge-all'          // Merge all similar warnings into one
  | 'keep-highest'       // Keep only highest confidence
  | 'suppress-duplicates' // Suppress duplicates, show first only
  | 'show-all';          // No deduplication (for debugging)

export interface DeduplicationConfig {
  strategy: DeduplicationStrategy;
  temporalWindow: number;  // Seconds to group warnings
  categoryRateLimit: number;  // Max warnings per category per minute
  enableSmartMerging: boolean;  // Combine descriptions intelligently
  minimumTimeBetweenSameCategory: number;  // Seconds between same category
}

interface WarningGroup {
  category: TriggerCategory;
  warnings: Warning[];
  firstTimestamp: number;
  lastTimestamp: number;
  sources: Set<string>;  // Track which systems contributed
  merged: boolean;
}

interface CategoryRateLimitState {
  category: TriggerCategory;
  count: number;
  windowStart: number;
  lastWarningTime: number;
}

export class WarningDeduplicator {
  private config: DeduplicationConfig;
  private activeGroups: Map<string, WarningGroup> = new Map();
  private processedWarningIds: Set<string> = new Set();
  private categoryRateLimits: Map<TriggerCategory, CategoryRateLimitState> = new Map();
  private outputWarnings: Warning[] = [];

  // Statistics
  private stats = {
    totalWarningsReceived: 0,
    duplicatesFiltered: 0,
    warningsMerged: 0,
    rateLimitedWarnings: 0,
    outputWarnings: 0
  };

  constructor(config?: Partial<DeduplicationConfig>) {
    this.config = {
      strategy: 'merge-all',
      temporalWindow: 2.0,  // 2 second window
      categoryRateLimit: 10,  // Max 10 warnings per category per minute
      enableSmartMerging: true,
      minimumTimeBetweenSameCategory: 3.0,  // 3 seconds between same category
      ...config
    };

    logger.info(
      `[TW WarningDeduplicator] ✅ Initialized | ` +
      `Strategy: ${this.config.strategy} | ` +
      `Window: ${this.config.temporalWindow}s | ` +
      `Rate Limit: ${this.config.categoryRateLimit}/min`
    );
  }

  /**
   * Process incoming warning (may be filtered, merged, or passed through)
   */
  processWarning(warning: Warning): Warning | null {
    this.stats.totalWarningsReceived++;

    // Check if already processed
    if (this.processedWarningIds.has(warning.id)) {
      this.stats.duplicatesFiltered++;
      logger.debug(`[TW WarningDeduplicator] ⏭️ Duplicate filtered: ${warning.id}`);
      return null;
    }

    // Strategy: show-all (no deduplication)
    if (this.config.strategy === 'show-all') {
      this.processedWarningIds.add(warning.id);
      this.outputWarnings.push(warning);
      this.stats.outputWarnings++;
      return warning;
    }

    // Check rate limiting
    if (this.isRateLimited(warning)) {
      this.stats.rateLimitedWarnings++;
      logger.warn(
        `[TW WarningDeduplicator] ⚠️ Rate limited: ${warning.categoryKey} ` +
        `(${this.categoryRateLimits.get(warning.categoryKey)?.count} warnings in 60s)`
      );
      return null;
    }

    // Check minimum time between same category
    if (this.isTooSoonForCategory(warning)) {
      this.stats.duplicatesFiltered++;
      logger.debug(
        `[TW WarningDeduplicator] ⏭️ Too soon for ${warning.categoryKey} ` +
        `(within ${this.config.minimumTimeBetweenSameCategory}s)`
      );
      return null;
    }

    // Find or create group
    const group = this.findOrCreateGroup(warning);

    // Add warning to group
    this.addToGroup(group, warning);
    this.processedWarningIds.add(warning.id);

    // Update rate limit tracking
    this.updateRateLimit(warning);

    // Clean old groups
    this.cleanOldGroups(warning.startTime);

    // Process group based on strategy
    return this.processGroup(group, warning);
  }

  /**
   * Check if warning is rate limited
   */
  private isRateLimited(warning: Warning): boolean {
    const state = this.categoryRateLimits.get(warning.categoryKey);
    if (!state) {
      return false;
    }

    const now = warning.startTime;
    const windowDuration = 60;  // 60 seconds

    // Reset window if expired
    if (now - state.windowStart > windowDuration) {
      state.count = 0;
      state.windowStart = now;
      return false;
    }

    // Check if limit exceeded
    return state.count >= this.config.categoryRateLimit;
  }

  /**
   * Check if warning is too soon after last warning of same category
   */
  private isTooSoonForCategory(warning: Warning): boolean {
    const state = this.categoryRateLimits.get(warning.categoryKey);
    if (!state) {
      return false;
    }

    const timeSinceLastWarning = warning.startTime - state.lastWarningTime;
    return timeSinceLastWarning < this.config.minimumTimeBetweenSameCategory;
  }

  /**
   * Update rate limit tracking
   */
  private updateRateLimit(warning: Warning): void {
    let state = this.categoryRateLimits.get(warning.categoryKey);

    if (!state) {
      state = {
        category: warning.categoryKey,
        count: 0,
        windowStart: warning.startTime,
        lastWarningTime: 0
      };
      this.categoryRateLimits.set(warning.categoryKey, state);
    }

    const now = warning.startTime;
    const windowDuration = 60;

    // Reset window if expired
    if (now - state.windowStart > windowDuration) {
      state.count = 0;
      state.windowStart = now;
    }

    state.count++;
    state.lastWarningTime = now;
  }

  /**
   * Find existing group or create new one
   */
  private findOrCreateGroup(warning: Warning): WarningGroup {
    const key = this.getGroupKey(warning);
    let group = this.activeGroups.get(key);

    if (!group) {
      group = {
        category: warning.categoryKey,
        warnings: [],
        firstTimestamp: warning.startTime,
        lastTimestamp: warning.startTime,
        sources: new Set(),
        merged: false
      };
      this.activeGroups.set(key, group);

      logger.debug(
        `[TW WarningDeduplicator] 📦 New group created: ${key} at ${warning.startTime.toFixed(1)}s`
      );
    }

    return group;
  }

  /**
   * Get group key for warning
   */
  private getGroupKey(warning: Warning): string {
    // Group by category and time window
    const timeSlot = Math.floor(warning.startTime / this.config.temporalWindow);
    return `${warning.categoryKey}-${timeSlot}`;
  }

  /**
   * Add warning to group
   */
  private addToGroup(group: WarningGroup, warning: Warning): void {
    group.warnings.push(warning);
    group.lastTimestamp = Math.max(group.lastTimestamp, warning.startTime);

    // Extract source from warning ID or description
    const source = this.extractSource(warning);
    if (source) {
      group.sources.add(source);
    }

    logger.debug(
      `[TW WarningDeduplicator] ➕ Added to group | ` +
      `Category: ${warning.categoryKey} | ` +
      `Warnings in group: ${group.warnings.length} | ` +
      `Sources: ${Array.from(group.sources).join(', ')}`
    );
  }

  /**
   * Extract source from warning
   */
  private extractSource(warning: Warning): string | null {
    // Check ID for source hints
    if (warning.id.includes('subtitle')) return 'subtitle';
    if (warning.id.includes('audio-waveform')) return 'audio-waveform';
    if (warning.id.includes('audio-frequency')) return 'audio-frequency';
    if (warning.id.includes('visual')) return 'visual';
    if (warning.id.includes('photosensitivity')) return 'photosensitivity';
    if (warning.id.includes('temporal')) return 'temporal';
    if (warning.id.includes('fused')) return 'fusion';
    if (warning.id.includes('database')) return 'database';

    // Check submittedBy field
    if (warning.submittedBy.includes('subtitle')) return 'subtitle';
    if (warning.submittedBy.includes('audio')) return 'audio';
    if (warning.submittedBy.includes('visual')) return 'visual';
    if (warning.submittedBy.includes('photo')) return 'photosensitivity';
    if (warning.submittedBy.includes('fusion')) return 'fusion';

    return null;
  }

  /**
   * Process group based on strategy
   */
  private processGroup(group: WarningGroup, newWarning: Warning): Warning | null {
    // If this is the first warning in the group, output it
    if (group.warnings.length === 1) {
      this.outputWarnings.push(newWarning);
      this.stats.outputWarnings++;
      return newWarning;
    }

    // Multiple warnings in group - apply strategy
    switch (this.config.strategy) {
      case 'merge-all':
        return this.mergeWarnings(group);

      case 'keep-highest':
        return this.keepHighestConfidence(group, newWarning);

      case 'suppress-duplicates':
        // First warning already output, suppress rest
        this.stats.duplicatesFiltered++;
        return null;

      default:
        return newWarning;
    }
  }

  /**
   * Merge all warnings in group into one consolidated warning
   */
  private mergeWarnings(group: WarningGroup): Warning | null {
    if (group.merged) {
      // Already merged, don't output again
      this.stats.duplicatesFiltered++;
      return null;
    }

    const warnings = group.warnings;
    const highestConfidence = Math.max(...warnings.map(w => w.confidenceLevel));
    const avgConfidence = Math.round(
      warnings.reduce((sum, w) => sum + w.confidenceLevel, 0) / warnings.length
    );

    // Use highest confidence as base
    const baseWarning = warnings.reduce((highest, current) =>
      current.confidenceLevel > highest.confidenceLevel ? current : highest
    );

    // Calculate boosted confidence (average + bonus for multiple sources)
    const sourceBonus = Math.min((group.sources.size - 1) * 5, 15);  // +5% per extra source, max +15%
    const mergedConfidence = Math.min(avgConfidence + sourceBonus, 99);

    // Smart description merging
    const description = this.config.enableSmartMerging
      ? this.mergeDescriptions(warnings, group.sources)
      : baseWarning.description;

    const mergedWarning: Warning = {
      ...baseWarning,
      id: `merged-${group.category}-${Math.floor(group.firstTimestamp)}`,
      confidenceLevel: mergedConfidence,
      description,
      startTime: Math.min(...warnings.map(w => w.startTime)),
      endTime: Math.max(...warnings.map(w => w.endTime)),
      submittedBy: `deduplicator-merged-${group.sources.size}-sources`,
      updatedAt: new Date()
    };

    // Mark group as merged
    group.merged = true;

    // Remove previous warnings from output, add merged one
    this.outputWarnings = this.outputWarnings.filter(
      w => !warnings.some(gw => gw.id === w.id)
    );
    this.outputWarnings.push(mergedWarning);

    this.stats.warningsMerged += warnings.length - 1;
    this.stats.outputWarnings = this.outputWarnings.length;

    logger.info(
      `[TW WarningDeduplicator] 🔀 MERGED WARNING | ` +
      `${group.category} at ${group.firstTimestamp.toFixed(1)}s | ` +
      `Sources: ${Array.from(group.sources).join(', ')} | ` +
      `Individual: ${warnings.map(w => w.confidenceLevel).join('%, ')}% | ` +
      `Merged: ${mergedConfidence}% | ` +
      `Warnings combined: ${warnings.length}`
    );

    return mergedWarning;
  }

  /**
   * Merge descriptions intelligently
   */
  private mergeDescriptions(warnings: Warning[], sources: Set<string>): string {
    const sourcesList = Array.from(sources).sort();
    const confidences = warnings.map(w => `${this.extractSource(w) || 'unknown'}:${w.confidenceLevel}%`);

    // Create consolidated description
    const parts: string[] = [];

    // Count sources
    parts.push(`Multi-source detection (${sources.size} systems)`);

    // List sources
    parts.push(`Sources: ${sourcesList.join(', ')}`);

    // Individual confidences
    parts.push(`Individual: [${confidences.join(', ')}]`);

    // Include any specific details from original descriptions
    const specificDetails = warnings
      .map(w => w.description)
      .filter(d => d && !d.includes('Multi-signal') && !d.includes('Fused'))
      .slice(0, 2);  // Max 2 specific details

    if (specificDetails.length > 0) {
      parts.push(`Details: ${specificDetails.join(' | ')}`);
    }

    return parts.join(' | ');
  }

  /**
   * Keep only highest confidence warning
   */
  private keepHighestConfidence(group: WarningGroup, newWarning: Warning): Warning | null {
    const currentHighest = group.warnings.reduce((highest, current) =>
      current.confidenceLevel > highest.confidenceLevel ? current : highest
    );

    // If new warning is not the highest, suppress it
    if (newWarning.confidenceLevel < currentHighest.confidenceLevel) {
      this.stats.duplicatesFiltered++;
      logger.debug(
        `[TW WarningDeduplicator] ⏭️ Lower confidence suppressed: ` +
        `${newWarning.confidenceLevel}% < ${currentHighest.confidenceLevel}%`
      );
      return null;
    }

    // If new warning is highest, replace previous
    if (newWarning.confidenceLevel > currentHighest.confidenceLevel) {
      this.outputWarnings = this.outputWarnings.filter(w => w.id !== currentHighest.id);
      this.outputWarnings.push(newWarning);
      this.stats.duplicatesFiltered++;
      this.stats.outputWarnings = this.outputWarnings.length;

      logger.info(
        `[TW WarningDeduplicator] ⬆️ Higher confidence replaces previous: ` +
        `${newWarning.confidenceLevel}% > ${currentHighest.confidenceLevel}%`
      );

      return newWarning;
    }

    // Equal confidence - suppress
    this.stats.duplicatesFiltered++;
    return null;
  }

  /**
   * Clean old groups outside temporal window
   */
  private cleanOldGroups(currentTime: number): void {
    const keysToDelete: string[] = [];

    for (const [key, group] of this.activeGroups) {
      if (currentTime - group.lastTimestamp > this.config.temporalWindow * 2) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.activeGroups.delete(key);
      logger.debug(`[TW WarningDeduplicator] 🧹 Cleaned old group: ${key}`);
    }
  }

  /**
   * Get all output warnings (after deduplication)
   */
  getOutputWarnings(): Warning[] {
    return this.outputWarnings;
  }

  /**
   * Get statistics
   */
  getStats(): typeof this.stats & {
    activeGroups: number;
    deduplicationRate: number;
  } {
    const deduplicationRate = this.stats.totalWarningsReceived > 0
      ? Math.round((this.stats.duplicatesFiltered / this.stats.totalWarningsReceived) * 100)
      : 0;

    return {
      ...this.stats,
      activeGroups: this.activeGroups.size,
      deduplicationRate
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DeduplicationConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info(`[TW WarningDeduplicator] 🔄 Configuration updated: ${JSON.stringify(config)}`);
  }

  /**
   * Clear state
   */
  clear(): void {
    this.activeGroups.clear();
    this.processedWarningIds.clear();
    this.categoryRateLimits.clear();
    this.outputWarnings = [];

    logger.info('[TW WarningDeduplicator] 🧹 State cleared');
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalWarningsReceived: 0,
      duplicatesFiltered: 0,
      warningsMerged: 0,
      rateLimitedWarnings: 0,
      outputWarnings: 0
    };

    logger.info('[TW WarningDeduplicator] 📊 Statistics reset');
  }

  /**
   * Log statistics
   */
  logStats(): void {
    const stats = this.getStats();

    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('[TW WarningDeduplicator] 📊 DEDUPLICATION STATISTICS');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info(`Strategy: ${this.config.strategy}`);
    logger.info(`Total Warnings Received: ${stats.totalWarningsReceived}`);
    logger.info(`Duplicates Filtered: ${stats.duplicatesFiltered}`);
    logger.info(`Warnings Merged: ${stats.warningsMerged}`);
    logger.info(`Rate Limited: ${stats.rateLimitedWarnings}`);
    logger.info(`Output Warnings: ${stats.outputWarnings}`);
    logger.info(`Active Groups: ${stats.activeGroups}`);
    logger.info(`Deduplication Rate: ${stats.deduplicationRate}%`);
    logger.info(`Reduction: ${stats.totalWarningsReceived - stats.outputWarnings} warnings eliminated`);
    logger.info('═══════════════════════════════════════════════════════════');
  }
}
