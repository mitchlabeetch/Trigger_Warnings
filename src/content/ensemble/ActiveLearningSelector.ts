/**
 * ALGORITHM 3.0 - PHASE 9: INNOVATION #34
 * Active Learning Selector
 *
 * Intelligently selects the most informative samples for user feedback
 * to maximize learning efficiency. Uses uncertainty sampling, query-by-committee,
 * and diversity-based selection.
 *
 * Research: Settles (2009) - Active Learning Literature Survey
 *           50% fewer labels needed for same accuracy
 *
 * Equal Treatment: All 28 categories benefit from same active learning strategy
 */

import type { TriggerCategory } from '../types/triggers';
import { logger } from '../utils/Logger';

/**
 * Sample to potentially query
 */
export interface QueryCandidate {
  id: string;
  features: number[];
  category: TriggerCategory;
  confidence: number;
  uncertainty?: number;
  timestamp?: number;
  metadata?: Record<string, any>;
}

/**
 * Query selection result
 */
export interface QuerySelection {
  candidate: QueryCandidate;
  score: number;                    // Informativeness score (higher = more informative)
  strategy: 'uncertainty' | 'committee' | 'expected-change' | 'diversity';
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Committee prediction (for query-by-committee)
 */
interface CommitteePrediction {
  modelName: string;
  prediction: number;
}

/**
 * Active learning statistics
 */
interface ActiveLearningStats {
  totalQueries: number;
  uncertaintyQueries: number;
  committeeQueries: number;
  expectedChangeQueries: number;
  diversityQueries: number;
  avgInformativenessScore: number;
  labelEfficiency: number;          // Accuracy gain per label
  diversityCoverage: number;        // % of feature space covered
}

/**
 * Active Learning Selector
 *
 * Selects most informative samples for labeling
 */
export class ActiveLearningSelector {
  // Query selection parameters
  private readonly UNCERTAINTY_THRESHOLD = 0.4;    // Min uncertainty to consider
  private readonly COMMITTEE_DISAGREEMENT_MIN = 0.3;
  private readonly DIVERSITY_RADIUS = 0.1;         // Min distance for diversity

  // Previously queried samples (to avoid duplicates)
  private queriedSamples: Set<string> = new Set();

  // Feature space coverage (for diversity)
  private queriedFeatures: number[][] = [];

  // Statistics
  private stats: ActiveLearningStats = {
    totalQueries: 0,
    uncertaintyQueries: 0,
    committeeQueries: 0,
    expectedChangeQueries: 0,
    diversityQueries: 0,
    avgInformativenessScore: 0,
    labelEfficiency: 0,
    diversityCoverage: 0
  };

  constructor() {
    logger.info('[ActiveLearningSelector] 🎯 Active Learning Selector initialized');
    logger.info('[ActiveLearningSelector] 🔍 Selecting most informative samples for feedback');
  }

  // ========================================
  // QUERY SELECTION
  // ========================================

  /**
   * Select best candidates to query for labels
   */
  selectQueries(
    candidates: QueryCandidate[],
    maxQueries: number = 5
  ): QuerySelection[] {
    // Filter out already-queried samples
    const unqueriedCandidates = candidates.filter(c => !this.queriedSamples.has(c.id));

    if (unqueriedCandidates.length === 0) {
      return [];
    }

    // Score all candidates using multiple strategies
    const scoredCandidates = unqueriedCandidates.map(candidate => {
      const uncertaintyScore = this.uncertaintySampling(candidate);
      const diversityScore = this.diversitySampling(candidate);

      // Combined score (weighted)
      const score = uncertaintyScore * 0.6 + diversityScore * 0.4;

      // Select strategy based on highest individual score
      let strategy: 'uncertainty' | 'committee' | 'expected-change' | 'diversity';
      if (uncertaintyScore > diversityScore) {
        strategy = 'uncertainty';
      } else {
        strategy = 'diversity';
      }

      // Priority based on score
      const priority: 'high' | 'medium' | 'low' =
        score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low';

      const reason = this.generateReason(candidate, strategy, score);

      return {
        candidate,
        score,
        strategy,
        reason,
        priority
      };
    });

    // Sort by score (descending)
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Select top candidates
    const selected = scoredCandidates.slice(0, maxQueries);

    // Mark as queried
    for (const selection of selected) {
      this.queriedSamples.add(selection.candidate.id);
      this.queriedFeatures.push(selection.candidate.features);
      this.stats.totalQueries++;

      // Update strategy counts
      switch (selection.strategy) {
        case 'uncertainty':
          this.stats.uncertaintyQueries++;
          break;
        case 'committee':
          this.stats.committeeQueries++;
          break;
        case 'expected-change':
          this.stats.expectedChangeQueries++;
          break;
        case 'diversity':
          this.stats.diversityQueries++;
          break;
      }

      // Update avg informativeness
      const total = this.stats.totalQueries;
      this.stats.avgInformativenessScore =
        (this.stats.avgInformativenessScore * (total - 1) + selection.score) / total;
    }

    // Update diversity coverage
    this.updateDiversityCoverage();

    logger.info(
      `[ActiveLearningSelector] 📋 Selected ${selected.length} queries: ` +
      `${selected.filter(s => s.priority === 'high').length} high priority, ` +
      `${selected.filter(s => s.priority === 'medium').length} medium, ` +
      `${selected.filter(s => s.priority === 'low').length} low`
    );

    return selected;
  }

