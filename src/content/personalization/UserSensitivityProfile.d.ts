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
/**
 * Sensitivity levels with associated confidence thresholds
 */
export type SensitivityLevel = 'very-high' | 'high' | 'medium' | 'low' | 'off';
/**
 * Content context types for context-aware sensitivity
 */
export type ContentContext = 'educational' | 'fictional' | 'news-documentary' | 'unknown';
/**
 * Threshold mappings for each sensitivity level
 *
 * Lower threshold = more sensitive (warns at lower confidence)
 * Higher threshold = less sensitive (requires higher confidence to warn)
 */
export declare const SENSITIVITY_THRESHOLDS: Record<SensitivityLevel, number>;
/**
 * Advanced user settings
 */
export interface AdvancedSettings {
    nighttimeMode: boolean;
    nighttimeBoost: number;
    nighttimeStartHour: number;
    nighttimeEndHour: number;
    stressMode: boolean;
    stressModeBoost: number;
    adaptiveLearning: boolean;
    learningRate: number;
    desensitizationEnabled: boolean;
    desensitizationRate: number;
}
/**
 * Context-specific sensitivity settings
 *
 * Allows different sensitivity levels based on content type
 */
export interface ContextualSettings {
    educational: SensitivityLevel;
    fictional: SensitivityLevel;
    newsDocumentary: SensitivityLevel;
    unknown: SensitivityLevel;
}
/**
 * User sensitivity profile
 *
 * Stores all personalization settings for a user
 */
export interface UserSensitivityProfile {
    userId: string;
    categorySettings: Record<TriggerCategory, SensitivityLevel>;
    contextualSettings?: Partial<Record<TriggerCategory, ContextualSettings>>;
    advancedSettings: AdvancedSettings;
    lastUpdated: number;
    version: number;
}
/**
 * Default sensitivity profile for new users
 */
export declare const DEFAULT_SENSITIVITY_PROFILE: Omit<UserSensitivityProfile, 'userId'>;
/**
 * User Sensitivity Profile Manager
 *
 * Manages loading, saving, and applying user sensitivity profiles
 */
export declare class UserSensitivityProfileManager {
    private currentProfile;
    private stats;
    /**
     * Load user profile (from Chrome storage or default)
     */
    loadProfile(userId: string): Promise<UserSensitivityProfile>;
    /**
     * Save user profile to Chrome storage
     */
    saveProfile(profile: UserSensitivityProfile): Promise<void>;
    /**
     * Get current loaded profile
     */
    getCurrentProfile(): UserSensitivityProfile | null;
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
    calculateThreshold(category: TriggerCategory, context?: ContentContext): number;
    /**
     * Check if current time is nighttime
     */
    private isNighttime;
    /**
     * Update category sensitivity
     */
    updateCategorySensitivity(category: TriggerCategory, sensitivity: SensitivityLevel): Promise<void>;
    /**
     * Enable/disable stress mode
     */
    setStressMode(enabled: boolean): Promise<void>;
    /**
     * Set all categories to same sensitivity (bulk update)
     */
    setAllCategories(sensitivity: SensitivityLevel): Promise<void>;
    /**
     * Get statistics
     */
    getStats(): {
        profileLoads: number;
        profileSaves: number;
        thresholdCalculations: number;
        contextAdjustments: number;
        timeAdjustments: number;
        stressAdjustments: number;
    };
}
/**
 * Export singleton instance
 */
export declare const userSensitivityProfileManager: UserSensitivityProfileManager;
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
//# sourceMappingURL=UserSensitivityProfile.d.ts.map