/**
 * TEMPORAL-PATTERN PIPELINE - Algorithm 3.0 Innovation #13
 *
 * Specialized detection pipeline for ESCALATION-based triggers:
 * - Animal cruelty (escalates over time)
 * - Violence (escalates from verbal to physical)
 * - Torture (escalates in intensity)
 * - Murder (builds up to killing)
 *
 * Pipeline stages:
 * 1. Temporal Pattern Recognizer (PRIMARY) - Tracks escalation curves
 * 2. Scene Classifier (SECONDARY) - Understands context evolution
 * 3. All Modalities (EVIDENCE COLLECTION) - Gathers multi-modal evidence
 * 4. Escalation Threshold (DECISION) - Warns when curve crosses threshold
 *
 * Created by: Claude Code (Algorithm 3.0 Revolutionary Session)
 * Date: 2025-11-11
 */
import type { TriggerCategory } from '@shared/types/Warning.types';
import type { MultiModalInput, Detection, RouteConfig } from './DetectionRouter';
export interface EscalationCurve {
    startTime: number;
    currentLevel: 'mild' | 'moderate' | 'severe' | 'extreme';
    levelScore: number;
    escalationRate: number;
    peakReached: boolean;
}
export interface TemporalContext {
    detectionHistory: Array<{
        timestamp: number;
        confidence: number;
        modality: 'visual' | 'audio' | 'text';
    }>;
    sceneContext: string;
    duration: number;
}
export declare class TemporalPatternPipeline {
    private escalationCurves;
    private detectionHistory;
    private stats;
    /**
     * Process detection through temporal-pattern pipeline
     */
    process(category: TriggerCategory, input: MultiModalInput, config: RouteConfig): Detection;
    /**
     * Initialize escalation curve
     */
    private initializeEscalationCurve;
    /**
     * Update detection history
     */
    private updateHistory;
    /**
     * Collect evidence from all modalities
     */
    private collectEvidence;
    /**
     * Analyze escalation pattern
     */
    private analyzeEscalation;
    /**
     * Update escalation curve
     */
    private updateEscalationCurve;
    /**
     * Check if escalation crosses warning threshold
     */
    private checkEscalationThreshold;
    /**
     * Calculate weighted confidence with escalation factor
     */
    private calculateWeightedConfidence;
    /**
     * Reset escalation curve (scene change, safe content)
     */
    resetCurve(category: TriggerCategory): void;
    /**
     * Get pipeline statistics
     */
    getStats(): {
        totalProcessed: number;
        escalationTracked: number;
        thresholdCrossed: number;
        earlyWarnings: number;
    };
    /**
     * Get current escalation curves
     */
    getEscalationCurves(): Map<TriggerCategory, EscalationCurve>;
}
/**
 * Export singleton instance
 */
export declare const temporalPatternPipeline: TemporalPatternPipeline;
/**
 * EQUAL TREATMENT FOR TEMPORAL TRIGGERS
 *
 * This pipeline ensures:
 * ✅ Animal cruelty gets escalation tracking (mild → severe)
 * ✅ Violence gets multi-stage detection (verbal → physical → weapon → injury)
 * ✅ Torture gets intensity escalation monitoring
 * ✅ Murder gets build-up sequence detection
 * ✅ All temporal triggers benefit from long-term context (up to 60s history)
 *
 * Prevents false positives from brief mentions while catching sustained content
 */
//# sourceMappingURL=TemporalPatternPipeline.d.ts.map