  // ========================================
  // SELECTION STRATEGIES
  // ========================================

  /**
   * Uncertainty sampling - select samples with highest uncertainty
   */
  private uncertaintySampling(candidate: QueryCandidate): number {
    // High uncertainty = more informative
    const uncertainty = candidate.uncertainty !== undefined
      ? candidate.uncertainty
      : this.estimateUncertainty(candidate.confidence);

    // Normalize to [0, 1]
    return Math.min(1, uncertainty);
  }

  /**
   * Query-by-committee - select samples where models disagree
   */
  queryByCommittee(
    candidate: QueryCandidate,
    committeePredictions: CommitteePrediction[]
  ): number {
    if (committeePredictions.length < 2) {
      return 0;
    }

    // Compute vote entropy (disagreement measure)
    const predictions = committeePredictions.map(p => p.prediction);
    const mean = predictions.reduce((sum, p) => sum + p, 0) / predictions.length;
    const variance = predictions.reduce((sum, p) => sum + (p - mean) ** 2, 0) / predictions.length;

    // High variance = high disagreement = more informative
    return Math.min(1, Math.sqrt(variance) * 2);
  }

  /**
   * Expected model change - select samples that would change model most
   */
  expectedModelChange(candidate: QueryCandidate): number {
    // Samples near decision boundary cause largest model updates
    const distanceFromBoundary = Math.abs(candidate.confidence - 0.5);

    // Closer to boundary = more informative
    return 1 - (distanceFromBoundary * 2);
  }

  /**
   * Diversity sampling - select samples from unexplored feature space
   */
  private diversitySampling(candidate: QueryCandidate): number {
    if (this.queriedFeatures.length === 0) {
      return 1.0;  // First sample is always diverse
    }

    // Compute minimum distance to already-queried samples
    let minDistance = Infinity;

    for (const queriedFeats of this.queriedFeatures) {
      const distance = this.euclideanDistance(candidate.features, queriedFeats);
      minDistance = Math.min(minDistance, distance);
    }

    // Normalize (higher distance = more diverse = more informative)
    return Math.min(1, minDistance / this.DIVERSITY_RADIUS);
  }

  // ========================================
  // INFORMATIVENESS SCORING
  // ========================================

  /**
   * Generate reason for selection
   */
  private generateReason(
    candidate: QueryCandidate,
    strategy: string,
    score: number
  ): string {
    const scorePercent = (score * 100).toFixed(1);

    switch (strategy) {
      case 'uncertainty':
        return `High uncertainty (${scorePercent}%) - model is unsure about this ${candidate.category} detection`;
      case 'committee':
        return `Committee disagreement (${scorePercent}%) - models disagree on this ${candidate.category}`;
      case 'expected-change':
        return `Expected model change (${scorePercent}%) - labeling this would improve model significantly`;
      case 'diversity':
        return `Feature diversity (${scorePercent}%) - explores new region of ${candidate.category} feature space`;
      default:
        return `Informative sample (${scorePercent}%)`;
    }
  }

  /**
   * Estimate uncertainty from confidence
   */
  private estimateUncertainty(confidence: number): number {
    // Uncertainty is highest when confidence is near 0.5 (decision boundary)
    return 1 - Math.abs(confidence - 0.5) * 2;
  }

  // ========================================
  // UTILITIES
  // ========================================

  /**
   * Euclidean distance between feature vectors
   */
  private euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    const minLen = Math.min(a.length, b.length);

