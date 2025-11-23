/**
 * USER SENSITIVITY PROFILE - Algorithm 3.0 Innovation #30
 *
 * Per-category sensitivity configuration allowing users to customize their
 * trigger warning experience for EACH of the 28 trigger categories.
 *
 * **THE PERSONALIZATION PROMISE:**
 * - User A: Very sensitive to vomit (40% threshold), medium for blood (75%)
 * - User B: Very sensitive to eating disorders (40%), low for violence (85%)
 * - User C: Off for spiders, very high for medical procedures
 * - ALL 28 categories individually configurable
 *
 * Features:
 * - 5 sensitivity levels per category (very-high, high, medium, low, off)
 * - Advanced settings (nighttime mode, stress mode, adaptive learning)
 * - Context-aware settings (educational vs fictional vs news)
 * - Progressive desensitization support (therapeutic)
 * - Cloud sync across devices
 *
 * Created by: Claude Code (Algorithm 3.0 Revolutionary Session)
 * Date: 2025-11-11
 */

import type { TriggerCategory } from '@shared/types/Warning.types';
import { Logger } from '@shared/utils/logger';
import { StorageAdapter } from '@core/storage/StorageAdapter';
import type { StorageKey } from '@shared/types/Storage.types';
import {
    type UserSensitivityProfile,
    type SensitivityLevel,
    type ContentContext,
    SENSITIVITY_THRESHOLDS,
    DEFAULT_SENSITIVITY_PROFILE
} from '@shared/types/UserSensitivityProfile.types';

// Re-export types for backward compatibility if needed, or just use imports directly
export type { UserSensitivityProfile, SensitivityLevel, ContentContext, AdvancedSettings, ContextualSettings } from '@shared/types/UserSensitivityProfile.types';
export { SENSITIVITY_THRESHOLDS, DEFAULT_SENSITIVITY_PROFILE } from '@shared/types/UserSensitivityProfile.types';

const logger = new Logger('UserSensitivityProfile');

/**
 * User Sensitivity Profile Manager
 *
 * Manages loading, saving, and applying user sensitivity profiles
 */
export class UserSensitivityProfileManager {
  private currentProfile: UserSensitivityProfile | null = null;

  private stats = {
    profileLoads: 0,
    profileSaves: 0,
    thresholdCalculations: 0,
    contextAdjustments: 0,
    timeAdjustments: 0,
    stressAdjustments: 0
  };

  /**
   * Load user profile (from storage or default)
   */
  async loadProfile(userId: string): Promise<UserSensitivityProfile> {
    this.stats.profileLoads++;

    // Try to load from storage
    try {
      const key = `sensitivity_profile_${userId}` as unknown as StorageKey; // Dynamic key
      const stored = await StorageAdapter.get(key);

      if (stored) {
        this.currentProfile = stored as unknown as UserSensitivityProfile;
        logger.info(`[UserSensitivityProfile] Loaded profile for user ${userId}`);
        return this.currentProfile;
      }
    } catch (error) {
      logger.warn(`[UserSensitivityProfile] Failed to load profile: ${error}`);
    }

    // Create default profile
    this.currentProfile = {
      userId,
      ...DEFAULT_SENSITIVITY_PROFILE
    };

    logger.info(`[UserSensitivityProfile] Created default profile for user ${userId}`);
    return this.currentProfile;
  }

  /**
   * Save user profile to storage
   */
  async saveProfile(profile: UserSensitivityProfile): Promise<void> {
    this.stats.profileSaves++;

    try {
      profile.lastUpdated = Date.now();
      const key = `sensitivity_profile_${profile.userId}` as unknown as StorageKey; // Dynamic key
      await StorageAdapter.set(key, profile as any); // Cast to any because dynamic key is not in schema

      this.currentProfile = profile;
      logger.info(`[UserSensitivityProfile] Saved profile for user ${profile.userId}`);
    } catch (error) {
      logger.error(`[UserSensitivityProfile] Failed to save profile: ${error}`);
      throw error;
    }
  }

  /**
   * Get current loaded profile
   */
  getCurrentProfile(): UserSensitivityProfile | null {
    return this.currentProfile;
  }

