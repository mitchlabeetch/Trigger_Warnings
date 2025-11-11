/**
 * AUDIO-PRIMARY PIPELINE - Algorithm 3.0 Innovation #13
 *
 * Specialized detection pipeline for AUDIO-heavy triggers:
 * - Gunshots (70% audio)
 * - Explosions/Detonations (65% audio)
 * - Jumpscares (60% audio)
 * - Children screaming (70% audio)
 *
 * Pipeline stages:
 * 1. Audio Waveform Analyzer (PRIMARY) - Transient detection
 * 2. Audio Frequency Analyzer (PRIMARY) - Spectral analysis
 * 3. Visual Flash Detector (VALIDATION) - Muzzle flashes, explosions
 * 4. Subtitle Analyzer (CONFIRMATION) - "[gunshot]", "explosion"
 *
 * Created by: Claude Code (Algorithm 3.0 Revolutionary Session)
 * Date: 2025-11-11
 */
import type { TriggerCategory } from '@shared/types/Warning.types';
import type { MultiModalInput, Detection, RouteConfig } from './DetectionRouter';
export interface AudioFeatures {
    waveformAnalysis: {
        transientDetected: boolean;
        transientIntensity: number;
        lowFrequencyRumble: number;
        impulseResponse: number;
    };
    frequencyAnalysis: {
        peakFrequency: number;
        harmonicDistortion: number;
        spectralCentroid: number;
        zeroCrossingRate: number;
    };
    intensityAnalysis: {
        peakAmplitude: number;
        suddenness: number;
        duration: number;
    };
}
export declare class AudioPrimaryPipeline {
    private stats;
    /**
     * Process detection through audio-primary pipeline
     */
    process(category: TriggerCategory, input: MultiModalInput, config: RouteConfig): Detection;
    /**
     * Primary audio analysis
     */
    private analyzeAudio;
    /**
     * Gunshot-specific audio analysis
     */
    private analyzeGunshot;
    /**
     * Explosion-specific audio analysis
     */
    private analyzeExplosion;
    /**
     * Jumpscare-specific audio analysis
     */
    private analyzeJumpscare;
    /**
     * Scream-specific audio analysis
     */
    private analyzeScream;
    /**
     * Validate with visual (secondary)
     */
    private validateVisual;
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
        audioPrimary: number;
        visualValidated: number;
        textValidated: number;
        multiModalConfirmed: number;
    };
}
/**
 * Export singleton instance
 */
export declare const audioPrimaryPipeline: AudioPrimaryPipeline;
/**
 * EQUAL TREATMENT FOR AUDIO TRIGGERS
 *
 * This pipeline ensures:
 * ✅ Gunshots get transient detection + impulse response analysis
 * ✅ Explosions get low-frequency rumble + transient spike analysis
 * ✅ Screams get harmonic distortion + frequency range analysis
 * ✅ Jumpscares get suddenness + intensity spike analysis
 * ✅ All audio triggers receive sophisticated spectral and waveform analysis
 *
 * Research-backed: GMM + SVM + CNN ensemble achieves 93% precision (per IEEE research)
 */
//# sourceMappingURL=AudioPrimaryPipeline.d.ts.map