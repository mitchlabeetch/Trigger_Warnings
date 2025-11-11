/**
 * VISUAL COLOR ANALYZER
 *
 * Detects trigger warnings from visual color analysis
 * Uses Canvas API for real-time frame analysis
 *
 * Detects:
 * - Blood (bright red channel spike, R > 200, R > G+B)
 * - Gore (red + dark shadows + irregular patterns)
 * - Fire (orange/yellow saturation + brightness)
 * - Medical scenes (sterile white + blue-green medical tones)
 * - Underwater scenes (blue-green tint + low saturation)
 * - Dark/night scenes (low luminance sustained)
 * - Scene changes (rapid cuts, transitions)
 *
 * Browser Support: Universal (Canvas API)
 *
 * Created by: Claude Code (Legendary Session)
 * Date: 2024-11-11
 */

import type { Warning } from '@shared/types/Warning.types';
import { Logger } from '@shared/utils/logger';

const logger = new Logger('VisualColorAnalyzer');

interface ColorAnalysis {
  brightRed: number;          // 0-1 (percentage of frame)
  orangeYellow: number;       // Fire detection
  yellowBrown: number;        // Vomit detection - EQUAL TREATMENT
  greenishYellow: number;     // Vomit detection (bile colors)
  sterileWhite: number;       // Medical scenes
  medicalBlueGreen: number;   // Medical equipment/scrubs
  blueGreen: number;          // Underwater
  darkPixels: number;         // Shadow/night
  brightness: number;         // Average luminance
  saturation: number;         // Color intensity
  irregularity: number;       // Edge complexity (gore indicator)
  chunkiness: number;         // Texture irregularity (vomit, gore)
}

interface VisualEvent {
  type: 'blood' | 'gore' | 'fire' | 'medical' | 'underwater' | 'scene_change' | 'vomit';
  timestamp: number;
  confidence: number;
  colorAnalysis: ColorAnalysis;
}

