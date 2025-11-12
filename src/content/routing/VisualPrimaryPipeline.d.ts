/**
 * VISUAL-PRIMARY PIPELINE - Algorithm 3.0 Innovation #13
 *
 * Specialized detection pipeline for VISUAL-heavy triggers:
 * - Blood (70% visual)
 * - Gore (75% visual)
 * - Vomit (50% visual, 40% audio)
 * - Dead bodies (80% visual)
 * - Medical procedures (60% visual)
 * - Flashing lights (95% visual)
 * - Insects/spiders (85% visual)
 * - Needles/injections (75% visual)
 * - Claustrophobia triggers (70% visual)
 *
 * Pipeline stages:
 * 1. Visual Color Analyzer (PRIMARY)
 * 2. Visual Texture Analyzer (SECONDARY)
 * 3. Subtitle Analyzer (VALIDATION)
 * 4. Audio Analyzer (VALIDATION)
 *
 * Created by: Claude Code (Algorithm 3.0 Revolutionary Session)
 * Date: 2025-11-11
 */
import type { TriggerCategory } from '@shared/types/Warning.types';
import type { MultiModalInput, Detection, RouteConfig } from './DetectionRouter';
export interface VisualFeatures {
    colorAnalysis: {
        redConcentration: number;
        yellowBrownHue: number;
        greenishTint: number;
        whiteBlueSterile: number;
    };
    textureAnalysis: {
        chunkiness: number;
        liquidPooling: number;
        irregularity: number;
    };
    motionAnalysis: {
        flashingDetected: boolean;
        flashFrequency: number;
        suddenMovement: boolean;
    };
    objectDetection?: {
        medicalInstruments: boolean;
        needles: boolean;
        insects: boolean;
    };
}
export declare class VisualPrimaryPipeline {
    private stats;
    /**
     * Process detection through visual-primary pipeline
     */
    process(category: TriggerCategory, input: MultiModalInput, config: RouteConfig): Detection;
    /**
     * Primary visual analysis
     */
    private analyzeVisual;
    /**
     * Blood-specific visual analysis
     */
    private analyzeBlood;
    /**
     * Gore-specific visual analysis
     */
    private analyzeGore;
    /**
     * Vomit-specific visual analysis
     */
    private analyzeVomit;
    /**
     * Medical procedure visual analysis
     */
    private analyzeMedicalProcedure;
    /**
     * Flashing lights analysis
     */
    private analyzeFlashingLights;
    /**
     * Insect/spider detection
     */
    private analyzeInsects;
    /**
     * Needle/injection detection
     */
    private analyzeNeedles;
    /**
     * Validate with audio (secondary)
     */
    private validateAudio;
    /**
     * Validate with text (secondary)
     */
    private validateText;
    /**
     * Calculate weighted confidence
     */
    private calculateWeightedConfidence;
    /**
     * Validate detection quality
     */
    private validateDetection;
    /**
     * Get pipeline statistics
     */
    getStats(): {
        totalProcessed: number;
        visualPrimary: number;
        audioValidated: number;
        textValidated: number;
        multiModalConfirmed: number;
    };
}
/**
 * Export singleton instance
 */
export declare const visualPrimaryPipeline: VisualPrimaryPipeline;
/**
 * EQUAL TREATMENT FOR VISUAL TRIGGERS
 *
 * This pipeline ensures:
 * ✅ Blood gets sophisticated red concentration + liquid pooling analysis
 * ✅ Vomit gets yellow-brown + greenish + chunky texture analysis (EQUAL to blood)
 * ✅ Gore gets irregularity + chunkiness analysis
 * ✅ Medical procedures get sterile color + instrument detection
 * ✅ Flashing lights get frequency-based photosensitivity detection
 * ✅ All visual triggers receive category-optimized analysis
 *
 * VOMIT GETS THE SAME SOPHISTICATION AS BLOOD - THIS IS THE PROMISE.
 */
//# sourceMappingURL=VisualPrimaryPipeline.d.ts.map