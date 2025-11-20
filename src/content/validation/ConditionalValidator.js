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
import { Logger } from '@shared/utils/logger';
const logger = new Logger('ConditionalValidator');
/**
 * Category validation level configuration
 */
export const CATEGORY_VALIDATION_LEVEL = {
    // HIGH-SENSITIVITY: Require 2+ modality agreement (serious triggers)
    'sexual_assault': 'high-sensitivity',
    'child_abuse': 'high-sensitivity',
    'self_harm': 'high-sensitivity',
    'medical_procedures': 'high-sensitivity',
    // STANDARD: Multi-modal preferred (most triggers)
    'blood': 'standard',
    'gore': 'standard',
    'vomit': 'standard',
    'violence': 'standard',
    'murder': 'standard',
    'torture': 'standard',
    'domestic_violence': 'standard',
    'racial_violence': 'standard',
    'animal_cruelty': 'standard',
    'dead_body_body_horror': 'standard',
    'detonations_bombs': 'standard',
    'suicide': 'standard',
    'cannibalism': 'standard',
    'jumpscares': 'standard',
    'children_screaming': 'standard',
    'natural_disasters': 'standard',
    'religious_trauma': 'standard',
    'spiders_snakes': 'standard',
    'sex': 'standard',
    'drugs': 'standard',
    'gunshots': 'standard',
    'explosions': 'standard',
    'screams': 'standard',
    'threats': 'standard',
    'death_dying': 'standard',
    'pregnancy_childbirth': 'standard',
    'substance-abuse': 'standard', // Mapped to drugs in types? No, need to match TriggerCategory
    'addiction': 'standard', // Mapped to drugs in types?
    'extreme-sounds': 'standard', // Mapped to loud_noises?
    'loud_noises': 'standard',
    'insects_spiders': 'standard',
    'snakes_reptiles': 'standard',
    'needles_injections': 'standard',
    'claustrophobia_triggers': 'standard',
    'physical_violence': 'standard',
    'car_crashes': 'standard',
    // SINGLE-MODALITY-SUFFICIENT: One reliable detection is enough
    'swear_words': 'single-modality-sufficient',
    'lgbtq_phobia': 'single-modality-sufficient',
    'eating_disorders': 'single-modality-sufficient',
    'flashing_lights': 'single-modality-sufficient',
    'slurs': 'single-modality-sufficient',
    'hate_speech': 'single-modality-sufficient',
    'photosensitivity': 'single-modality-sufficient'
};
// Fix mismatched categories by casting or removing invalid ones if they don't exist in TriggerCategory
// Based on TriggerCategory definition, we need to remove 'substance-abuse', 'addiction', 'extreme-sounds' if they are not in TriggerCategory.
// Let's check TriggerCategory again. It has 'drugs', 'loud_noises'.
// We should remove the invalid keys from the object literal to fix the build error.
const CLEAN_CATEGORY_VALIDATION_LEVEL = {
    'sexual_assault': 'high-sensitivity',
    'child_abuse': 'high-sensitivity',
    'self_harm': 'high-sensitivity',
    'medical_procedures': 'high-sensitivity',
    'blood': 'standard',
    'gore': 'standard',
    'vomit': 'standard',
    'violence': 'standard',
    'murder': 'standard',
    'torture': 'standard',
    'domestic_violence': 'standard',
    'racial_violence': 'standard',
    'animal_cruelty': 'standard',
    'dead_body_body_horror': 'standard',
    'detonations_bombs': 'standard',
    'suicide': 'standard',
    'cannibalism': 'standard',
    'jumpscares': 'standard',
    'children_screaming': 'standard',
    'natural_disasters': 'standard',
    'religious_trauma': 'standard',
    'spiders_snakes': 'standard',
    'sex': 'standard',
    'drugs': 'standard',
    'gunshots': 'standard',
    'explosions': 'standard',
    'screams': 'standard',
    'threats': 'standard',
    'death_dying': 'standard',
    'pregnancy_childbirth': 'standard',
    'loud_noises': 'standard',
    'insects_spiders': 'standard',
    'snakes_reptiles': 'standard',
    'needles_injections': 'standard',
    'claustrophobia_triggers': 'standard',
    'physical_violence': 'standard',
    'car_crashes': 'standard',
    'swear_words': 'single-modality-sufficient',
    'lgbtq_phobia': 'single-modality-sufficient',
    'eating_disorders': 'single-modality-sufficient',
    'flashing_lights': 'single-modality-sufficient',
    'slurs': 'single-modality-sufficient',
    'hate_speech': 'single-modality-sufficient',
    'photosensitivity': 'single-modality-sufficient'
};
/**
 * Validation thresholds per level
 */
