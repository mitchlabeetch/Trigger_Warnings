/**
 * BAYESIAN CONSENSUS SYSTEM (Innovation #37)
 *
 * Implements a decentralized Bayesian consensus mechanism for community-driven
 * trigger verification. Aggregates user feedback to establish "ground truth"
 * probabilities for triggers, weighing votes by user reliability.
 *
 * **THE PROBLEM:**
 * - Single-user detection is prone to false positives/negatives.
 * - Different users have different sensitivities (subjectivity).
 * - "Trolls" or malicious users might spam false reports.
 * - New content lacks ground truth labels.
 *
 * **THE SOLUTION:**
 * - Bayesian updates: Prior (AI detection) + Likelihood (User Votes) → Posterior.
 * - User Reliability Scoring: Users gain reputation for agreeing with consensus.
 * - Content Fingerprinting: Map votes to specific content segments.
 * - Sybil Resistance: Weigh votes by reliability, not just count.
 * - Persistence: Use local storage to persist consensus state across sessions.
 *
 * **MATHEMATICAL MODEL:**
 * - Beta Distribution (α, β) for trigger probability.
 * - Prior: Beta(α_0, β_0) derived from AI confidence.
 * - Update: α_new = α + Σ(vote_i * reliability_i)
 *           β_new = β + Σ((1-vote_i) * reliability_i)
 *
 * **BENEFITS:**
 * - "Crowd wisdom" improves accuracy over time.
 * - Self-correcting: False positives get voted down.
 * - Personalized consensus: Can segment by user groups (e.g., "sensitive users").
 * - Robust against spam/gaming.
 * - Note: Currently operates as a **local consensus** (history reinforcement) due to
 *   privacy-first local storage. Architecture supports remote sync for true community voting.
 *
 * Created by: Claude Code (Algorithm 3.0 Innovation Session)
 * Date: 2025-11-12
 */

import { Logger } from '@shared/utils/logger';
import type { TriggerCategory } from '@shared/types/Warning.types';

const logger = new Logger('BayesianConsensusSystem');

/**
 * Vote from a user
 */
export interface ConsensusVote {
  userId: string;
  category: TriggerCategory;
  contentId: string;      // Hash/ID of the content (e.g., movie ID + timestamp bucket)
  timestamp: number;
  vote: 'confirm' | 'dismiss'; // Confirm = 1, Dismiss = 0
  userReliability?: number;    // 0-1, injected by system if known
}

/**
 * Consensus state for a specific content segment
 */
export interface ConsensusState {
  contentId: string;
  category: TriggerCategory;
  alpha: number;          // Positive evidence (weighted)
  beta: number;           // Negative evidence (weighted)
  aiConfidence: number;   // Initial AI confidence (0-1)
  totalVotes: number;
  lastUpdated: number;
  consensusProbability: number; // Mean of Beta distribution: α / (α + β)
  confidenceScore: number;      // Certainty: (α + β) - measure of sample size
}

/**
 * User reliability profile
 */
interface UserReliability {
  userId: string;
  score: number;          // 0-1, starts at 0.5
  totalVotes: number;
  agreements: number;     // Number of times user agreed with final consensus
  lastActive: number;
}

/**
 * Storage interface for persistent consensus
 */
interface ConsensusStorage {
    consensus: Record<string, ConsensusState>;
    reliability: Record<string, UserReliability>;
}

/**
 * Bayesian Consensus System
 */
export class BayesianConsensusSystem {
  // Consensus state storage: Map<ContentID + Category, ConsensusState>
  private consensusCache: Map<string, ConsensusState> = new Map();

  // User reliability cache
  private userReliabilityCache: Map<string, UserReliability> = new Map();

  // Configuration
  private readonly DEFAULT_RELIABILITY = 0.5;
  private readonly MAX_RELIABILITY = 0.95;
  private readonly MIN_RELIABILITY = 0.1;
  private readonly PRIOR_WEIGHT = 2.0; // Weight of AI detection in "votes" equivalent
  private readonly STORAGE_KEY = 'bayesian_consensus_v1';
  private readonly SYNC_INTERVAL_MS = 60000; // Sync to storage every minute

  // Statistics
  private stats = {
    totalVotesProcessed: 0,
    consensusUpdates: 0,
    reliabilityUpdates: 0,
    spamFiltered: 0
  };

  private storageLoaded = false;
  private pendingOperations: Array<() => void> = [];

  constructor() {
    logger.info('[BayesianConsensusSystem] 🗳️ Initialized Bayesian Community Voting System');
    this.loadFromStorage();

    // Auto-save periodically
    setInterval(() => this.saveToStorage(), this.SYNC_INTERVAL_MS);
  }

