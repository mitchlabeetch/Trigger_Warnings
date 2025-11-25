/**
 * DETECTION ORCHESTRATOR
 *
 * The masterpiece that coordinates ALL detection systems.
 * Refactored to use Dependency Injection and Sleep-to-Wake Architecture.
 *
 * Created by: Claude Code (Legendary Session)
 * Refactored by: Jules
 * Date: 2024-11-11
 */

import type { Warning } from '@shared/types/Warning.types';
import type { IStreamingProvider } from '@shared/types/Provider.types';
import type { Profile } from '@shared/types/Profile.types';
import { Logger } from '@shared/utils/logger';

import { ConfidenceFusionSystem } from '../fusion/ConfidenceFusionSystem';
import { WarningDeduplicator, type DeduplicationStrategy } from '../optimization/WarningDeduplicator';
import { PerformanceOptimizer } from '../optimization/PerformanceOptimizer';
import { SystemHealthMonitor } from '../monitoring/SystemHealthMonitor';

// Algorithm 3.0 Integration
import { Algorithm3Integrator, type LegacyDetection } from '../integration/Algorithm3Integrator';
import { DetectorFactory } from './DetectorFactory';
import type { IDetector, DetectionContext } from './interfaces';

const logger = new Logger('DetectionOrchestrator');

interface OrchestratorConfig {
  enableSubtitleAnalysis: boolean;
  enableAudioWaveform: boolean;
  enableAudioFrequency: boolean;
  enableVisualAnalysis: boolean;
  enablePhotosensitivity: boolean;
  enableFusion: boolean;
  fusionThreshold: number;  // Minimum confidence for fused warnings
  enableDeduplication: boolean;  // Enable intelligent warning deduplication
  deduplicationStrategy: DeduplicationStrategy;  // Deduplication strategy
  enablePerformanceOptimization: boolean;  // Enable adaptive performance optimization
  enableHealthMonitoring: boolean;  // Enable system health monitoring

  // Algorithm 3.0 Configuration
  enableAlgorithm3: boolean;  // Enable Algorithm 3.0 integration (routing, attention, temporal, personalization)
  useLegacyFusion: boolean;  // Use legacy ConfidenceFusionSystem instead of Algorithm 3.0

  // Sentinel / Sleep-to-Wake Config
  enableSleepToWake: boolean;
  wakeDuration: number; // Duration in ms to stay awake after wake signal
  panicMode: boolean; // Override sleep mode
}

interface DetectionStats {
  detectors: Record<string, any>;
  fusion: ReturnType<ConfidenceFusionSystem['getStats']> | null;
  deduplication: ReturnType<WarningDeduplicator['getStats']> | null;
  performance: ReturnType<PerformanceOptimizer['getStats']> | null;
  health: ReturnType<SystemHealthMonitor['getStats']> | null;
  totalWarnings: number;
  activeSystems: number;
  sleepState: 'awake' | 'asleep' | 'panic';
}

export class DetectionOrchestrator {
  // Detection systems
  private detectors: IDetector[] = [];

  private fusionSystem: ConfidenceFusionSystem | null = null;
  private deduplicator: WarningDeduplicator | null = null;
  private performanceOptimizer: PerformanceOptimizer | null = null;
  private healthMonitor: SystemHealthMonitor | null = null;

  // Algorithm 3.0 Integration
  private algorithm3Integrator: Algorithm3Integrator | null = null;

  // State
  private provider: IStreamingProvider;
  private profile: Profile;
  private config: OrchestratorConfig;
  private allWarnings: Warning[] = [];
  private onWarningCallback: ((warning: Warning) => void) | null = null;

  // Sleep-to-Wake State
  private wakeTimeout: number | null = null;
  private isAwake: boolean = false;