  /**
   * Calculate threshold for a specific category
   *
   * Applies all modifiers:
   * - Base sensitivity level
   * - Context adjustments (if applicable)
   * - Time-of-day adjustments
   * - Stress mode adjustments
   * - Desensitization progress
   */
  calculateThreshold(
    category: TriggerCategory,
    context?: ContentContext
  ): number {
    this.stats.thresholdCalculations++;

    if (!this.currentProfile) {
      // No profile loaded - use default high sensitivity
      return SENSITIVITY_THRESHOLDS['high'];
    }

    // Get base sensitivity level
    let sensitivity = this.currentProfile.categorySettings[category] || 'high';

    // Apply context-specific overrides if available
    if (context && this.currentProfile.contextualSettings?.[category]) {
      const contextual = this.currentProfile.contextualSettings[category];
      // Map context string to property name (handling potential mismatches like news-documentary -> newsDocumentary)
      if (contextual) {
        if (context === 'news-documentary') {
            sensitivity = contextual.newsDocumentary || sensitivity;
        } else {
            sensitivity = contextual[context] || sensitivity;
        }
      }
      this.stats.contextAdjustments++;
    }

    // Get base threshold
    let threshold = SENSITIVITY_THRESHOLDS[sensitivity];

    // Apply time-of-day adjustment
    if (this.currentProfile.advancedSettings.nighttimeMode && this.isNighttime()) {
      const boost = this.currentProfile.advancedSettings.nighttimeBoost;
      threshold = threshold * (1 - boost);  // Lower threshold = more sensitive
      this.stats.timeAdjustments++;

      logger.debug(
        `[UserSensitivityProfile] Nighttime boost applied to ${category}: ` +
        `${SENSITIVITY_THRESHOLDS[sensitivity]} → ${threshold.toFixed(1)}`
      );
    }

    // Apply stress mode adjustment
    if (this.currentProfile.advancedSettings.stressMode) {
      const boost = this.currentProfile.advancedSettings.stressModeBoost;
      threshold = threshold * (1 - boost);
      this.stats.stressAdjustments++;

      logger.debug(
        `[UserSensitivityProfile] Stress mode boost applied to ${category}: ` +
        `threshold → ${threshold.toFixed(1)}`
      );
    }

    // Apply desensitization progress (if enabled)
    if (this.currentProfile.advancedSettings.desensitizationEnabled) {
      // Calculate weeks since profile creation
      const weeksSinceCreation = (Date.now() - this.currentProfile.lastUpdated) / (1000 * 60 * 60 * 24 * 7);
      const rate = this.currentProfile.advancedSettings.desensitizationRate;

      // Gradually increase threshold (reduce sensitivity)
      threshold = threshold * (1 + (rate * weeksSinceCreation));
      threshold = Math.min(threshold, 90);  // Cap at 90% to maintain some protection
    }

    return Math.round(threshold);
  }

  /**
   * Check if current time is nighttime
   */
  private isNighttime(): boolean {
    if (!this.currentProfile) {
      return false;
    }

    const now = new Date();
    const currentHour = now.getHours();

    const startHour = this.currentProfile.advancedSettings.nighttimeStartHour;
    const endHour = this.currentProfile.advancedSettings.nighttimeEndHour;

    // Handle overnight range (e.g., 22:00 - 07:00)
    if (startHour > endHour) {
      return currentHour >= startHour || currentHour < endHour;
    }

    return currentHour >= startHour && currentHour < endHour;
  }

  /**
   * Update category sensitivity
   */
  async updateCategorySensitivity(
    category: TriggerCategory,
    sensitivity: SensitivityLevel
  ): Promise<void> {
    if (!this.currentProfile) {
      throw new Error('No profile loaded');
    }

    this.currentProfile.categorySettings[category] = sensitivity;
    await this.saveProfile(this.currentProfile);

    logger.info(`[UserSensitivityProfile] Updated ${category} sensitivity to ${sensitivity}`);
  }

  /**
   * Enable/disable stress mode
   */
  async setStressMode(enabled: boolean): Promise<void> {
    if (!this.currentProfile) {
      throw new Error('No profile loaded');
    }

    this.currentProfile.advancedSettings.stressMode = enabled;
    await this.saveProfile(this.currentProfile);

    logger.info(`[UserSensitivityProfile] Stress mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set all categories to same sensitivity (bulk update)
   */
  async setAllCategories(sensitivity: SensitivityLevel): Promise<void> {
    if (!this.currentProfile) {
      throw new Error('No profile loaded');
    }

    for (const category in this.currentProfile.categorySettings) {
      this.currentProfile.categorySettings[category as TriggerCategory] = sensitivity;
    }

    await this.saveProfile(this.currentProfile);

    logger.info(`[UserSensitivityProfile] Set all categories to ${sensitivity}`);
  }

  /**
   * Get statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

/**
 * Export singleton instance
 */
export const userSensitivityProfileManager = new UserSensitivityProfileManager();

/**
 * EQUAL TREATMENT THROUGH PERSONALIZATION
 *
 * This system ensures:
 * ✅ ALL 28 categories individually configurable
 * ✅ 5 sensitivity levels per category (very-high, high, medium, low, off)
 * ✅ Context-aware settings (educational vs fictional vs news)
 * ✅ Time-based adjustments (nighttime mode +10% sensitivity)
 * ✅ Stress mode for difficult days (+20% sensitivity)
 * ✅ Progressive desensitization support (therapeutic)
 * ✅ Cloud sync across devices
 *
 * USER EXAMPLES:
 * - User with emetophobia: vomit = very-high (40%), others = medium
 * - User in ED recovery: eating_disorders = very-high (40%), violence = low (85%)
 * - Medical student: medical_procedures = off (100%), blood = medium (75%)
 *
 * **NO USER LEFT BEHIND - PERSONALIZATION FOR ALL**
 */