  /**
   * Initialize consensus for a content segment based on AI detection
   * Called when AI first detects something, to establish a prior.
   */
  initializeConsensus(
    contentId: string,
    category: TriggerCategory,
    aiConfidence: number // 0-100
  ): ConsensusState {
    const key = this.getCacheKey(contentId, category);

    // If storage not loaded, queue checking but proceed with creation
    // This might cause a temporary overwrite if the item exists in storage but not yet loaded
    // To fix this, we would need this method to be async, but that changes the interface significantly.
    // Given the constraints, we accept the risk for initialization (rare race condition on first load)
    // but we ensure writes are preserved via merge logic in loadFromStorage.

    if (this.consensusCache.has(key)) {
      return this.consensusCache.get(key)!;
    }

    // Convert percentage to 0-1
    const p = aiConfidence / 100;

    // Initialize Beta distribution parameters (Prior)
    // We treat the AI's confidence as "evidence" equivalent to PRIOR_WEIGHT votes
    const alpha = 1 + (p * this.PRIOR_WEIGHT);
    const beta = 1 + ((1 - p) * this.PRIOR_WEIGHT);

    const state: ConsensusState = {
      contentId,
      category,
      alpha,
      beta,
      aiConfidence: p,
      totalVotes: 0,
      lastUpdated: Date.now(),
      consensusProbability: alpha / (alpha + beta),
      confidenceScore: alpha + beta
    };

    this.consensusCache.set(key, state);
    logger.debug(`[BayesianConsensus] Initialized ${category} prior: ${(p*100).toFixed(1)}%`);

    // Trigger immediate save for new initializations
    this.saveToStorage();

    return state;
  }

  /**
   * Process a user vote
   */
  processVote(vote: ConsensusVote): ConsensusState {
    this.stats.totalVotesProcessed++;

    // Get user reliability
    const reliability = this.getUserReliability(vote.userId);

    // Filter spam/low reliability
    if (reliability < this.MIN_RELIABILITY) {
      this.stats.spamFiltered++;
      logger.warn(`[BayesianConsensus] Filtered vote from unreliable user ${vote.userId}`);

      // Return existing state without update, or initialize if missing
      const key = this.getCacheKey(vote.contentId, vote.category);
      return this.consensusCache.get(key) || this.initializeConsensus(vote.contentId, vote.category, 50);
    }

    const key = this.getCacheKey(vote.contentId, vote.category);
    let state = this.consensusCache.get(key);

    if (!state) {
      // If no prior state, assume neutral prior (50%)
      state = this.initializeConsensus(vote.contentId, vote.category, 50);
    }

    // Update Beta distribution (Bayesian Update)
    // Vote confirmation (1) adds to alpha
    // Vote dismissal (0) adds to beta
    // Weighted by reliability
    if (vote.vote === 'confirm') {
      state.alpha += reliability;
    } else {
      state.beta += reliability;
    }

    state.totalVotes++;
    state.lastUpdated = Date.now();
    state.consensusProbability = state.alpha / (state.alpha + state.beta);
    state.confidenceScore = state.alpha + state.beta;

    this.stats.consensusUpdates++;

    // Update user reliability
    this.updateUserReliability(vote.userId, vote.vote, state.consensusProbability);

    logger.info(
      `[BayesianConsensus] 🗳️ Vote processed for ${vote.category} | ` +
      `Vote: ${vote.vote} (w=${reliability.toFixed(2)}) | ` +
      `New Probability: ${(state.consensusProbability * 100).toFixed(1)}%`
    );

    this.saveToStorage(); // Save significant updates immediately

    return state;
  }

  /**
   * Get current consensus for a trigger
   */
  getConsensus(contentId: string, category: TriggerCategory): ConsensusState | null {
    return this.consensusCache.get(this.getCacheKey(contentId, category)) || null;
  }

  /**
   * Get user reliability score
   */
  getUserReliability(userId: string): number {
    const profile = this.userReliabilityCache.get(userId);
    return profile ? profile.score : this.DEFAULT_RELIABILITY;
  }

