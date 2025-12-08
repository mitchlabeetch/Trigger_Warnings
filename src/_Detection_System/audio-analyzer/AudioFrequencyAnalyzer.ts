/**
 * AUDIO FREQUENCY ANALYZER - REBUILT WITH AUDIO WORKLETS & WASM
 *
 * This version replaces the legacy setInterval/Web Worker approach with a modern
 * AudioWorklet pipeline for real-time, low-latency audio processing directly on
 * the audio rendering thread.
 *
 * Key Features:
 * - AudioWorklet for efficient processing.
 * - Placeholder for Wasm-based FFT and spectral fingerprinting.
 * - Eliminates main-thread polling, reducing CPU usage.
 *
 * Created by: Claude Code (Legendary Session)
 * Date: 2024-11-11
 * Refactored for AudioWorklet: Jules
 */

import type { Warning } from '@shared/types/Warning.types';
import type { DetectionPayload } from '@shared/types/analysis.types';
import { Logger } from '@shared/utils/logger';

const logger = new Logger('AudioFrequencyAnalyzer');

export class AudioFrequencyAnalyzer {
  private audioContext: AudioContext | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private video: HTMLVideoElement | null = null;

  // Statistics
  private stats = {
    totalChecks: 0, // This will be deprecated as checks are continuous
    detections: 0,
  };

  private onWarningDetected: ((warning: Warning) => void) | null = null;

  constructor() {
    // Initialization now happens in the `initialize` method
  }

  private async initializeWorklet() {
    if (!this.audioContext) return;

    try {
      // Load the worklet processor
      await this.audioContext.audioWorklet.addModule('src/content/audio-analyzer/processor.worklet.ts');

      // Create the worklet node
      this.workletNode = new AudioWorkletNode(this.audioContext, 'spectral-fingerprint-processor');

      // Set up communication
      this.workletNode.port.onmessage = (event) => this.handleWorkletMessage(event);

      logger.info('[TW AudioFrequencyAnalyzer] ✅ Audio Worklet node created.');

      // Placeholder: Load the binary bank of trigger sounds and send to worklet
      this.loadAndSendTriggerBank();

    } catch (error) {
      logger.error('[TW AudioFrequencyAnalyzer] ❌ Failed to initialize Audio Worklet:', error);
    }
  }

  private handleWorkletMessage(event: MessageEvent) {
    const { type, payload } = event.data;

    if (type === 'detection') {
      this.stats.detections++;
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

      this.onWarningDetected?.(warning);
  }

  /**
   * Initialize frequency analyzer
   */
  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    try {
      this.video = videoElement;

      // Create a new AudioContext
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Initialize the worklet
      await this.initializeWorklet();

      if (!this.workletNode) {
          throw new Error("Worklet node not available after initialization.");
      }

      // Create the source and connect the pipeline
      this.source = this.audioContext.createMediaElementSource(videoElement);
      this.source.connect(this.workletNode);
      this.workletNode.connect(this.audioContext.destination); // Connect to output

      logger.info(
        `[TW AudioFrequencyAnalyzer] ✅ Initialized with Audio Worklet pipeline. Sample Rate: ${this.audioContext.sampleRate}Hz`
      );

      // Start the audio context if it's suspended (e.g., due to browser policy)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

    } catch (error) {
      logger.error('[TW AudioFrequencyAnalyzer] ❌ Failed to initialize:', error);
    }
  }

  private async loadAndSendTriggerBank() {
    if (!this.workletNode) return;

    // In a real application, you would fetch this from a file or IndexedDB
    // For this example, we create a dummy ArrayBuffer
    const dummyBank = new ArrayBuffer(1024 * 50); // 50 mock fingerprints of 1KB each

    this.workletNode.port.postMessage({
        type: 'load_bank',
        payload: dummyBank
    });

    logger.info('[TW AudioFrequencyAnalyzer] 🏦 Sent trigger sound bank to worklet.');
  }

  /**
   * No longer needed with AudioWorklet
   */
  public startMonitoring(): void {
    logger.warn("[TW AudioFrequencyAnalyzer] startMonitoring is deprecated. Processing is continuous with AudioWorklet.");
  }

  public stopMonitoring(): void {
     logger.warn("[TW AudioFrequencyAnalyzer] stopMonitoring is deprecated. Processing is continuous with AudioWorklet.");
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
      enabled: this.audioContext !== null && this.workletNode !== null,
    };
  }

  /**
   * Clear events
   */
  clear(): void {
    // The worklet is stateless in this design, so no reset needed.
  }

  /**
   * Dispose
   */
  dispose(): void {
    this.source?.disconnect();
    this.workletNode?.disconnect();
    this.audioContext?.close();

    this.source = null;
    this.workletNode = null;
    this.audioContext = null;
    this.onWarningDetected = null;
  }
}