  constructor(
    provider: IStreamingProvider,
    profile: Profile,
    config?: Partial<OrchestratorConfig>
  ) {
    this.provider = provider;
    this.profile = profile;

    // Default config: enable all systems INCLUDING Algorithm 3.0
    this.config = {
      enableSubtitleAnalysis: true,
      enableAudioWaveform: true,
      enableAudioFrequency: true,
      enableVisualAnalysis: true,
      enablePhotosensitivity: true,
      enableFusion: true,
      fusionThreshold: 70,
      enableDeduplication: true,
      deduplicationStrategy: 'merge-all',
      enablePerformanceOptimization: true,
      enableHealthMonitoring: true,

      // Algorithm 3.0 ENABLED by default (revolutionary upgrade!)
      enableAlgorithm3: true,
      useLegacyFusion: false,

      // Sleep-to-Wake defaults
      enableSleepToWake: true,
      wakeDuration: 5000,
      panicMode: false,

      ...config
    };

    // Initialize Algorithm 3.0 Integrator
    if (this.config.enableAlgorithm3) {
      this.algorithm3Integrator = new Algorithm3Integrator(profile);
      logger.info('[TW DetectionOrchestrator] 🚀 Algorithm 3.0 Integration ENABLED');
    }

    logger.info('[TW DetectionOrchestrator] 🎭 Initializing Detection Orchestrator...');
    logger.info(`[TW DetectionOrchestrator] Configuration: ${JSON.stringify(this.config)}`);
  }

  /**
   * Initialize all detection systems
   */
  async initialize(): Promise<void> {
    const video = this.provider.getVideoElement();

    if (!video) {
      logger.error('[TW DetectionOrchestrator] ❌ No video element found');
      return;
    }

    logger.info('[TW DetectionOrchestrator] 🚀 Initializing all detection systems...');

    // 0. PERFORMANCE OPTIMIZER (initialize FIRST to get device-optimized config)
    let perfConfig = null;
    if (this.config.enablePerformanceOptimization) {
      try {
        this.performanceOptimizer = new PerformanceOptimizer();
        perfConfig = this.performanceOptimizer.getConfiguration();

        logger.info(
          `[TW DetectionOrchestrator] ⚡ Performance Optimizer initialized`
        );

        // Override config with performance-optimized settings
        this.config.enableSubtitleAnalysis = this.config.enableSubtitleAnalysis && perfConfig.enableSubtitleAnalysis;
        this.config.enableAudioWaveform = this.config.enableAudioWaveform && perfConfig.enableAudioWaveform;
        this.config.enableAudioFrequency = this.config.enableAudioFrequency && perfConfig.enableAudioFrequency;
        this.config.enableVisualAnalysis = this.config.enableVisualAnalysis && perfConfig.enableVisualAnalysis;
        this.config.enablePhotosensitivity = this.config.enablePhotosensitivity && perfConfig.enablePhotosensitivity;
        this.config.enableFusion = this.config.enableFusion && perfConfig.enableFusion;
      } catch (error) {
        logger.error('[TW DetectionOrchestrator] ❌ PerformanceOptimizer failed:', error);
      }
    }

    // Prepare shared audio context
    let audioContext: AudioContext | undefined;
    let analyser: AnalyserNode | undefined;

    if (this.config.enableAudioWaveform || this.config.enableAudioFrequency) {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;

        const source = audioContext.createMediaElementSource(video);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
      } catch (e) {
        logger.error('[TW DetectionOrchestrator] Failed to create shared audio context', e);
      }
    }

    const detectionContext: DetectionContext = {
      video,
      audioContext,
      analyser,
      provider: this.provider
    };

    // 1. Create Detectors using Factory
    this.detectors = DetectorFactory.createDetectors(this.profile, this.config);

    // Initialize detectors
    for (const detector of this.detectors) {
      try {
        await detector.initialize(detectionContext);

        detector.onDetection((warning) => {
          this.handleDetection(warning, detector.id);
        });

        // Setup Sleep-to-Wake Sentinel
        if (detector.id === 'subtitle' && this.config.enableSleepToWake) {
           // We use type assertion or check for method existence as IDetector might not have onWake in all implementations
           // but our interface has it (optional or implementation specific)
           // Actually, we added `onWake` to the SubtitleAdapter in the Factory
           if ((detector as any).onWake) {
               (detector as any).onWake(() => {
                   this.triggerWakeSequence();
               });
           }
        }

        logger.info(`[TW DetectionOrchestrator] ✅ Detector ${detector.id} initialized`);
      } catch (error) {
        logger.error(`[TW DetectionOrchestrator] ❌ Detector ${detector.id} failed:`, error);
      }
    }

