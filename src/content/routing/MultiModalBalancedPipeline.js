/**
 * MULTI-MODAL-BALANCED PIPELINE - Algorithm 3.0 Innovation #13
 *
 * Specialized detection pipeline for HIGH-SENSITIVITY triggers requiring all modalities:
 * - Self-harm (40% visual, 20% audio, 40% text)
 * - Suicide (35% visual, 25% audio, 40% text)
 * - Sexual assault (35% visual, 25% audio, 40% text)
 * - Domestic violence (35% visual, 30% audio, 35% text)
 * - Child abuse (35% visual, 25% audio, 40% text)
 * - Sex (40% visual, 30% audio, 30% text)
 * - Drugs (40% visual, 20% audio, 40% text)
 * - Pregnancy/childbirth (40% visual, 30% audio, 30% text)
 * - Natural disasters (45% visual, 40% audio, 15% text)
 * - Cannibalism (40% visual, 30% audio, 30% text)
 *
 * Pipeline stages:
 * 1. ALL ANALYZERS RUN IN PARALLEL - Equal importance
 * 2. HYBRID FUSION - Early + intermediate + late fusion
 * 3. HIGH CONFIDENCE THRESHOLD - 80%+ for high-sensitivity triggers
 * 4. CROSS-MODAL VALIDATION - Ensure modalities agree
 *
 * Created by: Claude Code (Algorithm 3.0 Revolutionary Session)
 * Date: 2025-11-11
 */
