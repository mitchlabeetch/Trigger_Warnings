import type { Profile } from '@shared/types/Profile.types';
import type { IDetector, DetectionContext } from './interfaces';
import { Logger } from '@shared/utils/logger';

// Analyzers
import { SubtitleAnalyzerV2 } from '../subtitle-analyzer-v2/SubtitleAnalyzerV2';
import { AudioWaveformAnalyzer } from '../audio-analyzer/AudioWaveformAnalyzer';
import { AudioFrequencyAnalyzer } from '../audio-analyzer/AudioFrequencyAnalyzer';
import { VisualColorAnalyzer } from '../visual-analyzer/VisualColorAnalyzer';
import { PhotosensitivityDetector } from '../photosensitivity-detector/PhotosensitivityDetector';

const logger = new Logger('DetectorFactory');

/**
 * Adapter wrapper to make existing analyzers implement IDetector
 */
abstract class BaseAdapter implements IDetector {
  abstract id: string;
  isEnabled: boolean = true;
  protected analyzer: any;
  protected onDetectionCallback: ((warning: any) => void) | null = null;
  protected context: DetectionContext | null = null;

  constructor(analyzer: any) {
    this.analyzer = analyzer;
  }

  initialize(context: DetectionContext): void {
      this.context = context;
      this.initializeAnalyzer(context);
  }

  abstract initializeAnalyzer(context: DetectionContext): Promise<void> | void;

  async restart(): Promise<void> {
      if (!this.context) return;

      this.dispose();
      // Re-create analyzer instance
      this.analyzer = this.createAnalyzer();

      await this.initializeAnalyzer(this.context);

      if (this.onDetectionCallback && this.analyzer.onDetection) {
          this.analyzer.onDetection(this.onDetectionCallback);
      }

      // If was previously awake/sleeping, restore state?
      // For now, let's assume restart puts it in default state (started)
  }

  abstract createAnalyzer(): any;

  start(): void {
    // Most analyzers start on initialize, but we can make this explicit if needed
    // For now, we assume they are started.
  }

  stop(): void {
    // If analyzer has stop, use it. Usually they have dispose/stopMonitoring
    if (this.analyzer.stopMonitoring) {
      this.analyzer.stopMonitoring();
    }
  }

  sleep(): void {
    // Default sleep implementation: stop monitoring
    this.stop();
  }

  wake(): void {
    // Default wake implementation: start monitoring
    if (this.analyzer.startMonitoring) {
      this.analyzer.startMonitoring();
    } else if (this.analyzer.wake) {
      this.analyzer.wake();
    }
  }

  onDetection(callback: (warning: any) => void): void {
    this.onDetectionCallback = callback;
    if (this.analyzer.onDetection) {
      this.analyzer.onDetection(callback);
    }
  }

  clear(): void {
    if (this.analyzer.clear) this.analyzer.clear();
  }

  dispose(): void {
    if (this.analyzer.dispose) this.analyzer.dispose();
  }

  getStats(): any {
    return this.analyzer.getStats ? this.analyzer.getStats() : {};
  }
}

class SubtitleAdapter extends BaseAdapter {
  id = 'subtitle';

  createAnalyzer() {
      return new SubtitleAnalyzerV2();
  }

  initializeAnalyzer(context: DetectionContext): void {
    this.analyzer.initialize(context.video);
  }

  // Subtitle analyzer is the Sentinel, it shouldn't sleep ideally,
  // or if it sleeps, it stops text processing.
  // But per architecture, it is "always on".
  sleep(): void {
    // No-op: Sentinel never sleeps
  }

  wake(): void {
    // No-op
  }

  onWake(callback: () => void): void {
      if (this.analyzer.onWake) {
          this.analyzer.onWake(callback);
      }
  }
}

class AudioWaveformAdapter extends BaseAdapter {
  id = 'audio-waveform';

  createAnalyzer() {
      return new AudioWaveformAnalyzer();
  }

  initializeAnalyzer(context: DetectionContext): void {
    this.analyzer.initialize(context.video);
  }
}

class AudioFrequencyAdapter extends BaseAdapter {
  id = 'audio-frequency';

  createAnalyzer() {
      return new AudioFrequencyAnalyzer();
  }

  initializeAnalyzer(context: DetectionContext): void {
    this.analyzer.initialize(context.video, context.audioContext, context.analyser);
  }
}

class VisualAdapter extends BaseAdapter {
  id = 'visual';

  createAnalyzer() {
      return new VisualColorAnalyzer();
  }

  initializeAnalyzer(context: DetectionContext): void {
    this.analyzer.initialize(context.video);
  }
}

class PhotosensitivityAdapter extends BaseAdapter {
  id = 'photosensitivity';

  createAnalyzer() {
      return new PhotosensitivityDetector();
  }

  initializeAnalyzer(context: DetectionContext): void {
    this.analyzer.initialize(context.video);
  }
}

export class DetectorFactory {
  /**
   * Create all enabled detectors based on profile
   */
  static createDetectors(profile: Profile, config: any): IDetector[] {
    const detectors: IDetector[] = [];

    // 1. Subtitle Analyzer (Sentinel - Always created if enabled)
    if (config.enableSubtitleAnalysis) {
      detectors.push(new SubtitleAdapter(new SubtitleAnalyzerV2()));
    }

    // 2. Audio Analyzers
    if (config.enableAudioWaveform) {
      detectors.push(new AudioWaveformAdapter(new AudioWaveformAnalyzer()));
    }

    if (config.enableAudioFrequency) {
      detectors.push(new AudioFrequencyAdapter(new AudioFrequencyAnalyzer()));
    }

    // 3. Visual Analyzers
    if (config.enableVisualAnalysis) {
      detectors.push(new VisualAdapter(new VisualColorAnalyzer()));
    }

    if (config.enablePhotosensitivity) {
      detectors.push(new PhotosensitivityAdapter(new PhotosensitivityDetector()));
    }

    logger.info(`[DetectorFactory] Created ${detectors.length} detectors`);
    return detectors;
  }
}
