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
import type { TriggerCategory } from '@shared/types/Warning.types';
import type { MultiModalInput, Detection, RouteConfig } from './DetectionRouter';
export interface CrossModalAgreement {
    visualAudioAgreement: boolean;
    visualTextAgreement: boolean;
    audioTextAgreement: boolean;
    overallAgreement: number;
}
export declare class MultiModalBalancedPipeline {
    private stats;
    /**
     * Process detection through multi-modal-balanced pipeline
     */
    process(category: TriggerCategory, input: MultiModalInput, config: RouteConfig): Detection;
    /**
     * Calculate cross-modal agreement
     *
     * Ensures that different modalities are telling the same story
     */
    private calculateCrossModalAgreement;
    /**
     * Calculate balanced confidence with agreement boost
     */
    private calculateBalancedConfidence;
    /**
     * Validate high-sensitivity detection
     *
     * High-sensitivity triggers require stricter validation:
     * - Must have 2+ modalities with confidence > 50%
     * - Cross-modal agreement must be high (>60%)
     * - Overall confidence must be 75%+
     */
    private validateHighSensitivityDetection;
    /**
     * Get pipeline statistics
     */
    getStats(): {
        totalProcessed: number;
        multiModalBalanced: number;
        highSensitivity: number;
        crossModalValidated: number;
        allModalitiesPresent: number;
    };
}
/**
 * Export singleton instance
 */
export declare const multiModalBalancedPipeline: MultiModalBalancedPipeline;
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
//# sourceMappingURL=MultiModalBalancedPipeline.d.ts.map