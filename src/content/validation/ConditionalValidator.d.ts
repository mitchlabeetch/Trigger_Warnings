/**
 * CONDITIONAL VALIDATOR (Innovation #15)
 *
 * Category-specific validation requirements to reduce false positives
 * while maintaining high sensitivity for serious triggers.
 *
 * **VALIDATION LEVELS:**
 *
 * 1. **HIGH-SENSITIVITY** (strictest validation):
 *    - Categories: sexual_assault, child_abuse, self_harm, medical_procedures
 *    - Requirement: MUST have 2+ modality agreement
 *    - Threshold: 75%+
 *    - Reasoning: Serious triggers require extra certainty to avoid false positives
 *
 * 2. **STANDARD** (balanced validation):
 *    - Categories: blood, gore, vomit, violence, animal_cruelty, etc.
 *    - Requirement: Multi-modal validation preferred (60% reduction if missing)
 *    - Threshold: 60%
 *    - Reasoning: Benefit from confirmation but don't require it
 *
 * 3. **SINGLE-MODALITY-SUFFICIENT** (permissive validation):
 *    - Categories: slurs, hate_speech, photosensitivity (flashing lights)
 *    - Requirement: One reliable detection is enough
 *    - Threshold: 60%
 *    - Reasoning: These are clear-cut and one modality is usually definitive
 *
 * **BENEFITS:**
 * - Reduces false positives for serious triggers (sexual assault, child abuse)
 * - Maintains high sensitivity for clear-cut triggers (slurs, flashing lights)
 * - Balances precision vs recall per category
 *
 * **EQUAL TREATMENT:**
 * Each of 28 categories gets appropriate validation level based on its
 * characteristics, not importance. All categories are equally important!
 *
 * Created by: Claude Code (Algorithm 3.0 Phase 2)
 * Date: 2025-11-12
 */
import type { TriggerCategory } from '@shared/types/Warning.types';
/**
 * Validation levels
 */
export type ValidationLevel = 'high-sensitivity' | 'standard' | 'single-modality-sufficient';
/**
 * Detection with modality information
 */
export interface Detection {
    category: TriggerCategory;
    confidence: number;
    timestamp: number;
    source: 'visual' | 'audio' | 'text' | 'multi-modal';
    modalityContributions?: {
        visual: number;
        audio: number;
        text: number;
    };
}
/**
 * Validation result
 */
export interface ValidationResult {
    isValid: boolean;
    validationLevel: ValidationLevel;
    originalConfidence: number;
    adjustedConfidence: number;
    modalitiesPresent: number;
    modalitiesRequired: number;
    reasoning: string[];
    passed: boolean;
}
/**
 * Category validation level configuration
 */
export declare const CATEGORY_VALIDATION_LEVEL: Record<TriggerCategory, ValidationLevel>;
/**
 * Validation thresholds per level
 */
export declare const VALIDATION_THRESHOLDS: Record<ValidationLevel, number>;
/**
 * Conditional Validator
 *
 * Applies category-specific validation rules
 */
export declare class ConditionalValidator {
    private stats;
    /**
     * Validate a detection based on its category's validation level
     */
    validate(detection: Detection, relatedDetections?: Detection[]): ValidationResult;
    /**
     * HIGH-SENSITIVITY validation strategy
     *
     * Requirements:
     * - MUST have 2+ modalities
     * - Confidence must be 75%+
     * - If only 1 modality: reject (0% confidence)
     */
    private validateHighSensitivity;
    /**
     * STANDARD validation strategy
     *
     * Requirements:
     * - Multi-modal preferred but not required
     * - If only 1 modality: reduce confidence by 40%
     * - Confidence must be 60%+
     */
    private validateStandard;
    /**
     * SINGLE-MODALITY-SUFFICIENT validation strategy
     *
     * Requirements:
     * - One reliable detection is enough
     * - No confidence reduction for single modality
     * - Confidence must be 60%+
     */
    private validateSingleModality;
    /**
     * Count how many modalities are present with >10% contribution
     */
    private countModalitiesPresent;
    /**
     * Get modality contribution breakdown
     */
    private getModalityBreakdown;
    /**
     * Get validation statistics
     */
    getStats(): typeof this.stats & {
        passRate: number;
        adjustmentRate: number;
        multiModalRate: number;
    };
    /**
     * Clear statistics
     */
    clearStats(): void;
}
/**
 * Singleton instance
 */
export declare const conditionalValidator: ConditionalValidator;
/**
 * CONDITIONAL VALIDATION COMPLETE ✅
 *
 * Validation Levels:
 * 1. HIGH-SENSITIVITY (4 categories): Require 2+ modalities, 75% threshold
 *    - sexual_assault, child_abuse, self_harm, medical_procedures
 *    - Prevents false positives for serious triggers
 *
 * 2. STANDARD (20 categories): Multi-modal preferred, 60% threshold
 *    - blood, gore, vomit, violence, animal_cruelty, etc.
 *    - 40% confidence reduction if single modality only
 *    - Balanced precision vs recall
 *
 * 3. SINGLE-MODALITY-SUFFICIENT (4 categories): One modality enough, 60% threshold
 *    - slurs, hate_speech, eating_disorders, flashing_lights
 *    - No confidence reduction for single modality
 *    - Clear-cut triggers where one modality is definitive
 *
 * Benefits:
 * - Reduces false positives for serious triggers (sexual assault, child abuse)
 * - Maintains high sensitivity for clear-cut triggers (slurs, flashing lights)
 * - Balances precision vs recall per category characteristics
 * - All 28 categories get appropriate validation (equal treatment)
 *
 * Integration:
 * - Works AFTER routing and fusion in Algorithm3Integrator
 * - Final confidence adjustment before personalization
 * - Can reject detections that don't meet validation requirements
 */
//# sourceMappingURL=ConditionalValidator.d.ts.map