    for (let i = 0; i < minLen; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Update diversity coverage
   */
  private updateDiversityCoverage(): void {
    // Estimate percentage of feature space covered
    // Simplified: based on number of unique regions queried
    const uniqueRegions = new Set<string>();

    for (const features of this.queriedFeatures) {
      // Discretize features to regions
      const region = features
        .slice(0, 10)  // Use first 10 features
        .map(f => Math.floor(f * 10))
        .join(',');

      uniqueRegions.add(region);
    }

    // Coverage = unique regions / total possible (estimated)
    const totalPossibleRegions = Math.pow(10, 10);  // 10^10 possible regions
    this.stats.diversityCoverage = uniqueRegions.size / totalPossibleRegions;
  }

  // ========================================
  // FEEDBACK INTEGRATION
  // ========================================

  /**
   * Update learning efficiency after receiving label
   */
  updateLabelEfficiency(
    selection: QuerySelection,
    accuracyGain: number
  ): void {
    // Track how much accuracy improved from this label
    const total = this.stats.totalQueries;
    this.stats.labelEfficiency =
      (this.stats.labelEfficiency * (total - 1) + accuracyGain) / total;

    logger.debug(
      `[ActiveLearningSelector] 📈 Label efficiency: ` +
      `+${(accuracyGain * 100).toFixed(2)}% accuracy gain, ` +
      `avg=${(this.stats.labelEfficiency * 100).toFixed(2)}% per label`
    );
  }

  /**
   * Reset query for re-evaluation
   */
  resetQuery(candidateId: string): void {
    this.queriedSamples.delete(candidateId);
  }

  // ========================================
  // BATCH SELECTION
  // ========================================

  /**
   * Select batch of diverse queries
   */
  selectDiverseBatch(
    candidates: QueryCandidate[],
    batchSize: number
  ): QuerySelection[] {
    const selected: QuerySelection[] = [];
    const remaining = [...candidates].filter(c => !this.queriedSamples.has(c.id));

    while (selected.length < batchSize && remaining.length > 0) {
      // Score remaining candidates considering already-selected
      const scored = remaining.map(candidate => {
        const uncertaintyScore = this.uncertaintySampling(candidate);

        // Diversity w.r.t. already-selected in batch
        let batchDiversity = 1.0;
        if (selected.length > 0) {
          let minDist = Infinity;
          for (const sel of selected) {
            const dist = this.euclideanDistance(
              candidate.features,
              sel.candidate.features
            );
            minDist = Math.min(minDist, dist);
          }
          batchDiversity = Math.min(1, minDist / this.DIVERSITY_RADIUS);
        }

        // Combined score (favor diversity in batch)
        const score = uncertaintyScore * 0.3 + batchDiversity * 0.7;

        return { candidate, score };
      });

      // Select best
      scored.sort((a, b) => b.score - a.score);
      const best = scored[0];

      if (best) {
        selected.push({
          candidate: best.candidate,
          score: best.score,
          strategy: 'diversity',
          reason: `Diverse batch member (score=${(best.score * 100).toFixed(1)}%)`,
          priority: best.score > 0.7 ? 'high' : 'medium'
        });

        // Remove from remaining
        const idx = remaining.findIndex(c => c.id === best.candidate.id);
        if (idx !== -1) {
          remaining.splice(idx, 1);
        }
      } else {
        break;
      }
    }

    // Mark as queried
    for (const selection of selected) {
      this.queriedSamples.add(selection.candidate.id);
      this.queriedFeatures.push(selection.candidate.features);
      this.stats.totalQueries++;
      this.stats.diversityQueries++;
    }

    return selected;
  }

  // ========================================
  // STATISTICS
  // ========================================

  /**
   * Get statistics
   */
  getStats(): ActiveLearningStats {
    return { ...this.stats };
  }

  /**
   * Clear state
   */
  clear(): void {
    this.queriedSamples.clear();
    this.queriedFeatures = [];

    this.stats = {
      totalQueries: 0,
      uncertaintyQueries: 0,
      committeeQueries: 0,
      expectedChangeQueries: 0,
      diversityQueries: 0,
      avgInformativenessScore: 0,
      labelEfficiency: 0,
      diversityCoverage: 0
    };

    logger.info('[ActiveLearningSelector] 🧹 Cleared active learning state');
  }
}

// Singleton instance
export const activeLearningSelector = new ActiveLearningSelector();
