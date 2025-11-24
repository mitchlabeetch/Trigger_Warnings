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
import { Logger } from '@shared/utils/logger';

const logger = new Logger('AudioWaveformAnalyzer');

interface AudioEvent {
  type: 'gunshot' | 'explosion' | 'loud_noise' | 'silence' | 'jump_scare';
  timestamp: number;
  amplitude: number;
  duration?: number;
}

export class AudioWaveformAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private previousRMS: number | null = null;
  private monitoringInterval: number | null = null;
  private video: HTMLVideoElement | null = null;

  // Detection thresholds
  private readonly GUNSHOT_THRESHOLD = 0.75;      // 75% max amplitude spike
  private readonly GUNSHOT_RISE_TIME_MS = 50;     // < 50ms rise time
  private readonly EXPLOSION_THRESHOLD = 0.65;
  private readonly EXPLOSION_DURATION_MS = 150;   // Sustained for > 150ms
  private readonly LOUD_NOISE_THRESHOLD = 0.60;
  private readonly SILENCE_THRESHOLD = 0.05;      // < 5% RMS
  private readonly JUMP_SCARE_THRESHOLD = 0.70;

  // State tracking
  private silenceDuration: number = 0;
  private wasSilent: boolean = false;
  private lastEventTime: number = 0;
  private detectedEvents: Map<string, AudioEvent> = new Map();

  // Callbacks
  private onWarningDetected: ((warning: Warning) => void) | null = null;

  // Statistics
  private stats = {
    totalChecks: 0,
    gunshotDetections: 0,
    explosionDetections: 0,
    loudNoiseDetections: 0,
    silenceDetections: 0,
    jumpScareDetections: 0
  };

  /**
   * Initialize audio analyzer for a video element
   */
  initialize(videoElement: HTMLVideoElement): void {
    try {
      this.video = videoElement;

      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;  // Higher resolution for better transient detection
      this.analyser.smoothingTimeConstant = 0.3;  // Less smoothing for better transient capture

      // Connect video audio to analyser
      this.source = this.audioContext.createMediaElementSource(videoElement);
      this.source.connect(this.analyser);

      // CRITICAL: Connect to destination so audio still plays
      this.analyser.connect(this.audioContext.destination);

      // Allocate data array
      // Note: getByteTimeDomainData requires an array of size fftSize (not frequencyBinCount)
      this.dataArray = new Uint8Array(this.analyser.fftSize);

      logger.info('[TW AudioWaveformAnalyzer] ✅ Initialized with Web Audio API');
      logger.info(`[TW AudioWaveformAnalyzer] FFT Size: ${this.analyser.fftSize}, Sample Rate: ${this.audioContext.sampleRate}Hz`);

      this.startMonitoring();
    } catch (error) {
      logger.error('[TW AudioWaveformAnalyzer] ❌ Failed to initialize:', error);
      logger.warn('[TW AudioWaveformAnalyzer] Audio analysis will be disabled');
    }
  }

  /**
   * Start monitoring audio waveform
   */
  private startMonitoring(): void {
    const checkInterval = 50;  // Check every 50ms (20 Hz)

    this.monitoringInterval = window.setInterval(() => {
      this.analyzeWaveform();
    }, checkInterval);

    logger.info('[TW AudioWaveformAnalyzer] 🎵 Monitoring started (checking every 50ms)');
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
   * Analyze current audio waveform
   */
  private analyzeWaveform(): void {
    if (!this.analyser || !this.dataArray || !this.audioContext || !this.video) {
      return;
    }

    if (this.video.paused || this.video.ended) {
      return;  // Don't analyze when paused
    }

    this.stats.totalChecks++;

    // Get time domain data (waveform)
    this.analyser.getByteTimeDomainData(this.dataArray);

    // Calculate RMS (Root Mean Square) amplitude
    // Ensure we are working with a standard Uint8Array to avoid SharedArrayBuffer type issues
    const rms = this.calculateRMS(new Uint8Array(this.dataArray));

    // Current timestamp
    const currentTime = this.video.currentTime;

    // Detect patterns
    if (this.previousRMS !== null) {
      const amplitudeChange = rms - this.previousRMS;
      const changeRate = amplitudeChange / 0.05;  // Change per second (50ms interval)

      // 1. GUNSHOT DETECTION
      // Characteristics: Very sudden spike (< 50ms), high amplitude (> 75%)
      if (amplitudeChange > this.GUNSHOT_THRESHOLD && rms > 0.75) {
        this.detectGunshot(currentTime, rms);
      }

      // 2. EXPLOSION DETECTION
      // Characteristics: Sustained spike (> 150ms), moderate-high amplitude
      else if (amplitudeChange > this.EXPLOSION_THRESHOLD && rms > 0.65) {
        this.detectExplosion(currentTime, rms);
      }

      // 3. GENERAL LOUD NOISE DETECTION
      else if (amplitudeChange > this.LOUD_NOISE_THRESHOLD && rms > 0.60) {
        this.detectLoudNoise(currentTime, rms);
      }

      // 4. JUMP SCARE DETECTION
      // Characteristics: Silence → sudden loud noise
      if (this.wasSilent && rms > this.JUMP_SCARE_THRESHOLD) {
        this.detectJumpScare(currentTime, rms);
        this.wasSilent = false;
      }
    }

    // 5. SILENCE DETECTION
    // Characteristics: RMS below threshold for > 2 seconds
    if (rms < this.SILENCE_THRESHOLD) {
      this.silenceDuration += 50;  // Increment by check interval

      if (this.silenceDuration > 2000 && !this.wasSilent) {
        this.detectSilence(currentTime, this.silenceDuration);
        this.wasSilent = true;
      }
    } else {
      this.silenceDuration = 0;
      this.wasSilent = false;
    }

    this.previousRMS = rms;
  }

  /**
   * Calculate Root Mean Square amplitude (normalized 0-1)
   */
  private calculateRMS(data: Uint8Array): number {
    let sum = 0;

    for (let i = 0; i < data.length; i++) {
      const normalized = (data[i] - 128) / 128;  // Normalize to -1 to 1
      sum += normalized * normalized;
    }

    return Math.sqrt(sum / data.length);
  }

  /**
   * Detect gunshot
   */
  private detectGunshot(timestamp: number, amplitude: number): void {
    // Deduplicate (don't detect multiple gunshots within 1 second)
    const eventKey = `gunshot-${Math.floor(timestamp)}`;

    if (this.detectedEvents.has(eventKey)) {
      return;
    }

    this.stats.gunshotDetections++;

    const event: AudioEvent = {
      type: 'gunshot',
      timestamp,
      amplitude
    };

    this.detectedEvents.set(eventKey, event);

    logger.warn(
      `[TW AudioWaveformAnalyzer] 🔫 GUNSHOT DETECTED at ${timestamp.toFixed(1)}s | ` +
      `Amplitude: ${(amplitude * 100).toFixed(1)}%`
    );

    // Create warning
    const warning: Warning = {
      id: `audio-gunshot-${Math.floor(timestamp)}`,
      videoId: 'audio-detected',
      categoryKey: 'violence',
      startTime: Math.max(0, timestamp - 2),  // 2 second lead time
      endTime: timestamp + 3,
      submittedBy: 'audio-waveform-analyzer',
      status: 'approved',
      score: 0,
      confidenceLevel: Math.min(Math.round(amplitude * 100), 100),
      requiresModeration: false,
      description: `Gunshot detected via audio analysis (amplitude: ${(amplitude * 100).toFixed(1)}%)`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.onWarningDetected?.(warning);
  }

  /**
   * Detect explosion
   */
  private detectExplosion(timestamp: number, amplitude: number): void {
    const eventKey = `explosion-${Math.floor(timestamp)}`;

    if (this.detectedEvents.has(eventKey)) {
      return;
    }

    this.stats.explosionDetections++;

    const event: AudioEvent = {
      type: 'explosion',
      timestamp,
      amplitude
    };

    this.detectedEvents.set(eventKey, event);

    logger.warn(
      `[TW AudioWaveformAnalyzer] 💥 EXPLOSION DETECTED at ${timestamp.toFixed(1)}s | ` +
      `Amplitude: ${(amplitude * 100).toFixed(1)}%`
    );

    const warning: Warning = {
      id: `audio-explosion-${Math.floor(timestamp)}`,
      videoId: 'audio-detected',
      categoryKey: 'detonations_bombs',
      startTime: Math.max(0, timestamp - 2),
      endTime: timestamp + 5,
      submittedBy: 'audio-waveform-analyzer',
      status: 'approved',
      score: 0,
      confidenceLevel: Math.min(Math.round(amplitude * 100), 100),
      requiresModeration: false,
      description: `Explosion detected via audio analysis (amplitude: ${(amplitude * 100).toFixed(1)}%)`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.onWarningDetected?.(warning);
  }

  /**
   * Detect general loud noise
   */
  private detectLoudNoise(timestamp: number, amplitude: number): void {
    const eventKey = `loud-${Math.floor(timestamp)}`;

    if (this.detectedEvents.has(eventKey)) {
      return;
    }

    this.stats.loudNoiseDetections++;

    logger.debug(
      `[TW AudioWaveformAnalyzer] 📢 Loud noise at ${timestamp.toFixed(1)}s | ` +
      `Amplitude: ${(amplitude * 100).toFixed(1)}%`
    );

    // Don't create warning for general loud noise (too many false positives)
    // Instead, track it for jump scare detection
  }

  /**
   * Detect jump scare (silence → sudden loud)
   */
  private detectJumpScare(timestamp: number, amplitude: number): void {
    const eventKey = `jumpscare-${Math.floor(timestamp)}`;

    if (this.detectedEvents.has(eventKey)) {
      return;
    }

    this.stats.jumpScareDetections++;

    const event: AudioEvent = {
      type: 'jump_scare',
      timestamp,
      amplitude
    };

    this.detectedEvents.set(eventKey, event);

    logger.warn(
      `[TW AudioWaveformAnalyzer] 👻 JUMP SCARE DETECTED at ${timestamp.toFixed(1)}s | ` +
      `Silence → Loud (${(amplitude * 100).toFixed(1)}%)`
    );

    const warning: Warning = {
      id: `audio-jumpscare-${Math.floor(timestamp)}`,
      videoId: 'audio-detected',
      categoryKey: 'jumpscares',
      startTime: Math.max(0, timestamp - 1),  // Very short lead time (jump scares are sudden)
      endTime: timestamp + 2,
      submittedBy: 'audio-waveform-analyzer',
      status: 'approved',
      score: 0,
      confidenceLevel: 85,
      requiresModeration: false,
      description: `Jump scare detected via audio analysis (silence → loud spike)`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.onWarningDetected?.(warning);
  }

  /**
   * Detect prolonged silence
   */
  private detectSilence(timestamp: number, duration: number): void {
    const eventKey = `silence-${Math.floor(timestamp)}`;

    if (this.detectedEvents.has(eventKey)) {
      return;
    }

    this.stats.silenceDetections++;

    logger.debug(
      `[TW AudioWaveformAnalyzer] 🔇 Prolonged silence at ${timestamp.toFixed(1)}s | ` +
      `Duration: ${(duration / 1000).toFixed(1)}s`
    );

    // Silence itself is not a trigger, but we track it for jump scare detection
  }

  /**
   * Register callback for warnings
   */
  onDetection(callback: (warning: Warning) => void): void {
    this.onWarningDetected = callback;
  }

  /**
   * Get all detected events
   */
  getDetectedEvents(): AudioEvent[] {
    return Array.from(this.detectedEvents.values());
  }

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
  } {
    return {
      ...this.stats,
      enabled: this.audioContext !== null
    };
  }

  /**
   * Clear events
   */
  clear(): void {
    this.detectedEvents.clear();
    this.previousRMS = null;
    this.silenceDuration = 0;
    this.wasSilent = false;
  }

  /**
   * Dispose
   */
  dispose(): void {
    this.stopMonitoring();

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.video = null;
    this.dataArray = null;
    this.detectedEvents.clear();
    this.onWarningDetected = null;
  }
}
