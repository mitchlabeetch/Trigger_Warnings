/**
 * VISUAL COLOR ANALYZER
 *
 * Detects trigger warnings from visual color analysis
 * Uses Web Workers and OffscreenCanvas for real-time frame analysis
 * off the main thread.
 *
 * Browser Support: Universal (Canvas API, Web Workers)
 *
 * Created by: Claude Code (Legendary Session)
 * Date: 2024-11-11
 * Refactored for Web Worker: Jules
 */

import type { Warning } from '@shared/types/Warning.types';
import type { AnalyzeFramePayload, DetectionPayload } from '@shared/types/analysis.types';
import { Logger } from '@shared/utils/logger';
import { PerformanceGovernor } from '../performance/PerformanceGovernor';
// @ts-ignore - Query params for worker import
import VisualAnalyzerWorker from './VisualAnalyzer.worker?worker';

const logger = new Logger('VisualColorAnalyzer');

export class VisualColorAnalyzer {
  private video: HTMLVideoElement | null = null;
  private rafId: number | null = null;
  private lastCheckTime: number = 0;
  private checkInterval: number = 200;  // Default check every 200ms

  private worker: Worker | null = null;
  private performanceGovernor: PerformanceGovernor;
  private unsubscribeGovernor: (() => void) | null = null;

  private onWarningDetected: ((warning: Warning) => void) | null = null;

  // Statistics (synced from worker)
  private stats = {
    totalFramesAnalyzed: 0,
    bloodDetections: 0,
    goreDetections: 0,
    fireDetections: 0,
    vomitDetections: 0,
    medicalDetections: 0,
    underwaterDetections: 0,
    sceneChangeDetections: 0
  };

  constructor() {
    this.performanceGovernor = PerformanceGovernor.getInstance();
    this.initializeWorker();
  }

  private initializeWorker() {
    try {
      this.worker = new VisualAnalyzerWorker();
      if (this.worker) {
        this.worker.onmessage = (e) => this.handleWorkerMessage(e);
        this.worker.onerror = (e) => {
            logger.error('Visual Analyzer Worker error:', e);
        };
      }
    } catch (error) {
      logger.error('Failed to initialize Visual Analyzer Worker:', error);
    }
  }

  private handleWorkerMessage(e: MessageEvent) {
    const { type, payload } = e.data;

    if (type === 'detection') {
        this.handleDetection(payload as DetectionPayload);
    } else if (type === 'stats') {
        // Update local stats if worker sends them
        // this.stats = { ...this.stats, ...payload };
    }
  }

  private handleDetection(payload: DetectionPayload) {
      // Convert payload to Warning type if needed or pass directly
      // The worker sends a payload that matches Warning structure mostly
      const warning: Warning = {
          ...payload,
          // Ensure dates are Date objects
          createdAt: new Date(payload.createdAt),
          updatedAt: new Date(payload.updatedAt),
          categoryKey: payload.categoryKey as any,
          status: payload.status as any
      };

      // Update stats based on category (simple approximation)
      if (warning.categoryKey === 'blood') this.stats.bloodDetections++;
      else if (warning.categoryKey === 'gore') this.stats.goreDetections++;
      else if (warning.categoryKey === 'violence' && warning.description && warning.description.includes('Fire')) this.stats.fireDetections++;
      // ... update other stats based on category/description if needed for precise tracking

      this.onWarningDetected?.(warning);
  }

  /**
   * Initialize visual analyzer for a video element
   */
  initialize(videoElement: HTMLVideoElement): void {
    this.video = videoElement;

    logger.info('[TW VisualColorAnalyzer] ✅ Initialized with Web Worker');

    // Subscribe to performance governor
    this.unsubscribeGovernor = this.performanceGovernor.subscribe((tier) => {
        this.checkInterval = this.performanceGovernor.getRecommendedInterval(200);
        logger.debug(`Adjusted check interval to ${this.checkInterval}ms (Tier: ${tier})`);
    });

    this.startMonitoring();
  }

  /**
   * Start monitoring video frames
   */
  private startMonitoring(): void {
    this.lastCheckTime = Date.now();

    const checkLoop = () => {
      const now = Date.now();

      if (now - this.lastCheckTime >= this.checkInterval) {
        this.captureAndSendFrame();
        this.lastCheckTime = now;
      }

      this.rafId = requestAnimationFrame(checkLoop);
    };

    this.rafId = requestAnimationFrame(checkLoop);

    logger.info('[TW VisualColorAnalyzer] 🎨 Visual monitoring started');
  }

  /**
   * Stop monitoring
   */
  private stopMonitoring(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Capture current frame and send to worker
   */
  private async captureAndSendFrame(): Promise<void> {
    if (!this.video || !this.worker) return;

    if (this.video.paused || this.video.ended || this.video.readyState < 2) {
      return;
    }

    try {
      // Create ImageBitmap from video (efficient, async, off-main-thread friendly)
      // We use a smaller resolution for analysis to save performance
      const bitmap = await createImageBitmap(this.video, {
          resizeWidth: 320,
          resizeHeight: 180,
          resizeQuality: 'low'
      });

      this.stats.totalFramesAnalyzed++;

      // Transfer the bitmap to the worker (zero-copy)
      const payload: AnalyzeFramePayload = {
        timestamp: this.video.currentTime,
        bitmap: bitmap
      };

      this.worker.postMessage({
        type: 'analyze_frame',
        payload
      }, [bitmap]);

    } catch (error) {
      // Can fail if video is tainted (CORS) or closed
      // logger.debug('[TW VisualColorAnalyzer] Frame capture failed:', error);
    }
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
      enabled: true
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
    this.video = null;
    this.worker?.terminate();
    this.worker = null;
    this.onWarningDetected = null;
  }
}
