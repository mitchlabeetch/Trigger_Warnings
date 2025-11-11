/**
 * TEXT-PRIMARY PIPELINE - Algorithm 3.0 Innovation #13
 *
 * Specialized detection pipeline for TEXT-heavy triggers:
 * - LGBTQ+ phobia (80% text)
 * - Racial violence (60% text)
 * - Eating disorders (60% text)
 * - Religious trauma (70% text)
 *
 * Pipeline stages:
 * 1. Advanced NLP Analyzer (PRIMARY) - Pattern matching, context analysis
 * 2. Context Analyzer (PRIMARY) - Negation detection, sentiment analysis
 * 3. Sentiment Analyzer (VALIDATION) - Emotional tone
 * 4. Audio/Visual (CONTEXT ONLY) - Background context
 *
 * Created by: Claude Code (Algorithm 3.0 Revolutionary Session)
 * Date: 2025-11-11
 */
import type { TriggerCategory } from '@shared/types/Warning.types';
import type { MultiModalInput, Detection, RouteConfig } from './DetectionRouter';
export interface TextFeatures {
    nlpAnalysis: {
        keywordMatches: string[];
        contextScore: number;
        negationDetected: boolean;
        sentimentScore: number;
    };
    linguisticPatterns: {
        slurDetected: boolean;
        hateSpeechMarkers: number;
        proAnaLanguage: number;
        bodyMeasurements: boolean;
        religiousTraumaMarkers: number;
    };
    temporalContext: {
        pastTense: boolean;
        futureTense: boolean;
        presentTense: boolean;
    };
}
export declare class TextPrimaryPipeline {
    private stats;
    /**
     * Process detection through text-primary pipeline
     */
    process(category: TriggerCategory, input: MultiModalInput, config: RouteConfig): Detection;
    /**
     * Primary text analysis
     */
    private analyzeText;
    /**
     * LGBTQ+ phobia text analysis
     */
    private analyzeLGBTQPhobia;
    /**
     * Racial violence text analysis
     */
    private analyzeRacialViolence;
    /**
     * Eating disorder text analysis
     */
    private analyzeEatingDisorder;
    /**
     * Religious trauma text analysis
     */
    private analyzeReligiousTrauma;
    /**
     * Validate with audio (context only)
     */
    private validateAudio;
    /**
     * Validate with visual (context only)
     */
    private validateVisual;
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
        textPrimary: number;
        negationHandled: number;
        contextValidated: number;
        multiModalConfirmed: number;
    };
}
/**
 * Export singleton instance
 */
export declare const textPrimaryPipeline: TextPrimaryPipeline;
/**
 * EQUAL TREATMENT FOR TEXT TRIGGERS
 *
 * This pipeline ensures:
 * ✅ Slurs get single-modality-sufficient detection (high priority)
 * ✅ Eating disorders get pro-ana language + body measurement detection
 * ✅ LGBTQ+ phobia gets slur + hate speech marker detection
 * ✅ Racial violence gets context-aware hate speech detection
 * ✅ Religious trauma gets trauma marker + sentiment analysis
 * ✅ Negation detection prevents false positives ("no blood")
 *
 * Research-backed: Bi-LSTM achieves 95.67% accuracy with negation marking
 */
//# sourceMappingURL=TextPrimaryPipeline.d.ts.map