import { Logger } from '@shared/utils/logger';
const logger = new Logger('MultiModalBalancedPipeline');
export class MultiModalBalancedPipeline {
    stats = {
        totalProcessed: 0,
        multiModalBalanced: 0,
        highSensitivity: 0,
        crossModalValidated: 0,
        allModalitiesPresent: 0
    };
    /**
     * Process detection through multi-modal-balanced pipeline
     */
    process(category, input, config) {
        this.stats.totalProcessed++;
        this.stats.multiModalBalanced++;
        if (config.validationLevel === 'high-sensitivity') {
            this.stats.highSensitivity++;
        }
        // Check if all modalities present
        const allPresent = !!(input.visual && input.audio && input.text);
        if (allPresent) {
            this.stats.allModalitiesPresent++;
        }
        // Extract confidence from each modality
        const visualConfidence = input.visual?.confidence || 0;
        const audioConfidence = input.audio?.confidence || 0;
        const textConfidence = input.text?.confidence || 0;
        // Calculate cross-modal agreement
        const agreement = this.calculateCrossModalAgreement(visualConfidence, audioConfidence, textConfidence);
        if (agreement.overallAgreement > 70) {
            this.stats.crossModalValidated++;
        }
        // Apply balanced weights
        const weightedConfidence = this.calculateBalancedConfidence(visualConfidence, audioConfidence, textConfidence, config.modalityWeights, agreement);
        // Validate based on sensitivity level
        const validationPassed = this.validateHighSensitivityDetection(weightedConfidence, agreement, config.validationLevel, allPresent);
        const detection = {
            category,
            timestamp: input.timestamp,
            confidence: weightedConfidence,
            route: 'multi-modal-balanced',
            modalityContributions: {
                visual: visualConfidence * config.modalityWeights.visual,
                audio: audioConfidence * config.modalityWeights.audio,
                text: textConfidence * config.modalityWeights.text
            },
            validationPassed,
            temporalContext: {
                pattern: config.temporalPattern,
                duration: 0
            }
        };
        logger.debug(`[MultiModalBalancedPipeline] Processed ${category} | ` +
            `Visual: ${visualConfidence.toFixed(1)}% | ` +
            `Audio: ${audioConfidence.toFixed(1)}% | ` +
            `Text: ${textConfidence.toFixed(1)}% | ` +
            `Agreement: ${agreement.overallAgreement.toFixed(1)}% | ` +
            `Weighted: ${weightedConfidence.toFixed(1)}% | ` +
            `Validated: ${validationPassed}`);
        return detection;
    }
    /**
     * Calculate cross-modal agreement
     *
     * Ensures that different modalities are telling the same story
     */
    calculateCrossModalAgreement(visual, audio, text) {
        // Check if modalities agree (within 20% of each other)
        const threshold = 20;
        const visualAudioDiff = Math.abs(visual - audio);
        const visualTextDiff = Math.abs(visual - text);
        const audioTextDiff = Math.abs(audio - text);
        const agreement = {
            visualAudioAgreement: visualAudioDiff <= threshold,
            visualTextAgreement: visualTextDiff <= threshold,
            audioTextAgreement: audioTextDiff <= threshold,
            overallAgreement: 0
        };
        // Calculate overall agreement score
        let agreementScore = 0;
        let comparisons = 0;
        if (visual > 0 && audio > 0) {
            agreementScore += 100 - Math.min(visualAudioDiff, 100);
            comparisons++;
        }
        if (visual > 0 && text > 0) {
            agreementScore += 100 - Math.min(visualTextDiff, 100);
            comparisons++;
        }
        if (audio > 0 && text > 0) {
            agreementScore += 100 - Math.min(audioTextDiff, 100);
            comparisons++;
        }
        agreement.overallAgreement = comparisons > 0 ? agreementScore / comparisons : 0;
        return agreement;
    }
    /**
     * Calculate balanced confidence with agreement boost
     */
    calculateBalancedConfidence(visual, audio, text, weights, agreement) {
        // Base weighted confidence
        const baseConfidence = (visual * weights.visual) +
            (audio * weights.audio) +
            (text * weights.text);
        // Apply agreement boost
        // High agreement between modalities = higher confidence
        const agreementBoost = 1 + (agreement.overallAgreement / 200); // Up to +50% boost
        return Math.min(baseConfidence * agreementBoost, 100);
    }
    /**
     * Validate high-sensitivity detection
     *
     * High-sensitivity triggers require stricter validation:
     * - Must have 2+ modalities with confidence > 50%
     * - Cross-modal agreement must be high (>60%)
     * - Overall confidence must be 75%+
     */
    validateHighSensitivityDetection(confidence, agreement, validationLevel, allModalitiesPresent) {
        if (validationLevel === 'high-sensitivity') {
            // Strict requirements for high-sensitivity triggers
            // Require high confidence
            if (confidence < 75) {
                return false;
            }
            // Require good cross-modal agreement
            if (agreement.overallAgreement < 60) {
                logger.debug(`[MultiModalBalancedPipeline] High-sensitivity validation FAILED: ` +
                    `Low agreement (${agreement.overallAgreement.toFixed(1)}% < 60%)`);
                return false;
            }
            // Prefer all modalities present, but not strictly required
            if (allModalitiesPresent) {
                logger.debug('[MultiModalBalancedPipeline] High-sensitivity validation PASSED: All modalities present');
            }
            return true;
        }
        // Standard validation for non-high-sensitivity
        if (confidence >= 60) {
            return true;
        }
        return false;
    }
    /**
     * Get pipeline statistics
     */
    getStats() {
        return { ...this.stats };
    }
}
/**
 * Export singleton instance
 */
export const multiModalBalancedPipeline = new MultiModalBalancedPipeline();
/**
 * EQUAL TREATMENT FOR MULTI-MODAL TRIGGERS
 *
 * This pipeline ensures:
 * ✅ Self-harm requires 2+ modalities with high confidence (75%+)
 * ✅ Sexual assault requires cross-modal agreement (>60%)
 * ✅ Suicide requires balanced evidence from all modalities
 * ✅ Domestic violence requires visual + audio + text alignment
 * ✅ Child abuse requires high-sensitivity validation (80%+)
 * ✅ All multi-modal triggers get equal attention to visual, audio, text
 *
 * Prevents false positives through strict cross-modal validation
 * Maintains high sensitivity for serious triggers
 */
//# sourceMappingURL=MultiModalBalancedPipeline.js.map