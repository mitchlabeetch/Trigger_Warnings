/**
 * VISUAL COLOR ANALYZER
 *
 * Detects trigger warnings from visual color analysis.
 *
 * REFACTORED: Now integrates SceneHasher on the main thread to check a perceptual
 * hash of the scene *before* sending the frame to the worker for analysis. This
 * avoids unnecessary worker communication and processing for known scenes.
 *
 * Created by: Claude Code (Legendary Session)
 * Date: 2024-11-11
 * Refactored for Hashing Architecture: Jules
 */

import type { Warning } from '@shared/types/Warning.types';
import type { AnalyzeFramePayload, DetectionPayload } from '@shared/types/analysis.types';
import { Logger } from '@shared/utils/logger';
import { PerformanceGovernor } from '../performance/PerformanceGovernor';
import { analysisStore } from '../store/AnalysisStore';
import { SceneHasher } from '../hashing/SceneHasher';
// @ts-ignore - Query params for worker import
import VisualAnalyzerWorker from './VisualAnalyzer.worker?worker';

const logger = new Logger('VisualColorAnalyzer');

export class VisualColorAnalyzer {
  private video: HTMLVideoElement | null = null;
  private rafId: number | null = null;
  private lastCheckTime: number = 0;
  private checkInterval: number = 200; // Default, will be updated by governor

  private worker: Worker | null = null;
  private performanceGovernor: PerformanceGovernor;
  private unsubscribeGovernor: (() => void) | null = null;
  private sceneHasher: SceneHasher;

  private onWarningDetected: ((warning: Warning) => void) | null = null;

  constructor() {
    this.performanceGovernor = PerformanceGovernor.getInstance();
    this.sceneHasher = new SceneHasher();
    this.initializeWorker();
  }

  private initializeWorker() {
    try {
      this.worker = new VisualAnalyzerWorker();
      this.worker.onmessage = (e) => this.handleWorkerMessage(e);
      this.worker.onerror = (e) => logger.error('Visual Analyzer Worker error:', e);
    } catch (error) {
      logger.error('Failed to initialize Visual Analyzer Worker:', error);
    }
  }

  private handleWorkerMessage(e: MessageEvent) {
    const { type, payload } = e.data;

    if (type === 'detection') {
      this.handleDetection(payload);
    } else if (type === 'analysis_result') {
      analysisStore.visualData.set(payload);
    }
  }

  private handleDetection(payload: DetectionPayload & { hash?: string }) {
    // If the worker found a trigger, store its hash
    if (payload.hash) {
      this.sceneHasher.storeHash(payload.hash, 'Trigger');
    }

    const warning: Warning = {
      ...payload,
      createdAt: new Date(payload.createdAt),
      updatedAt: new Date(payload.updatedAt),
      categoryKey: payload.categoryKey as any,
      status: payload.status as any
    };
    this.onWarningDetected?.(warning);
  }

  initialize(videoElement: HTMLVideoElement): void {
    this.video = videoElement;
    this.sceneHasher.initialize(videoElement);
    logger.info('[TW VisualColorAnalyzer] ✅ Initialized with Web Worker and SceneHasher.');

    this.unsubscribeGovernor = this.performanceGovernor.subscribe((tier) => {
      this.checkInterval = this.performanceGovernor.getRecommendedInterval(200);
    });

    this.startMonitoring();
  }

  public startMonitoring(): void {
    if (this.rafId !== null) return;
    this.lastCheckTime = Date.now();

    const checkLoop = () => {
      if (Date.now() - this.lastCheckTime >= this.checkInterval) {
        this.analyzeCurrentScene();
        this.lastCheckTime = Date.now();
      }
      this.rafId = requestAnimationFrame(checkLoop);
    };
    this.rafId = requestAnimationFrame(checkLoop);
    logger.info('[TW VisualColorAnalyzer] 🎨 Visual monitoring started');
  }

  private async analyzeCurrentScene(): Promise<void> {
    if (!this.video || this.video.paused || this.video.ended) return;

    // 1. Generate hash for the current frame
    const hash = await this.sceneHasher.generateHashForCurrentFrame();
    if (!hash) return; // Hashing failed (e.g., tainted canvas)

    // 2. Check the cache
    const cacheStatus = await this.sceneHasher.checkCache(hash);

    if (cacheStatus === 'Safe') {
      // Scene is known to be safe, do nothing.
      return;
    }

    if (cacheStatus === 'Trigger') {
      // Scene is a known trigger, dispatch a warning immediately without re-analyzing.
      this.handleDetection({
        id: `cached-${hash}`,
        videoId: 'visual-hash-detected',
        categoryKey: 'violence', // Generic, would need to store more context in DB
        startTime: this.video.currentTime,
        endTime: this.video.currentTime + 3,
        submittedBy: 'scene-hasher',
        status: 'approved',
        score: 0,
        confidenceLevel: 99,
        requiresModeration: false,
        description: 'Previously identified trigger scene detected via perceptual hash.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return;
    }

    // 3. If unknown, send to worker for full analysis
    this.captureAndSendFrame(hash);
  }

  private async captureAndSendFrame(hash: string): Promise<void> {
    if (!this.video || !this.worker || this.video.readyState < 2) return;

    try {
      const bitmap = await createImageBitmap(this.video, {
        resizeWidth: 320,
        resizeHeight: 180,
        resizeQuality: 'low'
      });

      const payload: AnalyzeFramePayload & { hash: string } = {
        timestamp: this.video.currentTime,
        bitmap: bitmap,
        hash: hash // Pass the hash to the worker
      };

      this.worker.postMessage({ type: 'analyze_frame', payload }, [bitmap]);
    } catch (error) {
      // Frame capture can fail
    }
  }

  onDetection(callback: (warning: Warning) => void): void {
    this.onWarningDetected = callback;
  }

  getStats(): any {
    return { enabled: true };
  }

  clear(): void {
    this.worker?.postMessage({ type: 'reset' });
  }

  dispose(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.unsubscribeGovernor?.();
    this.video = null;
    this.worker?.terminate();
    this.worker = null;
    this.sceneHasher.dispose();
    this.onWarningDetected = null;
  }
}