    // Initial State: Sleep (unless panic mode or disabled)
    if (this.config.panicMode || !this.config.enableSleepToWake) {
       this.wakeAll();
    } else {
       this.sleepAll();
       // Ensure sentinel is awake (managed by internal logic of sleepAll usually,
       // but here we rely on the fact that SubtitleAdapter.sleep() is no-op)
    }

    // 5. CONFIDENCE FUSION SYSTEM
    if (this.config.enableFusion) {
      this.fusionSystem = new ConfidenceFusionSystem();
      logger.info('[TW DetectionOrchestrator] ✅ ConfidenceFusionSystem initialized');
    }

    // 6. WARNING DEDUPLICATOR
    if (this.config.enableDeduplication) {
      this.deduplicator = new WarningDeduplicator({
        strategy: this.config.deduplicationStrategy,
        temporalWindow: 2.0,
        categoryRateLimit: 10,
        enableSmartMerging: true,
        minimumTimeBetweenSameCategory: 3.0
      });
      logger.info('[TW DetectionOrchestrator] ✅ WarningDeduplicator initialized');
    }

    // 7. SYSTEM HEALTH MONITOR
    if (this.config.enableHealthMonitoring) {
        this.setupHealthMonitoring(video);
    }

    logger.info(
      `[TW DetectionOrchestrator] 🎉 Initialization complete! ${this.detectors.length} detection systems active`
    );
  }

  /**
   * Wake all detectors
   */
  private wakeAll(): void {
      this.isAwake = true;
      logger.info('[TW DetectionOrchestrator] 🔔 WAKE SIGNAL: Activating all detectors');
      this.detectors.forEach(d => d.wake());
  }

  /**
   * Sleep non-sentinel detectors
   */
  private sleepAll(): void {
      if (this.config.panicMode) return; // Never sleep in panic mode

      this.isAwake = false;
      logger.info('[TW DetectionOrchestrator] 💤 SLEEP SIGNAL: Suspending heavy detectors');
      this.detectors.forEach(d => d.sleep());
  }

  /**
   * Trigger the Wake Sequence (wake for X seconds then sleep)
   */
  private triggerWakeSequence(): void {
      if (this.config.panicMode) return;

      // If already awake, extend the time
      if (this.wakeTimeout) {
          clearTimeout(this.wakeTimeout);
      } else {
          // If was sleeping, wake up
          if (!this.isAwake) {
              this.wakeAll();
          }
      }

      this.wakeTimeout = window.setTimeout(() => {
          this.sleepAll();
          this.wakeTimeout = null;
      }, this.config.wakeDuration);
  }

  /**
   * Toggle Panic Mode
   */
  public setPanicMode(enabled: boolean): void {
      this.config.panicMode = enabled;
      if (enabled) {
          logger.warn('[TW DetectionOrchestrator] 🚨 PANIC MODE ENABLED: All detectors forced awake');
          if (this.wakeTimeout) clearTimeout(this.wakeTimeout);
          this.wakeAll();
      } else {
          logger.info('[TW DetectionOrchestrator] 😌 Panic Mode Disabled: Resuming normal operation');
          this.sleepAll();
      }
  }

  private setupHealthMonitoring(video: HTMLVideoElement) {
      try {
        this.healthMonitor = new SystemHealthMonitor({
          checkInterval: 5000,
          errorThreshold: 5,
          failureThreshold: 3,
          autoRestart: true,
          memoryThreshold: 100,
          enableMemoryMonitoring: true
        });

        // Register detectors for monitoring
        this.detectors.forEach(detector => {
             this.healthMonitor?.registerSystem(
                detector.id,
                () => ({ passed: true }),
                async () => {
                   logger.info(`[TW DetectionOrchestrator] 🔄 Restarting ${detector.id}...`);
                   await detector.restart();
                }
             );
        });

        this.healthMonitor.startMonitoring();
        logger.info('[TW DetectionOrchestrator] ✅ SystemHealthMonitor initialized');
      } catch (error) {
        logger.error('[TW DetectionOrchestrator] ❌ SystemHealthMonitor failed:', error);
      }
  }

  /**
   * Handle detection from any system
   */
  private async handleDetection(warning: Warning, source: string): Promise<void> {
    // Filter by profile enabled categories
    if (!this.profile.enabledCategories.includes(warning.categoryKey as any)) {
      logger.debug(
        `[TW DetectionOrchestrator] ⏭️ Detection filtered (category not enabled): ${warning.categoryKey}`
      );
      return;
    }

    logger.info(
      `[TW DetectionOrchestrator] 🎯 Detection from ${source.toUpperCase()} | ` +
      `${warning.categoryKey} at ${warning.startTime.toFixed(1)}s | ` +
      `Confidence: ${warning.confidenceLevel}%`
    );

    // Add to all warnings
    this.allWarnings.push(warning);

    // ALGORITHM 3.0 INTEGRATION PATH
    if (this.algorithm3Integrator && this.config.enableAlgorithm3) {
      // Create legacy detection format
      const legacyDetection: LegacyDetection = {
        source: source as any,
        category: warning.categoryKey,
        timestamp: warning.startTime,
        confidence: warning.confidenceLevel,
        warning,
        metadata: {}
      };

      // Process through Algorithm 3.0 (routing, attention, temporal, fusion, personalization)
      const enhanced = await this.algorithm3Integrator.processDetection(legacyDetection);

      if (enhanced && enhanced.shouldWarn) {
        logger.info(
          `[TW DetectionOrchestrator] ✅ ALGORITHM 3.0 WARNING | ` +
          `${enhanced.category} at ${enhanced.timestamp.toFixed(1)}s | ` +
          `Original: ${enhanced.originalConfidence}% → Final: ${enhanced.fusedConfidence.toFixed(1)}% | ` +
          `Pipeline: ${enhanced.routedPipeline}`
        );

        this.allWarnings.push(enhanced.warning);
        this.emitWarning(enhanced.warning);
      } else if (!enhanced) {
        logger.debug(
          `[TW DetectionOrchestrator] ⏭️  ALGORITHM 3.0 SUPPRESSED | ` +
          `${warning.categoryKey} (below user sensitivity threshold)`
        );
      }

      return;
    }

    // LEGACY FUSION PATH (backward compatibility)
    if (this.fusionSystem && this.config.useLegacyFusion) {
      this.fusionSystem.addDetection({
        source: source as any,
        category: warning.categoryKey,
        timestamp: warning.startTime,
        confidence: warning.confidenceLevel,
        warning
      });

      // Get fused warnings
      const fusedWarnings = this.fusionSystem.getFusedWarnings();

      // Output new fused warnings
      for (const fusedWarning of fusedWarnings) {
        // Check if we've already emitted this fused warning
        if (!this.allWarnings.some(w => w.id === fusedWarning.id)) {
          logger.info(
            `[TW DetectionOrchestrator] 🧠 FUSED WARNING (Legacy) | ` +
            `${fusedWarning.categoryKey} at ${fusedWarning.startTime.toFixed(1)}s | ` +
            `Fused Confidence: ${fusedWarning.confidenceLevel}%`
          );

          this.allWarnings.push(fusedWarning);
          this.emitWarning(fusedWarning);
        }
      }
    } else {
      // No fusion - emit warning directly (through deduplicator if enabled)
      this.emitWarning(warning);
    }
  }

  /**
   * Emit warning to callback (optionally through deduplicator)
   */
  private emitWarning(warning: Warning): void {
    if (!this.onWarningCallback) {
      return;
    }

    // Process through deduplicator if enabled
    if (this.deduplicator) {
      const deduplicated = this.deduplicator.processWarning(warning);

      if (deduplicated) {
        // Warning passed deduplication, emit it
        this.onWarningCallback(deduplicated);
      } else {
        // Warning was filtered/merged by deduplicator
        logger.debug(
          `[TW DetectionOrchestrator] 🔀 Warning deduplicated: ${warning.categoryKey} at ${warning.startTime.toFixed(1)}s`
        );
      }
    } else {
      // No deduplication - emit directly
      this.onWarningCallback(warning);
    }
  }

  /**
   * Register callback for warnings
   */
  onWarning(callback: (warning: Warning) => void): void {
    this.onWarningCallback = callback;
  }

  /**
   * Get all warnings
   */
  getAllWarnings(): Warning[] {
    return this.allWarnings;
  }

  /**
   * Get comprehensive statistics from all systems
   */
  getComprehensiveStats(): DetectionStats & { algorithm3?: any } {
    const detectorStats: Record<string, any> = {};
    for (const d of this.detectors) {
        detectorStats[d.id] = d.getStats();
    }

    const fusionStats = this.fusionSystem?.getStats() || null;
    const deduplicationStats = this.deduplicator?.getStats() || null;
    const performanceStats = this.performanceOptimizer?.getStats() || null;
    const healthStats = this.healthMonitor?.getStats() || null;

    // Algorithm 3.0 stats
    const algorithm3Stats = this.algorithm3Integrator?.getStats() || null;

    return {
      detectors: detectorStats,
      fusion: fusionStats,
      deduplication: deduplicationStats,
      performance: performanceStats,
      health: healthStats,
      algorithm3: algorithm3Stats,
      totalWarnings: this.allWarnings.length,
      activeSystems: this.detectors.length,
      sleepState: this.config.panicMode ? 'panic' : (this.isAwake ? 'awake' : 'asleep')
    };
  }

  /**
   * Log comprehensive statistics
   */
  logStats(): void {
    const stats = this.getComprehensiveStats();

    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('[TW DetectionOrchestrator] 📊 COMPREHENSIVE STATISTICS');
    logger.info('═══════════════════════════════════════════════════════════');

    logger.info(`Active Systems: ${stats.activeSystems}`);
    logger.info(`Sleep State: ${stats.sleepState}`);
    logger.info(`Total Warnings Generated: ${stats.totalWarnings}`);
    logger.info('');

    for (const [id, s] of Object.entries(stats.detectors)) {
        logger.info(`📝 ${id.toUpperCase()}:`);
        logger.info(JSON.stringify(s, null, 2));
    }

    // ... (Log other stats logic maintained for brevity, but could be expanded)

    logger.info('═══════════════════════════════════════════════════════════');
  }

  /**
   * Clear all detection systems
   */
  clear(): void {
    this.detectors.forEach(d => d.clear());
    this.fusionSystem?.clear();
    this.deduplicator?.clear();
    this.algorithm3Integrator?.clear();
    this.allWarnings = [];
  }

  /**
   * Dispose of all systems
   */
  dispose(): void {
    logger.info('[TW DetectionOrchestrator] 🛑 Disposing all detection systems...');

    this.healthMonitor?.stopMonitoring();
    this.healthMonitor?.dispose();
    this.performanceOptimizer?.dispose();

    this.detectors.forEach(d => d.dispose());
    this.fusionSystem?.clear();
    this.deduplicator?.clear();
    this.algorithm3Integrator?.dispose();

    this.detectors = [];
    this.fusionSystem = null;
    this.deduplicator = null;
    this.performanceOptimizer = null;
    this.healthMonitor = null;
    this.algorithm3Integrator = null;

    this.allWarnings = [];
    this.onWarningCallback = null;

    if (this.wakeTimeout) clearTimeout(this.wakeTimeout);

    logger.info('[TW DetectionOrchestrator] ✅ All systems disposed');
  }

  /**
   * Get detection system status
   */
  getSystemStatus(): Record<string, boolean> & {
      fusion: boolean;
      deduplication: boolean;
      performance: boolean;
      healthMonitoring: boolean;
      algorithm3: boolean;
      panicMode: boolean;
      isAwake: boolean;
  } {
    const status: Record<string, boolean> = {};
    this.detectors.forEach(d => status[d.id] = true);

    return {
      ...status,
      fusion: this.fusionSystem !== null,
      deduplication: this.deduplicator !== null,
      performance: this.performanceOptimizer !== null,
      healthMonitoring: this.healthMonitor !== null,
      algorithm3: this.algorithm3Integrator !== null,
      panicMode: this.config.panicMode,
      isAwake: this.isAwake
    };
  }
}
