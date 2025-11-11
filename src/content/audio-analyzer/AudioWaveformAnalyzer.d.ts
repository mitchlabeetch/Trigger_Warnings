/**
 * AUDIO WAVEFORM ANALYZER
 *
 * Detects trigger warnings from audio waveform analysis
 * Uses native Web Audio API (zero bundle size, excellent browser support)
 *
 * Detects:
 * - Gunshots (sharp transient, high amplitude < 50ms)
 * - Explosions (sustained spike, low frequency surge)
 * - Sudden loud noises (amplitude spikes > threshold)
 * - Silence (potential tension/suffocation scenes)
 * - Jump scares (silence → sudden loud)
 *
 * Browser Support:
 * - Chrome 14+
 * - Firefox 25+
 * - Safari 6+
 * - Edge 12+
 *
 * Created by: Claude Code (Legendary Session)
 * Date: 2024-11-11
 */
import type { Warning } from '@shared/types/Warning.types';
interface AudioEvent {
    type: 'gunshot' | 'explosion' | 'loud_noise' | 'silence' | 'jump_scare';
    timestamp: number;
    amplitude: number;
    duration?: number;
}
export declare class AudioWaveformAnalyzer {
    private audioContext;
    private analyser;
    private source;
    private dataArray;
    private previousRMS;
    private monitoringInterval;
    private video;
    private readonly GUNSHOT_THRESHOLD;
    private readonly GUNSHOT_RISE_TIME_MS;
    private readonly EXPLOSION_THRESHOLD;
    private readonly EXPLOSION_DURATION_MS;
    private readonly LOUD_NOISE_THRESHOLD;
    private readonly SILENCE_THRESHOLD;
    private readonly JUMP_SCARE_THRESHOLD;
    private silenceDuration;
    private wasSilent;
    private lastEventTime;
    private detectedEvents;
    private onWarningDetected;
    private stats;
    /**
     * Initialize audio analyzer for a video element
     */
    initialize(videoElement: HTMLVideoElement): void;
    /**
     * Start monitoring audio waveform
     */
    private startMonitoring;
    /**
     * Stop monitoring
     */
    private stopMonitoring;
    /**
     * Analyze current audio waveform
     */
    private analyzeWaveform;
    /**
     * Calculate Root Mean Square amplitude (normalized 0-1)
     */
    private calculateRMS;
    /**
     * Detect gunshot
     */
    private detectGunshot;
    /**
     * Detect explosion
     */
    private detectExplosion;
    /**
     * Detect general loud noise
     */
    private detectLoudNoise;
    /**
     * Detect jump scare (silence → sudden loud)
     */
    private detectJumpScare;
    /**
     * Detect prolonged silence
     */
    private detectSilence;
    /**
     * Register callback for warnings
     */
    onDetection(callback: (warning: Warning) => void): void;
    /**
     * Get all detected events
     */
    getDetectedEvents(): AudioEvent[];
    /**
     * Get statistics
     */
    getStats(): {
        totalChecks: number;
        gunshotDetections: number;
        explosionDetections: number;
        loudNoiseDetections: number;
        silenceDetections: number;
        jumpScareDetections: number;
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
export {};
//# sourceMappingURL=AudioWaveformAnalyzer.d.ts.map