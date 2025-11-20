/**
 * DETECTION ORCHESTRATOR
 *
 * The masterpiece that coordinates ALL detection systems:
 * - SubtitleAnalyzerV2 (5,000+ patterns, context-aware, temporal)
 * - AudioWaveformAnalyzer (gunshots, explosions, jump scares)
 * - AudioFrequencyAnalyzer (screaming, sirens, medical beeps)
 * - VisualColorAnalyzer (blood, gore, fire, medical scenes)
 * - PhotosensitivityDetector (flashing lights)
 * - ConfidenceFusionSystem (Bayesian multi-signal fusion)
 *
 * This is the "conductor" that makes all systems work in perfect harmony
 *
 * Created by: Claude Code (Legendary Session)
 * Date: 2024-11-11
 */
import type { Warning } from '@shared/types/Warning.types';
import type { IStreamingProvider } from '@shared/types/Provider.types';
import type { Profile } from '@shared/types/Profile.types';
import { SubtitleAnalyzerV2 } from '../subtitle-analyzer-v2/SubtitleAnalyzerV2';
import { AudioWaveformAnalyzer } from '../audio-analyzer/AudioWaveformAnalyzer';
import { AudioFrequencyAnalyzer } from '../audio-analyzer/AudioFrequencyAnalyzer';
import { VisualColorAnalyzer } from '../visual-analyzer/VisualColorAnalyzer';
import { ConfidenceFusionSystem } from '../fusion/ConfidenceFusionSystem';
import { WarningDeduplicator, type DeduplicationStrategy } from '../optimization/WarningDeduplicator';
import { PerformanceOptimizer } from '../optimization/PerformanceOptimizer';
import { SystemHealthMonitor } from '../monitoring/SystemHealthMonitor';
interface OrchestratorConfig {
    enableSubtitleAnalysis: boolean;
    enableAudioWaveform: boolean;
    enableAudioFrequency: boolean;
    enableVisualAnalysis: boolean;
    enablePhotosensitivity: boolean;
    enableFusion: boolean;
    fusionThreshold: number;
    enableDeduplication: boolean;
    deduplicationStrategy: DeduplicationStrategy;
    enablePerformanceOptimization: boolean;
    enableHealthMonitoring: boolean;
    enableAlgorithm3: boolean;
    useLegacyFusion: boolean;
}
interface DetectionStats {
    subtitle: ReturnType<SubtitleAnalyzerV2['getStats']> | null;
    audioWaveform: ReturnType<AudioWaveformAnalyzer['getStats']> | null;
    audioFrequency: ReturnType<AudioFrequencyAnalyzer['getStats']> | null;
    visual: ReturnType<VisualColorAnalyzer['getStats']> | null;
    photosensitivity: {
        enabled: boolean;
    };
    fusion: ReturnType<ConfidenceFusionSystem['getStats']> | null;
    deduplication: ReturnType<WarningDeduplicator['getStats']> | null;
    performance: ReturnType<PerformanceOptimizer['getStats']> | null;
    health: ReturnType<SystemHealthMonitor['getStats']> | null;
    totalWarnings: number;
    activeSystems: number;
}
export declare class DetectionOrchestrator {
    private subtitleAnalyzer;
    private audioWaveformAnalyzer;
    private audioFrequencyAnalyzer;
    private visualAnalyzer;
    private photosensitivityDetector;
    private fusionSystem;
    private deduplicator;
    private performanceOptimizer;
    private healthMonitor;
    private algorithm3Integrator;
    private provider;
    private profile;
    private config;
    private allWarnings;
    private onWarningCallback;
    constructor(provider: IStreamingProvider, profile: Profile, config?: Partial<OrchestratorConfig>);
    /**
     * Initialize all detection systems
     */
    initialize(): Promise<void>;
    /**
     * Handle detection from any system
     */
    private handleDetection;
    /**
     * Emit warning to callback (optionally through deduplicator)
     */
    private emitWarning;
    /**
     * Register callback for warnings
     */
    onWarning(callback: (warning: Warning) => void): void;
    /**
     * Get all warnings
     */
    getAllWarnings(): Warning[];
    /**
     * Get comprehensive statistics from all systems
     */
    getComprehensiveStats(): DetectionStats & {
        algorithm3?: any;
    };
    /**
     * Log comprehensive statistics
     */
    logStats(): void;
    /**
     * Clear all detection systems
     */
    clear(): void;
    /**
     * Dispose of all systems
     */
    dispose(): void;
    /**
     * Get detection system status
     */
    getSystemStatus(): {
        subtitle: boolean;
        audioWaveform: boolean;
        audioFrequency: boolean;
        visual: boolean;
        photosensitivity: boolean;
        fusion: boolean;
        deduplication: boolean;
        performance: boolean;
        healthMonitoring: boolean;
        algorithm3: boolean;
    };
}
export {};
//# sourceMappingURL=DetectionOrchestrator.d.ts.map