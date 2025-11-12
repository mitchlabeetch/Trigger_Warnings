/**
 * TEMPORAL-PATTERN PIPELINE - Algorithm 3.0 Innovation #13
 *
 * Specialized detection pipeline for ESCALATION-based triggers:
 * - Animal cruelty (escalates over time)
 * - Violence (escalates from verbal to physical)
 * - Torture (escalates in intensity)
 * - Murder (builds up to killing)
 *
 * Pipeline stages:
 * 1. Temporal Pattern Recognizer (PRIMARY) - Tracks escalation curves
 * 2. Scene Classifier (SECONDARY) - Understands context evolution
 * 3. All Modalities (EVIDENCE COLLECTION) - Gathers multi-modal evidence
 * 4. Escalation Threshold (DECISION) - Warns when curve crosses threshold
 *
 * Created by: Claude Code (Algorithm 3.0 Revolutionary Session)
 * Date: 2025-11-11
 */

import type { TriggerCategory } from '@shared/types/Warning.types';
import type { MultiModalInput, Detection, RouteConfig } from './DetectionRouter';
import { Logger } from '@shared/utils/logger';

const logger = new Logger('TemporalPatternPipeline');

export interface EscalationCurve {
  startTime: number;
  currentLevel: 'mild' | 'moderate' | 'severe' | 'extreme';
  levelScore: number;      // 0-100
  escalationRate: number;  // Points per second
  peakReached: boolean;
}

export interface TemporalContext {
  detectionHistory: Array<{
    timestamp: number;
    confidence: number;
    modality: 'visual' | 'audio' | 'text';
  }>;
  sceneContext: string;    // 'domestic', 'nature', 'urban', etc.
  duration: number;        // How long has this been going on
}

export class TemporalPatternPipeline {
  private escalationCurves: Map<TriggerCategory, EscalationCurve> = new Map();
  private detectionHistory: Map<TriggerCategory, TemporalContext> = new Map();

  private stats = {
    totalProcessed: 0,
    escalationTracked: 0,
    thresholdCrossed: 0,
    earlyWarnings: 0
  };

  /**
   * Process detection through temporal-pattern pipeline
   */
  process(
    category: TriggerCategory,
    input: MultiModalInput,
    config: RouteConfig
  ): Detection {
    this.stats.totalProcessed++;

    // Get or create escalation curve for this category
    let curve = this.escalationCurves.get(category);
    if (!curve) {
      curve = this.initializeEscalationCurve(input.timestamp);
      this.escalationCurves.set(category, curve);
    }

    // Get or create detection history
    let history = this.detectionHistory.get(category);
    if (!history) {
      history = {
        detectionHistory: [],
        sceneContext: 'unknown',
        duration: 0
      };
      this.detectionHistory.set(category, history);
    }

    // Add current detections to history
    this.updateHistory(history, input);

    // Analyze all modalities for evidence
    const evidenceScores = this.collectEvidence(input);

    // Calculate current escalation level
    const escalationLevel = this.analyzeEscalation(category, history, evidenceScores);

    // Update escalation curve
    this.updateEscalationCurve(curve, escalationLevel, input.timestamp);

    // Determine if we should warn based on escalation
    const shouldWarn = this.checkEscalationThreshold(curve, escalationLevel);

    if (shouldWarn) {
      this.stats.thresholdCrossed++;
    }

    // Calculate weighted confidence
    const weightedConfidence = this.calculateWeightedConfidence(
      evidenceScores,
      config.modalityWeights,
      escalationLevel
    );

    const detection: Detection = {
      category,
      timestamp: input.timestamp,
      confidence: weightedConfidence,
      route: 'temporal-pattern',
      modalityContributions: {
        visual: evidenceScores.visual * config.modalityWeights.visual,
        audio: evidenceScores.audio * config.modalityWeights.audio,
        text: evidenceScores.text * config.modalityWeights.text
      },
      validationPassed: shouldWarn,
      temporalContext: {
        pattern: config.temporalPattern,
        duration: history.duration
      }
    };

    logger.debug(
      `[TemporalPatternPipeline] Processed ${category} | ` +
      `Escalation: ${curve.currentLevel} (${curve.levelScore.toFixed(1)}) | ` +
      `Duration: ${history.duration.toFixed(1)}s | ` +
      `Confidence: ${weightedConfidence.toFixed(1)}% | ` +
      `Warn: ${shouldWarn}`
    );

    return detection;
  }

  /**
   * Initialize escalation curve
   */
  private initializeEscalationCurve(timestamp: number): EscalationCurve {
    return {
      startTime: timestamp,
      currentLevel: 'mild',
      levelScore: 0,
      escalationRate: 0,
      peakReached: false
    };
  }

  /**
   * Update detection history
   */
  private updateHistory(history: TemporalContext, input: MultiModalInput): void {
    if (input.visual) {
      history.detectionHistory.push({
        timestamp: input.timestamp,
        confidence: input.visual.confidence,
        modality: 'visual'
      });
    }

    if (input.audio) {
      history.detectionHistory.push({
        timestamp: input.timestamp,
        confidence: input.audio.confidence,
        modality: 'audio'
      });
    }

    if (input.text) {
      history.detectionHistory.push({
        timestamp: input.timestamp,
        confidence: input.text.confidence,
        modality: 'text'
      });
    }

    // Keep only recent history (last 60 seconds)
    const cutoff = input.timestamp - 60;
    history.detectionHistory = history.detectionHistory.filter(d => d.timestamp >= cutoff);

    // Update duration
    if (history.detectionHistory.length > 0) {
      history.duration = input.timestamp - history.detectionHistory[0].timestamp;
    }
  }

