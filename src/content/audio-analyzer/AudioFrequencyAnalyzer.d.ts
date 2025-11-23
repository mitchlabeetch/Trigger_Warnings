/**
 * AUDIO FREQUENCY ANALYZER
 *
 * Detects trigger warnings from audio frequency analysis
 * Uses Web Audio API's AnalyserNode for FFT-based frequency analysis
 * off the main thread using Web Workers.
 *
 * Browser Support: Chrome 14+, Firefox 25+, Safari 6+, Edge 12+
 *
 * Created by: Claude Code (Legendary Session)
 * Date: 2024-11-11
 * Refactored for Web Worker: Jules
 */
import type { Warning } from '@shared/types/Warning.types';
export declare class AudioFrequencyAnalyzer {
    private audioContext;
    private analyser;
    private source;
    private frequencyData;
    private monitoringInterval;
    private video;
    private worker;
    private performanceGovernor;
    private unsubscribeGovernor;
    private currentCheckInterval;
    private stats;
    private onWarningDetected;
    constructor();
    private initializeWorker;
    private handleWorkerMessage;
    private handleDetection;
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