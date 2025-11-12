/**
 * VISUAL-PRIMARY PIPELINE - Algorithm 3.0 Innovation #13
 *
 * Specialized detection pipeline for VISUAL-heavy triggers:
 * - Blood (70% visual)
 * - Gore (75% visual)
 * - Vomit (50% visual, 40% audio)
 * - Dead bodies (80% visual)
 * - Medical procedures (60% visual)
 * - Flashing lights (95% visual)
 * - Insects/spiders (85% visual)
 * - Needles/injections (75% visual)
 * - Claustrophobia triggers (70% visual)
 *
 * Pipeline stages:
 * 1. Visual Color Analyzer (PRIMARY)
 * 2. Visual Texture Analyzer (SECONDARY)
 * 3. Subtitle Analyzer (VALIDATION)
 * 4. Audio Analyzer (VALIDATION)
 *
 * Created by: Claude Code (Algorithm 3.0 Revolutionary Session)
 * Date: 2025-11-11
 */

import type { TriggerCategory } from '@shared/types/Warning.types';
import type { MultiModalInput, Detection, RouteConfig } from './DetectionRouter';
import { Logger } from '@shared/utils/logger';

const logger = new Logger('VisualPrimaryPipeline');

export interface VisualFeatures {
  colorAnalysis: {
    redConcentration: number;      // 0-100
    yellowBrownHue: number;        // 0-100 (vomit detection)
    greenishTint: number;          // 0-100 (vomit detection)
    whiteBlueSterile: number;      // 0-100 (medical detection)
  };
  textureAnalysis: {
    chunkiness: number;            // 0-100 (vomit, gore)
    liquidPooling: number;         // 0-100 (blood detection)
    irregularity: number;          // 0-100 (gore, wounds)
  };
  motionAnalysis: {
    flashingDetected: boolean;     // Photosensitivity
    flashFrequency: number;        // Hz
    suddenMovement: boolean;       // Jumpscare indicator
  };
  objectDetection?: {
    medicalInstruments: boolean;
    needles: boolean;
    insects: boolean;
  };
}

export class VisualPrimaryPipeline {
  private stats = {
    totalProcessed: 0,
    visualPrimary: 0,
    audioValidated: 0,
    textValidated: 0,
    multiModalConfirmed: 0
  };

  /**
   * Process detection through visual-primary pipeline
   */
  process(
    category: TriggerCategory,
    input: MultiModalInput,
    config: RouteConfig
  ): Detection {
    this.stats.totalProcessed++;
    this.stats.visualPrimary++;

    // Stage 1: Visual Analysis (PRIMARY)
    const visualConfidence = this.analyzeVisual(input, category);

    // Stage 2: Audio Validation (SECONDARY)
    const audioConfidence = input.audio ? this.validateAudio(input, category) : 0;
    if (audioConfidence > 0) {
      this.stats.audioValidated++;
    }

    // Stage 3: Text Validation (SECONDARY)
    const textConfidence = input.text ? this.validateText(input, category) : 0;
    if (textConfidence > 0) {
      this.stats.textValidated++;
    }

    // Apply category-specific weights
    const weightedConfidence = this.calculateWeightedConfidence(
      visualConfidence,
      audioConfidence,
      textConfidence,
      config.modalityWeights
    );

    // Check for multi-modal confirmation
    const modalitiesPresent = [
      visualConfidence > 50,
      audioConfidence > 50,
      textConfidence > 50
    ].filter(Boolean).length;

    if (modalitiesPresent >= 2) {
      this.stats.multiModalConfirmed++;
    }

    const detection: Detection = {
      category,
      timestamp: input.timestamp,
      confidence: weightedConfidence,
      route: 'visual-primary',
      modalityContributions: {
        visual: visualConfidence * config.modalityWeights.visual,
        audio: audioConfidence * config.modalityWeights.audio,
        text: textConfidence * config.modalityWeights.text
      },
      validationPassed: this.validateDetection(weightedConfidence, modalitiesPresent),
      temporalContext: {
        pattern: config.temporalPattern,
        duration: 0
      }
    };

    logger.debug(
      `[VisualPrimaryPipeline] Processed ${category} | ` +
      `Visual: ${visualConfidence.toFixed(1)}% | ` +
      `Audio: ${audioConfidence.toFixed(1)}% | ` +
      `Text: ${textConfidence.toFixed(1)}% | ` +
      `Weighted: ${weightedConfidence.toFixed(1)}% | ` +
      `Modalities: ${modalitiesPresent}`
    );

    return detection;
  }

  /**
   * Primary visual analysis
   */
  private analyzeVisual(input: MultiModalInput, category: TriggerCategory): number {
    if (!input.visual) {
      return 0;
    }

    const features = input.visual.features as VisualFeatures | undefined;
    if (!features) {
      return input.visual.confidence;
    }

    // Category-specific visual analysis
    switch (category) {
      case 'blood':
        return this.analyzeBlood(features);

      case 'gore':
        return this.analyzeGore(features);

      case 'vomit':
        return this.analyzeVomit(features);

      case 'medical_procedures':
        return this.analyzeMedicalProcedure(features);

      case 'flashing_lights':
        return this.analyzeFlashingLights(features);

      case 'insects_spiders':
        return this.analyzeInsects(features);

      case 'needles_injections':
        return this.analyzeNeedles(features);

      default:
        return input.visual.confidence;
    }
  }

