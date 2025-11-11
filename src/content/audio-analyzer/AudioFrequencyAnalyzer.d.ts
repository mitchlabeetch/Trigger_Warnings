/**
 * AUDIO FREQUENCY ANALYZER
 *
 * Detects trigger warnings from audio frequency analysis
 * Uses Web Audio API's AnalyserNode for FFT-based frequency analysis
 *
 * Detects:
 * - Screaming (3-5kHz sustained high energy)
 * - Gunshots (1-5kHz sharp transient with specific frequency profile)
 * - Explosions (20-200Hz low frequency surge)
 * - Sirens (1-3kHz oscillating frequency)
 * - Medical equipment beeping (1-2kHz periodic steady tone)
 * - Crying/sobbing (500-2kHz rhythmic pattern)
 * - Power tools/chainsaws (100-500Hz sustained buzz)
 *
 * Browser Support: Chrome 14+, Firefox 25+, Safari 6+, Edge 12+
 *
 * Created by: Claude Code (Legendary Session)
 * Date: 2024-11-11
 */
import type { Warning } from '@shared/types/Warning.types';
export declare class AudioFrequencyAnalyzer {
    private audioContext;
    private analyser;
    private source;
    private frequencyData;
    private monitoringInterval;
    private video;
    private frequencyHistory;
    private readonly HISTORY_SIZE;
    private detectedEvents;
    private onWarningDetected;
    private stats;
    /**
     * Initialize frequency analyzer
     * Can share AudioContext with AudioWaveformAnalyzer
     */
    initialize(videoElement: HTMLVideoElement, sharedAudioContext?: AudioContext, sharedAnalyser?: AnalyserNode): void;
    /**
     * Start monitoring frequency spectrum
     */
    private startMonitoring;
    /**
     * Stop monitoring
     */
    private stopMonitoring;
    /**
     * Analyze current frequency spectrum
     */
    private analyzeFrequencies;
    /**
     * Calculate frequency bands from FFT data
     */
    private calculateFrequencyBands;
    /**
     * Get average frequency magnitude in Hz range
     */
    private getAverageFrequency;
    /**
     * Detect screaming (3-5kHz sustained high energy)
     */
    private detectScream;
    /**
     * Detect gunshot (1-5kHz sharp transient)
     */
    private detectGunshot;
    /**
     * Detect explosion (20-200Hz low frequency surge)
     */
    private detectExplosion;
    /**
     * Detect siren (1-3kHz oscillating frequency)
     */
    private detectSiren;
    /**
     * Detect medical equipment beeping (1-2kHz periodic)
     */
    private detectMedicalBeep;
    /**
     * Detect crying/sobbing (500-2kHz rhythmic pattern)
     */
    private detectCrying;
    /**
     * Detect power tools/chainsaws (100-500Hz sustained buzz)
     */
    private detectPowerTool;
    /**
     * Check if frequency band is sustained above threshold
     */
    private isSustained;
    /**
     * Check if frequency band is fluctuating (rhythmic pattern)
     */
    private isFluctuating;
    /**
     * Detect oscillating pattern (for sirens)
     */
    private detectOscillation;
    /**
     * Detect periodic beeping pattern
     */
    private detectPeriodicBeep;
    /**
     * Create warning from frequency detection
     */
    private createWarning;
    /**
     * Register callback
     */
    onDetection(callback: (warning: Warning) => void): void;
    /**
     * Get statistics
     */
    getStats(): typeof this.stats & {
        enabled: boolean;
    };
    /**
     * Clear events
     */
    clear(): void;
    /**
     * Dispose
     */
    dispose(): void;
}
//# sourceMappingURL=AudioFrequencyAnalyzer.d.ts.map