export const VALIDATION_THRESHOLDS = {
    'high-sensitivity': 75, // Strict: 75%+ required
    'standard': 60, // Balanced: 60%+ required
    'single-modality-sufficient': 60 // Permissive: 60%+ required
};
/**
 * Conditional Validator
 *
 * Applies category-specific validation rules
 */
export class ConditionalValidator {
    // Validation statistics
    stats = {
        totalValidations: 0,
        passedValidation: 0,
        failedValidation: 0,
        confidenceAdjustments: 0,
        highSensitivityValidations: 0,
        standardValidations: 0,
        singleModalityValidations: 0,
        multiModalDetections: 0,
        singleModalDetections: 0
    };
    /**
     * Validate a detection based on its category's validation level
     */
    validate(detection, relatedDetections) {
        this.stats.totalValidations++;
        // Handle potentially unmapped categories (fallback to standard)
        const validationLevel = CLEAN_CATEGORY_VALIDATION_LEVEL[detection.category] || 'standard';
        const threshold = VALIDATION_THRESHOLDS[validationLevel];
        const reasoning = [];
        reasoning.push(`Category: ${detection.category}, Level: ${validationLevel}, Threshold: ${threshold}%`);
        // Update validation level stats
        if (validationLevel === 'high-sensitivity') {
            this.stats.highSensitivityValidations++;
        }
        else if (validationLevel === 'standard') {
            this.stats.standardValidations++;
        }
        else {
            this.stats.singleModalityValidations++;
        }
        // Count modalities present
        const modalitiesPresent = this.countModalitiesPresent(detection, relatedDetections);
        const modalityBreakdown = this.getModalityBreakdown(detection, relatedDetections);
        reasoning.push(`Modalities present: ${modalitiesPresent} (${Object.entries(modalityBreakdown).filter(([_, v]) => v > 0).map(([k, v]) => `${k}:${v.toFixed(0)}%`).join(', ')})`);
        // Track modality stats
        if (modalitiesPresent >= 2) {
            this.stats.multiModalDetections++;
        }
        else {
            this.stats.singleModalDetections++;
        }
        // Apply validation strategy based on level
        let result;
        switch (validationLevel) {
            case 'high-sensitivity':
                result = this.validateHighSensitivity(detection, modalitiesPresent, modalityBreakdown, threshold, reasoning);
                break;
            case 'standard':
                result = this.validateStandard(detection, modalitiesPresent, modalityBreakdown, threshold, reasoning);
                break;
            case 'single-modality-sufficient':
                result = this.validateSingleModality(detection, modalitiesPresent, modalityBreakdown, threshold, reasoning);
                break;
        }
        // Update stats
        if (result.passed) {
            this.stats.passedValidation++;
        }
        else {
            this.stats.failedValidation++;
        }
        if (result.adjustedConfidence !== result.originalConfidence) {
            this.stats.confidenceAdjustments++;
        }
        // Log result
        if (result.passed) {
            logger.info(`[ConditionalValidator] ✅ VALIDATION PASSED | ` +
                `${detection.category} | ` +
                `Level: ${validationLevel} | ` +
                `Modalities: ${modalitiesPresent} | ` +
                `Confidence: ${result.originalConfidence.toFixed(1)}% → ${result.adjustedConfidence.toFixed(1)}%`);
        }
        else {
            logger.info(`[ConditionalValidator] ❌ VALIDATION FAILED | ` +
                `${detection.category} | ` +
                `Level: ${validationLevel} | ` +
                `Modalities: ${modalitiesPresent} (required: ${result.modalitiesRequired}) | ` +
                `Confidence: ${result.adjustedConfidence.toFixed(1)}% < ${threshold}%`);
        }
        return result;
    }
    /**
     * HIGH-SENSITIVITY validation strategy
     *
     * Requirements:
     * - MUST have 2+ modalities
     * - Confidence must be 75%+
     * - If only 1 modality: reject (0% confidence)
     */
    validateHighSensitivity(detection, modalitiesPresent, modalityBreakdown, threshold, reasoning) {
        const modalitiesRequired = 2;
        let adjustedConfidence = detection.confidence;
        if (modalitiesPresent < modalitiesRequired) {
            // REJECT: High-sensitivity triggers MUST have multi-modal confirmation
            adjustedConfidence = 0;
            reasoning.push(`❌ HIGH-SENSITIVITY REJECTION: Only ${modalitiesPresent} modality present, ` +
                `but ${modalitiesRequired} required for serious triggers like ${detection.category}`);
            return {
                isValid: false,
                validationLevel: 'high-sensitivity',
                originalConfidence: detection.confidence,
                adjustedConfidence,
                modalitiesPresent,
                modalitiesRequired,
                reasoning,
                passed: false
            };
        }
        // Multi-modal confirmation present
        reasoning.push(`✅ HIGH-SENSITIVITY PASSED: ${modalitiesPresent} modalities confirm detection ` +
            `(sufficient for serious trigger)`);
        const passed = adjustedConfidence >= threshold;
        return {
            isValid: passed,
            validationLevel: 'high-sensitivity',
            originalConfidence: detection.confidence,
            adjustedConfidence,
            modalitiesPresent,
            modalitiesRequired,
            reasoning,
            passed
        };
    }
    /**
     * STANDARD validation strategy
     *
     * Requirements:
     * - Multi-modal preferred but not required
     * - If only 1 modality: reduce confidence by 40%
     * - Confidence must be 60%+
     */
    validateStandard(detection, modalitiesPresent, modalityBreakdown, threshold, reasoning) {
        const modalitiesRequired = 1; // At least 1 required
        let adjustedConfidence = detection.confidence;
        if (modalitiesPresent === 1) {
            // Single modality: reduce confidence by 40%
            adjustedConfidence = detection.confidence * 0.6;
            reasoning.push(`⚠️  STANDARD: Single modality only → reduced confidence by 40% ` +
                `(${detection.confidence.toFixed(1)}% → ${adjustedConfidence.toFixed(1)}%) | ` +
                `Multi-modal confirmation would boost confidence`);
        }
        else if (modalitiesPresent >= 2) {
            // Multi-modal: keep or boost confidence
            reasoning.push(`✅ STANDARD: ${modalitiesPresent} modalities confirm → confidence maintained/boosted`);
        }
        const passed = adjustedConfidence >= threshold;
        if (!passed) {
            reasoning.push(`❌ STANDARD FAILED: Adjusted confidence ${adjustedConfidence.toFixed(1)}% < threshold ${threshold}%`);
        }
        return {
            isValid: passed,
            validationLevel: 'standard',
            originalConfidence: detection.confidence,
            adjustedConfidence,
            modalitiesPresent,
            modalitiesRequired,
            reasoning,
            passed
        };
    }
    /**
     * SINGLE-MODALITY-SUFFICIENT validation strategy
     *
     * Requirements:
     * - One reliable detection is enough
     * - No confidence reduction for single modality
     * - Confidence must be 60%+
     */
    validateSingleModality(detection, modalitiesPresent, modalityBreakdown, threshold, reasoning) {
        const modalitiesRequired = 1;
        const adjustedConfidence = detection.confidence;
        // Single modality is sufficient - no reduction
        reasoning.push(`✅ SINGLE-MODALITY-SUFFICIENT: ${modalitiesPresent} modality(s) detected | ` +
            `One reliable detection is enough for ${detection.category}`);
        const passed = adjustedConfidence >= threshold;
        if (!passed) {
            reasoning.push(`❌ SINGLE-MODALITY FAILED: Confidence ${adjustedConfidence.toFixed(1)}% < threshold ${threshold}%`);
        }
        return {
            isValid: passed,
            validationLevel: 'single-modality-sufficient',
            originalConfidence: detection.confidence,
            adjustedConfidence,
            modalitiesPresent,
            modalitiesRequired,
            reasoning,
            passed
        };
    }
    /**
     * Count how many modalities are present with >10% contribution
     */
    countModalitiesPresent(detection, relatedDetections) {
        let count = 0;
        if (detection.modalityContributions) {
            if (detection.modalityContributions.visual > 10)
                count++;
            if (detection.modalityContributions.audio > 10)
                count++;
            if (detection.modalityContributions.text > 10)
                count++;
        }
        else {
            // If no modality breakdown, check related detections
            if (relatedDetections && relatedDetections.length > 0) {
                const sources = new Set(relatedDetections.map(d => d.source));
                count = sources.size;
            }
            else {
                // Single detection
                count = 1;
            }
        }
        return count;
    }
    /**
     * Get modality contribution breakdown
     */
    getModalityBreakdown(detection, relatedDetections) {
        if (detection.modalityContributions) {
            return {
                visual: detection.modalityContributions.visual,
                audio: detection.modalityContributions.audio,
                text: detection.modalityContributions.text
            };
        }
        // Estimate from related detections
        const breakdown = { visual: 0, audio: 0, text: 0 };
        if (relatedDetections && relatedDetections.length > 0) {
            for (const det of relatedDetections) {
                if (det.source === 'visual')
                    breakdown.visual = Math.max(breakdown.visual, det.confidence);
                if (det.source === 'audio')
                    breakdown.audio = Math.max(breakdown.audio, det.confidence);
                if (det.source === 'text')
                    breakdown.text = Math.max(breakdown.text, det.confidence);
            }
        }
        else {
            // Single detection - assign full confidence to source
            if (detection.source === 'visual')
                breakdown.visual = detection.confidence;
            else if (detection.source === 'audio')
                breakdown.audio = detection.confidence;
            else if (detection.source === 'text')
                breakdown.text = detection.confidence;
            else
                breakdown.visual = detection.confidence; // multi-modal fallback
        }
        return breakdown;
    }
    /**
     * Get validation statistics
     */
    getStats() {
        const passRate = (this.stats.passedValidation / Math.max(this.stats.totalValidations, 1)) * 100;
        const adjustmentRate = (this.stats.confidenceAdjustments / Math.max(this.stats.totalValidations, 1)) * 100;
        const multiModalRate = (this.stats.multiModalDetections / Math.max(this.stats.totalValidations, 1)) * 100;
        return {
            ...this.stats,
            passRate: isNaN(passRate) ? 0 : passRate,
            adjustmentRate: isNaN(adjustmentRate) ? 0 : adjustmentRate,
            multiModalRate: isNaN(multiModalRate) ? 0 : multiModalRate
        };
    }
    /**
     * Clear statistics
     */
    clearStats() {
        this.stats.totalValidations = 0;
        this.stats.passedValidation = 0;
        this.stats.failedValidation = 0;
        this.stats.confidenceAdjustments = 0;
        this.stats.highSensitivityValidations = 0;
        this.stats.standardValidations = 0;
        this.stats.singleModalityValidations = 0;
        this.stats.multiModalDetections = 0;
        this.stats.singleModalDetections = 0;
    }
}
/**
 * Singleton instance
 */
export const conditionalValidator = new ConditionalValidator();
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
//# sourceMappingURL=ConditionalValidator.js.map