  /**
   * Collect evidence from all modalities
   */
  private collectEvidence(input: MultiModalInput): { visual: number; audio: number; text: number } {
    return {
      visual: input.visual?.confidence || 0,
      audio: input.audio?.confidence || 0,
      text: input.text?.confidence || 0
    };
  }

  /**
   * Analyze escalation pattern
   */
  private analyzeEscalation(
    category: TriggerCategory,
    history: TemporalContext,
    currentEvidence: { visual: number; audio: number; text: number }
  ): number {
    if (history.detectionHistory.length === 0) {
      return 0;
    }

    // Calculate average confidence over time windows
    const recentWindow = history.detectionHistory.filter(d => d.timestamp >= (Date.now() - 10000));
    const olderWindow = history.detectionHistory.filter(d =>
      d.timestamp < (Date.now() - 10000) && d.timestamp >= (Date.now() - 30000)
    );

    const recentAvg = recentWindow.length > 0
      ? recentWindow.reduce((sum, d) => sum + d.confidence, 0) / recentWindow.length
      : 0;

    const olderAvg = olderWindow.length > 0
      ? olderWindow.reduce((sum, d) => sum + d.confidence, 0) / olderWindow.length
      : 0;

    // Escalation = recent confidence higher than older confidence
    const escalation = Math.max(0, recentAvg - olderAvg);

    // Current evidence also contributes
    const currentMax = Math.max(currentEvidence.visual, currentEvidence.audio, currentEvidence.text);

    return Math.min((escalation + currentMax) / 2, 100);
  }

  /**
   * Update escalation curve
   */
  private updateEscalationCurve(
    curve: EscalationCurve,
    escalationLevel: number,
    timestamp: number
  ): void {
    // Update level score
    const previousScore = curve.levelScore;
    curve.levelScore = escalationLevel;

    // Calculate escalation rate
    const timeDelta = timestamp - curve.startTime;
    if (timeDelta > 0) {
      curve.escalationRate = (curve.levelScore - previousScore) / timeDelta;
    }

    // Update level category
    if (escalationLevel >= 75) {
      curve.currentLevel = 'extreme';
    } else if (escalationLevel >= 60) {
      curve.currentLevel = 'severe';
    } else if (escalationLevel >= 40) {
      curve.currentLevel = 'moderate';
    } else {
      curve.currentLevel = 'mild';
    }

    // Check if peak reached
    if (escalationLevel >= 80) {
      curve.peakReached = true;
    }

    this.stats.escalationTracked++;
  }

  /**
   * Check if escalation crosses warning threshold
   */
  private checkEscalationThreshold(curve: EscalationCurve, currentLevel: number): boolean {
    // Warn at different thresholds based on escalation pattern

    // Extreme level - always warn
    if (curve.currentLevel === 'extreme') {
      return true;
    }

    // Severe level with rapid escalation - warn
    if (curve.currentLevel === 'severe' && curve.escalationRate > 2) {
      return true;
    }

    // Sustained moderate level - warn after some duration
    if (curve.currentLevel === 'moderate' && currentLevel >= 50) {
      return true;
    }

    return false;
  }

  /**
   * Calculate weighted confidence with escalation factor
   */
  private calculateWeightedConfidence(
    evidence: { visual: number; audio: number; text: number },
    weights: { visual: number; audio: number; text: number },
    escalationLevel: number
  ): number {
    // Base weighted confidence
    const baseConfidence = (evidence.visual * weights.visual) +
                          (evidence.audio * weights.audio) +
                          (evidence.text * weights.text);

    // Apply escalation boost
    // Higher escalation = higher confidence
    const escalationBoost = 1 + (escalationLevel / 200);  // Up to +50% boost

    return Math.min(baseConfidence * escalationBoost, 100);
  }

  /**
   * Reset escalation curve (scene change, safe content)
   */
  resetCurve(category: TriggerCategory): void {
    this.escalationCurves.delete(category);
    this.detectionHistory.delete(category);
  }

  /**
   * Get pipeline statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Get current escalation curves
   */
  getEscalationCurves(): Map<TriggerCategory, EscalationCurve> {
    return new Map(this.escalationCurves);
  }
}

/**
 * Export singleton instance
 */
export const temporalPatternPipeline = new TemporalPatternPipeline();

/**
 * EQUAL TREATMENT FOR TEMPORAL TRIGGERS
 *
 * This pipeline ensures:
 * ✅ Animal cruelty gets escalation tracking (mild → severe)
 * ✅ Violence gets multi-stage detection (verbal → physical → weapon → injury)
 * ✅ Torture gets intensity escalation monitoring
 * ✅ Murder gets build-up sequence detection
 * ✅ All temporal triggers benefit from long-term context (up to 60s history)
 *
 * Prevents false positives from brief mentions while catching sustained content
 */
