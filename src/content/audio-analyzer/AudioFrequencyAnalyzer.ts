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
import type { AnalyzeAudioPayload, DetectionPayload } from '@shared/types/analysis.types';
import { Logger } from '@shared/utils/logger';
import { PerformanceGovernor } from '../performance/PerformanceGovernor';
// @ts-ignore - Query params for worker import
import AudioAnalyzerWorker from './AudioAnalyzer.worker?worker';

const logger = new Logger('AudioFrequencyAnalyzer');

export class AudioFrequencyAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private frequencyData: Uint8Array | null = null;
  private monitoringInterval: number | null = null;
  private video: HTMLVideoElement | null = null;

  private worker: Worker | null = null;
  private performanceGovernor: PerformanceGovernor;
  private unsubscribeGovernor: (() => void) | null = null;
  private currentCheckInterval = 100;

  // Statistics
  private stats = {
    totalChecks: 0,
    screamDetections: 0,
    gunshotDetections: 0,
    explosionDetections: 0,
    sirenDetections: 0,
    medicalBeepDetections: 0,
    cryingDetections: 0,
    powerToolDetections: 0
  };

  private onWarningDetected: ((warning: Warning) => void) | null = null;

  constructor() {
    this.performanceGovernor = PerformanceGovernor.getInstance();
    this.initializeWorker();
  }

  private initializeWorker() {
    try {
      this.worker = new AudioAnalyzerWorker();
      if (this.worker) {
        this.worker.onmessage = (e) => this.handleWorkerMessage(e);
        this.worker.onerror = (e) => {
          logger.error('Audio Analyzer Worker error:', e);
        };
      }
    } catch (error) {
      logger.error('Failed to initialize Audio Analyzer Worker:', error);
    }
  }

  private handleWorkerMessage(e: MessageEvent) {
    const { type, payload } = e.data;

    if (type === 'detection') {
      this.handleDetection(payload as DetectionPayload);
    }
  }

  private handleDetection(payload: DetectionPayload) {
      const warning: Warning = {
          ...payload,
          createdAt: new Date(payload.createdAt),
          updatedAt: new Date(payload.updatedAt),
          categoryKey: payload.categoryKey as any,
          status: payload.status as any
      };

      if (warning.categoryKey === 'children_screaming') this.stats.screamDetections++;
      // Update other stats based on category...

      this.onWarningDetected?.(warning);
  }

  /**
   * Initialize frequency analyzer
   * Can share AudioContext with AudioWaveformAnalyzer
   */
  initialize(
    videoElement: HTMLVideoElement,
    sharedAudioContext?: AudioContext,
    sharedAnalyser?: AnalyserNode
  ): void {
    try {
      this.video = videoElement;

      if (sharedAudioContext && sharedAnalyser) {
        // Reuse existing audio context and analyser
        this.audioContext = sharedAudioContext;
        this.analyser = sharedAnalyser;
        logger.info('[TW AudioFrequencyAnalyzer] ✅ Using shared AudioContext');
      } else {
        // Create new audio context
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.8;  // Smoother for frequency analysis

        this.source = this.audioContext.createMediaElementSource(videoElement);
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
      }

      // Allocate frequency data array
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

      // Subscribe to governor
      this.unsubscribeGovernor = this.performanceGovernor.subscribe((tier) => {
        this.currentCheckInterval = this.performanceGovernor.getRecommendedInterval(100);
        // Restart monitoring with new interval
        if (this.monitoringInterval !== null) {
          this.stopMonitoring();
          this.startMonitoring();
        }
      });

      logger.info(
        `[TW AudioFrequencyAnalyzer] ✅ Initialized | ` +
        `FFT Size: ${this.analyser.fftSize}, ` +
        `Frequency Bins: ${this.analyser.frequencyBinCount}, ` +
        `Sample Rate: ${this.audioContext.sampleRate}Hz`
      );

      this.startMonitoring();
    } catch (error) {
      logger.error('[TW AudioFrequencyAnalyzer] ❌ Failed to initialize:', error);
    }
  }

  /**
   * Start monitoring frequency spectrum
   */
  private startMonitoring(): void {
    this.monitoringInterval = window.setInterval(() => {
      this.analyzeFrequencies();
    }, this.currentCheckInterval);

    logger.info(`[TW AudioFrequencyAnalyzer] 🎵 Frequency monitoring started (${this.currentCheckInterval}ms intervals)`);
  }

  /**
   * Stop monitoring
   */
  private stopMonitoring(): void {
    if (this.monitoringInterval !== null) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Analyze current frequency spectrum
   */
  private analyzeFrequencies(): void {
    if (!this.analyser || !this.frequencyData || !this.audioContext || !this.video || !this.worker) {
      return;
    }

    if (this.video.paused || this.video.ended) {
      return;
    }

    this.stats.totalChecks++;

    // Get frequency data (FFT output)
    this.analyser.getByteFrequencyData(this.frequencyData);

    // Send to worker
    // Copy the frequency data to a regular array buffer to avoid SharedArrayBuffer issues
    const dataCopy = new Uint8Array(this.frequencyData);

    const payload: AnalyzeAudioPayload = {
      frequencyData: dataCopy.buffer as ArrayBuffer, // Convert to ArrayBuffer
      timestamp: this.video.currentTime,
      sampleRate: this.analyser.context.sampleRate,
      binCount: this.analyser.frequencyBinCount
    };

    this.worker.postMessage({
      type: 'analyze_audio',
      payload
    });
  }

  /**
   * Register callback
   */
  onDetection(callback: (warning: Warning) => void): void {
    this.onWarningDetected = callback;
  }

  /**
   * Get statistics
   */
  getStats(): typeof this.stats & { enabled: boolean } {
    return {
      ...this.stats,
      enabled: this.audioContext !== null
    };
  }

  /**
   * Clear events
   */
  clear(): void {
    this.worker?.postMessage({ type: 'reset' });
  }

  /**
   * Dispose
   */
  dispose(): void {
    this.stopMonitoring();

    if (this.unsubscribeGovernor) {
      this.unsubscribeGovernor();
    }

    // Don't disconnect if using shared context
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    this.video = null;
    this.frequencyData = null;

    this.worker?.terminate();
    this.worker = null;
    this.onWarningDetected = null;
  }
}