export class VisualColorAnalyzer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private video: HTMLVideoElement | null = null;
  private rafId: number | null = null;
  private lastCheckTime: number = 0;
  private checkInterval: number = 200;  // Check every 200ms (5 fps)

  // Frame history for scene change detection
  private previousFrame: ImageData | null = null;
  private sceneChangeCount: number = 0;
  private sceneChangeWindow: number = 5000;  // 5 seconds

  // Detection state
  private detectedEvents: Map<string, VisualEvent> = new Map();
  private onWarningDetected: ((warning: Warning) => void) | null = null;

  // Statistics
  private stats = {
    totalFramesAnalyzed: 0,
    bloodDetections: 0,
    goreDetections: 0,
    fireDetections: 0,
    vomitDetections: 0,  // EQUAL TREATMENT: Vomit tracking added
    medicalDetections: 0,
    underwaterDetections: 0,
    sceneChangeDetections: 0
  };

  constructor() {
    // Create canvas for frame analysis
    this.canvas = document.createElement('canvas');
    this.canvas.width = 320;   // Reduced resolution for performance
    this.canvas.height = 180;
    this.ctx = this.canvas.getContext('2d', {
      willReadFrequently: true  // Optimize for frequent getImageData calls
    }) as CanvasRenderingContext2D;
  }

  /**
   * Initialize visual analyzer for a video element
   */
  initialize(videoElement: HTMLVideoElement): void {
    this.video = videoElement;

    logger.info(
      `[TW VisualColorAnalyzer] ✅ Initialized | ` +
      `Canvas: ${this.canvas.width}x${this.canvas.height}`
    );

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
        this.analyzeFrame();
        this.lastCheckTime = now;
      }

      this.rafId = requestAnimationFrame(checkLoop);
    };

    this.rafId = requestAnimationFrame(checkLoop);

    logger.info('[TW VisualColorAnalyzer] 🎨 Visual monitoring started (checking every 200ms)');
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
   * Analyze current video frame
   */
  private analyzeFrame(): void {
    if (!this.video) return;

    if (this.video.paused || this.video.ended) {
      return;
    }

    try {
      // Draw current frame to canvas
      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

      // Get image data
      const imageData = this.ctx.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );

      this.stats.totalFramesAnalyzed++;

      // Analyze colors
      const analysis = this.analyzeColors(imageData);

      const currentTime = this.video.currentTime;

      // Detect triggers
      this.detectBlood(currentTime, analysis);
      this.detectGore(currentTime, analysis);
      this.detectFire(currentTime, analysis);
      this.detectVomit(currentTime, analysis);  // EQUAL TREATMENT: Vomit detection
      this.detectMedical(currentTime, analysis);
      this.detectUnderwater(currentTime, analysis);

      // Scene change detection
      if (this.previousFrame) {
        this.detectSceneChange(currentTime, imageData, this.previousFrame);
      }

      this.previousFrame = imageData;

    } catch (error) {
      // Canvas access can fail due to CORS
      logger.debug('[TW VisualColorAnalyzer] Frame analysis failed (likely CORS):', error);
    }
  }

  /**
   * Analyze color composition of frame
   */
  private analyzeColors(imageData: ImageData): ColorAnalysis {
    const data = imageData.data;
    const totalPixels = data.length / 4;

    let brightRedCount = 0;
    let orangeYellowCount = 0;
    let yellowBrownCount = 0;        // VOMIT: yellowish-brown colors
    let greenishYellowCount = 0;     // VOMIT: bile green-yellow
    let sterileWhiteCount = 0;
    let medicalBlueGreenCount = 0;
    let blueGreenCount = 0;
    let darkPixelCount = 0;
    let totalBrightness = 0;
    let totalSaturation = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Calculate luminance (WCAG formula)
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      // 1. BLOOD: Bright red (R > 200, R > G+50, R > B+50)
      if (r > 200 && r > g + 50 && r > b + 50) {
        brightRedCount++;
      }

      // 2. FIRE: Orange/Yellow (R > 200, G > 150, B < 100)
      if (r > 200 && g > 150 && b < 100) {
        orangeYellowCount++;
      }

      // 2b. VOMIT: Yellow-Brown (R > 150, G > 130, B < 100, yellowish-brown tones)
      // EQUAL TREATMENT: Vomit detection equivalent to blood detection
      if (r > 150 && g > 130 && r > b + 50 && g > b + 40 && b < 100) {
        yellowBrownCount++;
      }

      // 2c. VOMIT: Greenish-Yellow/Bile (G > 150, R > 120, B < 120, greenish tint)
      if (g > 150 && r > 120 && r < 200 && g > r && g > b + 30 && b < 120) {
        greenishYellowCount++;
      }

      // 3. STERILE WHITE: High luminance, low saturation
      if (luminance > 220 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20) {
        sterileWhiteCount++;
      }

      // 4. MEDICAL BLUE-GREEN: (B > 150, G > 150, R < 120)
      if (b > 150 && g > 150 && r < 120) {
        medicalBlueGreenCount++;
      }

      // 5. BLUE-GREEN TINT: (B > G > R)
      if (b > g && g > r && b > 100) {
        blueGreenCount++;
      }

      // 6. DARK PIXELS
      if (luminance < 50) {
        darkPixelCount++;
      }

      totalBrightness += luminance;

      // Calculate saturation
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      totalSaturation += saturation;
    }

    // Calculate irregularity (edge complexity) and chunkiness
    const irregularity = this.calculateIrregularity(imageData);
    const chunkiness = this.calculateChunkiness(imageData);

    return {
      brightRed: brightRedCount / totalPixels,
      orangeYellow: orangeYellowCount / totalPixels,
      yellowBrown: yellowBrownCount / totalPixels,           // VOMIT
      greenishYellow: greenishYellowCount / totalPixels,     // VOMIT
      sterileWhite: sterileWhiteCount / totalPixels,
      medicalBlueGreen: medicalBlueGreenCount / totalPixels,
      blueGreen: blueGreenCount / totalPixels,
      darkPixels: darkPixelCount / totalPixels,
      brightness: totalBrightness / totalPixels / 255,
      saturation: totalSaturation / totalPixels,
      irregularity,
      chunkiness  // VOMIT: texture irregularity
    };
  }

  /**
   * Calculate irregularity (edge density) using simplified Sobel-like approach
   * High irregularity = gore, violence
   * Low irregularity = smooth surfaces
   */
  private calculateIrregularity(imageData: ImageData): number {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    let edgeCount = 0;
    const sampleRate = 4;  // Sample every 4th pixel for performance

    // Simplified edge detection: Check luminance gradients
    for (let y = 1; y < height - 1; y += sampleRate) {
      for (let x = 1; x < width - 1; x += sampleRate) {
        const idx = (y * width + x) * 4;

        // Get luminance of center pixel
        const center = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];

        // Get luminance of right neighbor
        const right = 0.299 * data[idx + 4] + 0.587 * data[idx + 5] + 0.114 * data[idx + 6];

        // Get luminance of bottom neighbor
        const bottom = 0.299 * data[idx + width * 4] + 0.587 * data[idx + width * 4 + 1] + 0.114 * data[idx + width * 4 + 2];

        // Calculate gradients
        const gradientX = Math.abs(center - right);
        const gradientY = Math.abs(center - bottom);

        // If gradient is high, it's an edge
        if (gradientX > 30 || gradientY > 30) {
          edgeCount++;
        }
      }
    }

    const sampledPixels = ((width / sampleRate) * (height / sampleRate));
    return edgeCount / sampledPixels;
  }

  /**
   * Calculate chunkiness (texture irregularity) - useful for vomit, gore detection
   * Looks for inconsistent color patches (chunky appearance)
   */
  private calculateChunkiness(imageData: ImageData): number {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    let inconsistentPatches = 0;
    const sampleRate = 8;  // Sample every 8th pixel for performance
    const patchSize = 4;   // Look at 4x4 pixel patches

    // Check for color variance in small patches
    for (let y = 0; y < height - patchSize; y += sampleRate) {
      for (let x = 0; x < width - patchSize; x += sampleRate) {
        const idx = (y * width + x) * 4;

        // Get average color of patch
        let avgR = 0, avgG = 0, avgB = 0;
        let maxVariance = 0;

        for (let py = 0; py < patchSize; py++) {
          for (let px = 0; px < patchSize; px++) {
            const pIdx = ((y + py) * width + (x + px)) * 4;
            avgR += data[pIdx];
            avgG += data[pIdx + 1];
            avgB += data[pIdx + 2];
          }
        }

        const patchPixels = patchSize * patchSize;
        avgR /= patchPixels;
        avgG /= patchPixels;
        avgB /= patchPixels;

        // Calculate variance within patch
        for (let py = 0; py < patchSize; py++) {
          for (let px = 0; px < patchSize; px++) {
            const pIdx = ((y + py) * width + (x + px)) * 4;
            const variance = Math.abs(data[pIdx] - avgR) +
                           Math.abs(data[pIdx + 1] - avgG) +
                           Math.abs(data[pIdx + 2] - avgB);
            maxVariance = Math.max(maxVariance, variance);
          }
        }

        // High variance = chunky, inconsistent texture
        if (maxVariance > 100) {
          inconsistentPatches++;
        }
      }
    }

    const sampledPatches = ((width / sampleRate) * (height / sampleRate));
    return inconsistentPatches / sampledPatches;
  }

  /**
   * Detect blood (bright red pixels > 15% of frame)
   */
  private detectBlood(timestamp: number, analysis: ColorAnalysis): void {
    if (analysis.brightRed > 0.15) {  // 15% of frame is bright red
      const eventKey = `blood-${Math.floor(timestamp)}`;

      if (!this.detectedEvents.has(eventKey)) {
        this.stats.bloodDetections++;

        const confidence = Math.min(Math.round(analysis.brightRed * 400), 95);

        logger.warn(
          `[TW VisualColorAnalyzer] 🩸 BLOOD DETECTED at ${timestamp.toFixed(1)}s | ` +
          `Red pixels: ${(analysis.brightRed * 100).toFixed(1)}% | ` +
          `Confidence: ${confidence}%`
        );

        this.createWarning(eventKey, timestamp, 'blood', confidence,
          `Blood detected via color analysis (${(analysis.brightRed * 100).toFixed(1)}% red pixels)`,
          analysis);
      }
    }
  }

  /**
   * Detect gore (blood + shadows + high irregularity)
   */
  private detectGore(timestamp: number, analysis: ColorAnalysis): void {
    // Gore characteristics:
    // - Moderate red (10%+)
    // - Dark shadows (25%+)
    // - High irregularity (complex edges)

    if (analysis.brightRed > 0.10 &&
        analysis.darkPixels > 0.25 &&
        analysis.irregularity > 0.20) {

      const eventKey = `gore-${Math.floor(timestamp)}`;

      if (!this.detectedEvents.has(eventKey)) {
        this.stats.goreDetections++;

        const confidence = Math.min(
          Math.round((analysis.brightRed * 300 + analysis.irregularity * 200)),
          92
        );

        logger.warn(
          `[TW VisualColorAnalyzer] 💀 GORE DETECTED at ${timestamp.toFixed(1)}s | ` +
          `Red: ${(analysis.brightRed * 100).toFixed(1)}%, ` +
          `Irregularity: ${(analysis.irregularity * 100).toFixed(1)}% | ` +
          `Confidence: ${confidence}%`
        );

        this.createWarning(eventKey, timestamp, 'gore', confidence,
          'Gore detected via color analysis (red + shadows + irregular patterns)',
          analysis);
      }
    }
  }

  /**
   * Detect fire (orange/yellow > 20% + high brightness)
   */
  private detectFire(timestamp: number, analysis: ColorAnalysis): void {
    if (analysis.orangeYellow > 0.20 && analysis.brightness > 0.6) {
      const eventKey = `fire-${Math.floor(timestamp)}`;

      if (!this.detectedEvents.has(eventKey)) {
        this.stats.fireDetections++;

        const confidence = Math.min(
          Math.round(analysis.orangeYellow * 350),
          90
        );

        logger.info(
          `[TW VisualColorAnalyzer] 🔥 FIRE DETECTED at ${timestamp.toFixed(1)}s | ` +
          `Orange/Yellow: ${(analysis.orangeYellow * 100).toFixed(1)}% | ` +
          `Confidence: ${confidence}%`
        );

        this.createWarning(eventKey, timestamp, 'violence', confidence,
          `Fire detected via color analysis (${(analysis.orangeYellow * 100).toFixed(1)}% orange/yellow)`,
          analysis);
      }
    }
  }

  /**
   * Detect vomit (yellowBrown OR greenishYellow > 12% + chunkiness)
   *
   * EQUAL TREATMENT: Vomit detection with same rigor as blood detection
   * ADDRESSES CONCERN: "I'm not sensitive to blood, but to vomit!!"
   *
   * Vomit characteristics:
   * - Yellowish-brown or greenish-yellow colors (12%+ of frame)
   * - Chunky, irregular texture (high chunkiness score)
   * - Often combined with liquid pooling
   */
  private detectVomit(timestamp: number, analysis: ColorAnalysis): void {
    // Detect yellowish-brown vomit (most common)
    if (analysis.yellowBrown > 0.12 && analysis.chunkiness > 0.15) {
      const eventKey = `vomit-yellowbrown-${Math.floor(timestamp)}`;

      if (!this.detectedEvents.has(eventKey)) {
        this.stats.vomitDetections++;

        const confidence = Math.min(
          Math.round((analysis.yellowBrown * 400) + (analysis.chunkiness * 200)),
          92
        );

        logger.warn(
          `[TW VisualColorAnalyzer] 🤮 VOMIT DETECTED (yellow-brown) at ${timestamp.toFixed(1)}s | ` +
          `Yellow-brown pixels: ${(analysis.yellowBrown * 100).toFixed(1)}% | ` +
          `Chunkiness: ${(analysis.chunkiness * 100).toFixed(1)}% | ` +
          `Confidence: ${confidence}%`
        );

        this.createWarning(eventKey, timestamp, 'vomit', confidence,
          `Vomit detected via color analysis (${(analysis.yellowBrown * 100).toFixed(1)}% yellow-brown, chunky texture)`,
          analysis);
      }
    }

    // Detect greenish-yellow vomit (bile, less common but equally important)
    if (analysis.greenishYellow > 0.12 && analysis.chunkiness > 0.15) {
      const eventKey = `vomit-green-${Math.floor(timestamp)}`;

      if (!this.detectedEvents.has(eventKey)) {
        this.stats.vomitDetections++;

        const confidence = Math.min(
          Math.round((analysis.greenishYellow * 400) + (analysis.chunkiness * 200)),
          90
        );

        logger.warn(
          `[TW VisualColorAnalyzer] 🤮 VOMIT DETECTED (greenish-bile) at ${timestamp.toFixed(1)}s | ` +
          `Greenish-yellow pixels: ${(analysis.greenishYellow * 100).toFixed(1)}% | ` +
          `Chunkiness: ${(analysis.chunkiness * 100).toFixed(1)}% | ` +
          `Confidence: ${confidence}%`
        );

        this.createWarning(eventKey, timestamp, 'vomit', confidence,
          `Vomit detected via color analysis (${(analysis.greenishYellow * 100).toFixed(1)}% greenish-bile, chunky texture)`,
          analysis);
      }
    }

    // Detect mixed vomit (both colors present - highest confidence)
    if (analysis.yellowBrown > 0.08 && analysis.greenishYellow > 0.08 && analysis.chunkiness > 0.12) {
      const eventKey = `vomit-mixed-${Math.floor(timestamp)}`;

      if (!this.detectedEvents.has(eventKey)) {
        this.stats.vomitDetections++;

        const confidence = Math.min(
          Math.round((analysis.yellowBrown + analysis.greenishYellow) * 400 + (analysis.chunkiness * 200)),
          95
        );

        logger.warn(
          `[TW VisualColorAnalyzer] 🤮 VOMIT DETECTED (mixed colors) at ${timestamp.toFixed(1)}s | ` +
          `Yellow-brown: ${(analysis.yellowBrown * 100).toFixed(1)}%, ` +
          `Greenish: ${(analysis.greenishYellow * 100).toFixed(1)}%, ` +
          `Chunkiness: ${(analysis.chunkiness * 100).toFixed(1)}% | ` +
          `Confidence: ${confidence}%`
        );

        this.createWarning(eventKey, timestamp, 'vomit', confidence,
          'Vomit detected via color analysis (mixed yellow-brown and greenish colors, chunky texture)',
          analysis);
      }
    }
  }

  /**
   * Detect medical scenes (sterile white + medical blue-green)
   */
  private detectMedical(timestamp: number, analysis: ColorAnalysis): void {
    if (analysis.sterileWhite > 0.30 && analysis.medicalBlueGreen > 0.15) {
      const eventKey = `medical-${Math.floor(timestamp / 3) * 3}`;  // Dedupe every 3 seconds

      if (!this.detectedEvents.has(eventKey)) {
        this.stats.medicalDetections++;

        const confidence = Math.min(
          Math.round((analysis.sterileWhite + analysis.medicalBlueGreen) * 150),
          78
        );

        logger.debug(
          `[TW VisualColorAnalyzer] 🏥 MEDICAL SCENE DETECTED at ${timestamp.toFixed(1)}s | ` +
          `Confidence: ${confidence}%`
        );

        this.createWarning(eventKey, timestamp, 'medical_procedures', confidence,
          'Medical scene detected via color analysis (sterile environment)',
          analysis);
      }
    }
  }

  /**
   * Detect underwater scenes (blue-green > 40% + low saturation)
   */
  private detectUnderwater(timestamp: number, analysis: ColorAnalysis): void {
    if (analysis.blueGreen > 0.40 && analysis.saturation < 0.4) {
      const eventKey = `underwater-${Math.floor(timestamp / 5) * 5}`;  // Dedupe every 5 seconds

      if (!this.detectedEvents.has(eventKey)) {
        this.stats.underwaterDetections++;

        logger.debug(
          `[TW VisualColorAnalyzer] 🌊 UNDERWATER SCENE DETECTED at ${timestamp.toFixed(1)}s`
        );

        // Underwater scenes can trigger drowning/suffocation fears
        this.createWarning(eventKey, timestamp, 'violence', 65,
          'Underwater scene detected (potential drowning/suffocation trigger)',
          analysis);
      }
    }
  }

  /**
   * Detect scene changes (rapid cuts)
   */
  private detectSceneChange(
    timestamp: number,
    currentFrame: ImageData,
    previousFrame: ImageData
  ): void {
    const difference = this.calculateFrameDifference(currentFrame, previousFrame);

    // Scene change if > 70% of pixels changed significantly
    if (difference > 0.7) {
      this.sceneChangeCount++;

      // Rapid cutting: > 10 scene changes in 5 seconds
      if (this.sceneChangeCount > 10) {
        const eventKey = `rapid-cuts-${Math.floor(timestamp / 5) * 5}`;

        if (!this.detectedEvents.has(eventKey)) {
          this.stats.sceneChangeDetections++;

          logger.info(
            `[TW VisualColorAnalyzer] 🎬 RAPID SCENE CHANGES DETECTED at ${timestamp.toFixed(1)}s | ` +
            `${this.sceneChangeCount} changes in 5 seconds`
          );

          this.createWarning(eventKey, timestamp, 'violence', 70,
            `Rapid scene changes detected (${this.sceneChangeCount} cuts in 5s) - may trigger anxiety`,
            null);

          this.sceneChangeCount = 0;  // Reset counter
        }
      }
    }

    // Reset counter every 5 seconds
    if (timestamp % 5 < 0.2) {  // Close to 5-second mark
      this.sceneChangeCount = 0;
    }
  }

  /**
   * Calculate frame difference (0-1)
   */
  private calculateFrameDifference(frame1: ImageData, frame2: ImageData): number {
    const data1 = frame1.data;
    const data2 = frame2.data;

    let changedPixels = 0;
    const threshold = 50;  // Luminance change threshold

    for (let i = 0; i < data1.length; i += 4) {
      const lum1 = 0.299 * data1[i] + 0.587 * data1[i + 1] + 0.114 * data1[i + 2];
      const lum2 = 0.299 * data2[i] + 0.587 * data2[i + 1] + 0.114 * data2[i + 2];

      if (Math.abs(lum1 - lum2) > threshold) {
        changedPixels++;
      }
    }

    return changedPixels / (data1.length / 4);
  }

  /**
   * Create warning from visual detection
   */
  private createWarning(
    eventKey: string,
    timestamp: number,
    category: string,
    confidence: number,
    description: string,
    analysis: ColorAnalysis | null
  ): void {
    const event: VisualEvent = {
      type: category as any,
      timestamp,
      confidence,
      colorAnalysis: analysis || {} as ColorAnalysis
    };

    this.detectedEvents.set(eventKey, event);

    const warning: Warning = {
      id: eventKey,
      videoId: 'visual-color-detected',
      categoryKey: category as any,
      startTime: Math.max(0, timestamp - 2),
      endTime: timestamp + 5,
      submittedBy: 'visual-color-analyzer',
      status: 'approved',
      score: 0,
      confidenceLevel: confidence,
      requiresModeration: false,
      description,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.onWarningDetected?.(warning);
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
    this.detectedEvents.clear();
    this.previousFrame = null;
    this.sceneChangeCount = 0;
  }

  /**
   * Dispose
   */
  dispose(): void {
    this.stopMonitoring();
    this.video = null;
    this.previousFrame = null;
    this.detectedEvents.clear();
    this.onWarningDetected = null;
  }
}