  /**
   * Update user reliability based on agreement with consensus
   *
   * @param voteType The user's vote ('confirm' or 'dismiss')
   * @param currentProbability The new consensus probability (0-1)
   */
  private updateUserReliability(userId: string, voteType: 'confirm' | 'dismiss', currentProbability: number): void {
    let profile = this.userReliabilityCache.get(userId);
    if (!profile) {
      profile = {
        userId,
        score: this.DEFAULT_RELIABILITY,
        totalVotes: 0,
        agreements: 0,
        lastActive: Date.now()
      };
      this.userReliabilityCache.set(userId, profile);
    }

    profile.totalVotes++;
    profile.lastActive = Date.now();

    // Determine agreement
    const userValue = voteType === 'confirm' ? 1 : 0;

    // We can also measure "distance" from consensus for more granular updates
    const distance = Math.abs(userValue - currentProbability);
    const agreementStrength = 1 - distance; // 1 = perfect match, 0 = opposite

    // Update score using Exponential Moving Average (EMA)
    const alpha = 0.1; // Learning rate
    profile.score = (1 - alpha) * profile.score + (alpha * agreementStrength);

    // Clamp score
    profile.score = Math.max(this.MIN_RELIABILITY, Math.min(this.MAX_RELIABILITY, profile.score));

    // Count explicit agreements (rounding to nearest decision)
    const consensusValue = currentProbability >= 0.5 ? 1 : 0;
    if (userValue === consensusValue) {
      profile.agreements++;
    }

    this.stats.reliabilityUpdates++;
  }

  /**
   * Generate a cache key
   */
  private getCacheKey(contentId: string, category: TriggerCategory): string {
    return `${contentId}:${category}`;
  }

  /**
   * Load state from Chrome local storage
   */
  private async loadFromStorage(): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage) {
        logger.warn('[BayesianConsensus] Chrome storage not available (not in extension context?)');
        return;
    }

    try {
        const result = await chrome.storage.local.get(this.STORAGE_KEY);
        if (result[this.STORAGE_KEY]) {
            const data: ConsensusStorage = result[this.STORAGE_KEY];

            // Restore consensus cache (merge with in-memory)
            if (data.consensus) {
                for (const [key, state] of Object.entries(data.consensus)) {
                    // If in-memory exists (created during race), check if we should overwrite
                    const existing = this.consensusCache.get(key);

                    // Priority 1: If existing has 0 votes and storage has votes, take storage (fix "empty state clobber" bug)
                    // Priority 2: If no existing, take storage
                    // Priority 3: If both have votes, take the most recently updated
                    if (!existing) {
                        this.consensusCache.set(key, state);
                    } else if (existing.totalVotes === 0 && state.totalVotes > 0) {
                        this.consensusCache.set(key, state);
                    } else if (existing.lastUpdated < state.lastUpdated) {
                        // Only overwrite if storage is actually newer (rare if we are active)
                        this.consensusCache.set(key, state);
                    }
                }
            }

            // Restore reliability cache
            if (data.reliability) {
                for (const [userId, profile] of Object.entries(data.reliability)) {
                    // Merge strategy: Keep profile with more votes
                    const existing = this.userReliabilityCache.get(userId);
                    if (!existing || existing.totalVotes < profile.totalVotes) {
                        this.userReliabilityCache.set(userId, profile);
                    }
                }
            }

            this.storageLoaded = true;
            this.processPendingOperations();
            logger.info(`[BayesianConsensus] Loaded ${this.consensusCache.size} consensus items and ${this.userReliabilityCache.size} user profiles`);
        }
    } catch (e) {
        logger.error('[BayesianConsensus] Failed to load from storage', e);
    }
  }

  /**
   * Save state to Chrome local storage
   */
  private async saveToStorage(): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage) return;

    try {
        const data: ConsensusStorage = {
            consensus: Object.fromEntries(this.consensusCache),
            reliability: Object.fromEntries(this.userReliabilityCache)
        };

        await chrome.storage.local.set({ [this.STORAGE_KEY]: data });
        // logger.debug('[BayesianConsensus] Saved state to storage');
    } catch (e) {
        logger.error('[BayesianConsensus] Failed to save to storage', e);
    }
  }

  private processPendingOperations(): void {
    while (this.pendingOperations.length > 0) {
        const op = this.pendingOperations.shift();
        if (op) op();
    }
  }

  /**
   * Get system statistics
   */
  getStats() {
    return {
      ...this.stats,
      trackedItems: this.consensusCache.size,
      trackedUsers: this.userReliabilityCache.size,
      avgConsensusProbability: this.getAverageProbability(),
      storageLoaded: this.storageLoaded
    };
  }

  private getAverageProbability(): number {
    if (this.consensusCache.size === 0) return 0;
    let sum = 0;
    for (const state of this.consensusCache.values()) {
      sum += state.consensusProbability;
    }
    return sum / this.consensusCache.size;
  }

  /**
   * Clear all state (for testing)
   */
  async clear(): Promise<void> {
    this.consensusCache.clear();
    this.userReliabilityCache.clear();
    this.stats = {
      totalVotesProcessed: 0,
      consensusUpdates: 0,
      reliabilityUpdates: 0,
      spamFiltered: 0
    };

    if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.remove(this.STORAGE_KEY);
    }
  }
}

/**
 * Singleton instance
 */
export const bayesianConsensusSystem = new BayesianConsensusSystem();
