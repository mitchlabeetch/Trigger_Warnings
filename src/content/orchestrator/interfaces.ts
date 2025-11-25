import type { Warning } from '@shared/types/Warning.types';

export interface DetectionContext {
  video: HTMLVideoElement;
  audioContext?: AudioContext;
  analyser?: AnalyserNode;
  provider?: any;
}

export interface IDetector {
  id: string;
  isEnabled: boolean;

  /**
   * Initialize the detector with necessary context (video, audio, etc.)
   */
  initialize(context: DetectionContext): Promise<void> | void;

  /**
   * Start the detection process (continuous monitoring)
   */
  start(): void;

  /**
   * Stop the detection process
   */
  stop(): void;

  /**
   * Low power mode - suspend processing but keep state ready
   */
  sleep(): void;

  /**
   * High precision mode - resume active processing
   */
  wake(): void;

  /**
   * Register a callback for when a warning is detected
   */
  onDetection(callback: (warning: Warning) => void): void;

  /**
   * Clear internal state
   */
  clear(): void;

  /**
   * Clean up resources
   */
  dispose(): void;

  /**
   * Restart the detector (used for health recovery)
   */
  restart(): Promise<void> | void;

  /**
   * Get detector statistics
   */
  getStats(): any;
}
