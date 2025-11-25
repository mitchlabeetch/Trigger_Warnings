/**
 * VISUAL ANALYZER (Main Thread Orchestrator)
 *
 * This script orchestrates the visual analysis pipeline from the main thread.
 * It is responsible for:
 *
 * 1.  **Instantiating and managing the Visual Analysis Web Worker.**
 * 2.  **Capturing video frames as ImageBitmap objects.**
 * 3.  **Transferring frames to the worker for processing.**
 * 4.  **Receiving inference results from the worker.**
 * 5.  **Dispatching warnings to the rest of the application.**
 *
 * This architecture ensures that all heavy computation (TensorFlow.js inference)
 * occurs off the main thread, preventing UI blocking and maintaining a smooth
 * user experience.
 *
 * Created by: Claude Code (Algorithm 3.0 Phase 3)
 * Date: 2025-11-24
 */

import { Logger } from '@shared/utils/logger';
import type { CNNInferenceResult } from '../workers/visual-analysis.worker';

const logger = new Logger('VisualAnalyzer');

export class VisualAnalyzer {
  private worker: Worker | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;

  constructor(private onWarning: (result: CNNInferenceResult) => void) {
    logger.info('[VisualAnalyzer] Orchestrator initialized');
  }

  public async initialize(videoElement: HTMLVideoElement): Promise<void> {
    this.videoElement = videoElement;

    try {
      this.worker = new Worker(
        new URL('../workers/visual-analysis.worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (event: MessageEvent) => {
        const { type, payload } = event.data;
        if (type === 'result') {
          this.onWarning(payload);
        } else if (type === 'init-complete') {
            if(payload.success) {
                logger.info('[VisualAnalyzer] Worker initialization complete.');
                this.start();
            } else {
                logger.error('[VisualAnalyzer] Worker initialization failed.');
            }
        }
      };

      this.worker.onerror = (error) => {
        logger.error('[VisualAnalyzer] Worker error:', error);
      };

      logger.info('[VisualAnalyzer] Initializing worker...');
      this.worker.postMessage({ type: 'init' });

    } catch (error) {
      logger.error('[VisualAnalyzer] Failed to initialize worker:', error);
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.captureLoop();
    logger.info('[VisualAnalyzer] Started frame capture loop.');
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.worker?.postMessage({ type: 'stop' });
    logger.info('[VisualAnalyzer] Stopped frame capture loop.');
  }

  private captureLoop = async (): Promise<void> => {
    if (!this.isRunning || !this.videoElement || this.videoElement.readyState < 2) {
      if (this.isRunning) {
        this.animationFrameId = requestAnimationFrame(this.captureLoop);
      }
      return;
    }

    try {
      const imageBitmap = await createImageBitmap(this.videoElement);
      this.worker?.postMessage({ type: 'classify', payload: { imageBitmap } }, [imageBitmap]);
    } catch (error) {
      logger.error('[VisualAnalyzer] Error capturing frame:', error);
    }

    if (this.isRunning) {
      this.animationFrameId = requestAnimationFrame(this.captureLoop);
    }
  };

  public dispose(): void {
    this.stop();
    this.worker?.terminate();
    this.worker = null;
    logger.info('[VisualAnalyzer] Disposed.');
  }
}