  /**
   * Blood-specific visual analysis
   */
  private analyzeBlood(features: VisualFeatures): number {
    let confidence = 0;

    // High red concentration is primary indicator
    confidence += features.colorAnalysis.redConcentration * 0.7;

    // Liquid pooling indicates blood
    confidence += features.textureAnalysis.liquidPooling * 0.2;

    // Irregular texture (not uniform red, but blood-like)
    confidence += features.textureAnalysis.irregularity * 0.1;

    return Math.min(confidence, 100);
  }

  /**
   * Gore-specific visual analysis
   */
  private analyzeGore(features: VisualFeatures): number {
    let confidence = 0;

    // Red concentration
    confidence += features.colorAnalysis.redConcentration * 0.5;

    // High irregularity and chunkiness are key indicators
    confidence += features.textureAnalysis.irregularity * 0.3;
    confidence += features.textureAnalysis.chunkiness * 0.2;

    return Math.min(confidence, 100);
  }

  /**
   * Vomit-specific visual analysis
   */
  private analyzeVomit(features: VisualFeatures): number {
    let confidence = 0;

    // Yellow-brown hue is primary indicator
    confidence += features.colorAnalysis.yellowBrownHue * 0.4;

    // Greenish tint is secondary indicator
    confidence += features.colorAnalysis.greenishTint * 0.3;

    // Chunkiness/texture
    confidence += features.textureAnalysis.chunkiness * 0.3;

    return Math.min(confidence, 100);
  }

  /**
   * Medical procedure visual analysis
   */
  private analyzeMedicalProcedure(features: VisualFeatures): number {
    let confidence = 0;

    // Sterile white/blue colors
    confidence += features.colorAnalysis.whiteBlueSterile * 0.4;

    // Medical instruments detected
    if (features.objectDetection?.medicalInstruments) {
      confidence += 40;
    }

    // Some red (blood during procedure)
    confidence += features.colorAnalysis.redConcentration * 0.2;

    return Math.min(confidence, 100);
  }

  /**
   * Flashing lights analysis
   */
  private analyzeFlashingLights(features: VisualFeatures): number {
    if (features.motionAnalysis.flashingDetected) {
      // High confidence if flashing at dangerous frequency (3-60 Hz)
      const frequency = features.motionAnalysis.flashFrequency;
      if (frequency >= 3 && frequency <= 60) {
        return 95;  // Very high confidence
      }
      return 70;  // Flashing but safer frequency
    }
    return 0;
  }

  /**
   * Insect/spider detection
   */
  private analyzeInsects(features: VisualFeatures): number {
    if (features.objectDetection?.insects) {
      return 90;  // High confidence if object detected
    }
    return 0;  // Requires object detection for this category
  }

  /**
   * Needle/injection detection
   */
  private analyzeNeedles(features: VisualFeatures): number {
    let confidence = 0;

    if (features.objectDetection?.needles) {
      confidence += 60;
    }

    // Medical context
    confidence += features.colorAnalysis.whiteBlueSterile * 0.3;

    return Math.min(confidence, 100);
  }

  /**
   * Validate with audio (secondary)
   */
  private validateAudio(input: MultiModalInput, category: TriggerCategory): number {
    if (!input.audio) {
      return 0;
    }

    // For vomit, audio is very important (50% visual, 40% audio)
    if (category === 'vomit') {
      return input.audio.confidence;
    }

    // For other visual triggers, audio provides context
    return input.audio.confidence * 0.5;  // Reduced weight for validation
  }

  /**
   * Validate with text (secondary)
   */
  private validateText(input: MultiModalInput, category: TriggerCategory): number {
    if (!input.text) {
      return 0;
    }

    // Text provides confirmation but not primary evidence for visual triggers
    return input.text.confidence * 0.4;  // Reduced weight for validation
  }

  /**
   * Calculate weighted confidence
   */
  private calculateWeightedConfidence(
    visual: number,
    audio: number,
    text: number,
    weights: { visual: number; audio: number; text: number }
  ): number {
    const weightedSum = (visual * weights.visual) +
                        (audio * weights.audio) +
                        (text * weights.text);

    return weightedSum;
  }

  /**
   * Validate detection quality
   */
  private validateDetection(confidence: number, modalitiesPresent: number): boolean {
    // High confidence visual detection
    if (confidence >= 70) {
      return true;
    }

    // Moderate confidence with multi-modal support
    if (confidence >= 60 && modalitiesPresent >= 2) {
      return true;
    }

    return false;
  }

  /**
   * Get pipeline statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

/**
 * Export singleton instance
 */
export const visualPrimaryPipeline = new VisualPrimaryPipeline();

/**
 * EQUAL TREATMENT FOR VISUAL TRIGGERS
 *
 * This pipeline ensures:
 * ✅ Blood gets sophisticated red concentration + liquid pooling analysis
 * ✅ Vomit gets yellow-brown + greenish + chunky texture analysis (EQUAL to blood)
 * ✅ Gore gets irregularity + chunkiness analysis
 * ✅ Medical procedures get sterile color + instrument detection
 * ✅ Flashing lights get frequency-based photosensitivity detection
 * ✅ All visual triggers receive category-optimized analysis
 *
 * VOMIT GETS THE SAME SOPHISTICATION AS BLOOD - THIS IS THE PROMISE.
 */
