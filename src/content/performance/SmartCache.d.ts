/**
 * ALGORITHM 3.0 - PHASE 6: INNOVATION #23
 * Smart Caching System
 *
 * Multi-level cache with content-based deduplication.
 * Target: 60-80% cache hit rate, -70% redundant computation.
 *
 * Research: Typical video content has 60-80% frame similarity (temporal coherence)
 *
 * Equal Treatment: All 28 categories benefit from same caching optimizations
 */
import type { TriggerCategory } from '../types/triggers';
/**
 * Cache entry types for different levels
 */
export interface CacheEntry<T> {
    key: string;
    value: T;
    timestamp: number;
    accessCount: number;
    lastAccess: number;
    size: number;
    category?: TriggerCategory;
}
/**
 * Feature cache entry (L1 - most frequently accessed)
 */
export interface FeatureCacheEntry {
    visual?: VisualFeatures;
    audio?: AudioFeatures;
    text?: TextFeatures;
}
interface VisualFeatures {
    colors: number[];
    edges: number[];
    objects: string[];
    hash: string;
}
interface AudioFeatures {
    mfcc: number[];
    spectralCentroid: number;
    zeroCrossingRate: number;
    hash: string;
}
interface TextFeatures {
    tokens: string[];
    embeddings: number[];
    hash: string;
}
/**
 * Embedding cache entry (L2 - intermediate)
 */
export interface EmbeddingCacheEntry {
    visualEmbedding?: number[];
    audioEmbedding?: number[];
    textEmbedding?: number[];
    fusedEmbedding?: number[];
}
/**
 * Prediction cache entry (L3 - final results)
 */
export interface PredictionCacheEntry {
    category: TriggerCategory;
    confidence: number;
    timestamp: number;
    metadata: Record<string, any>;
}
/**
 * Cache statistics
 */
export interface CacheStats {
    totalRequests: number;
    totalHits: number;
    totalMisses: number;
    hitRate: number;
    l1Hits: number;
    l1Misses: number;
    l2Hits: number;
    l2Misses: number;
    l3Hits: number;
    l3Misses: number;
    avgLookupTimeMs: number;
    redundantComputationSaved: number;
    totalMemoryBytes: number;
    l1MemoryBytes: number;
    l2MemoryBytes: number;
    l3MemoryBytes: number;
    l1Evictions: number;
    l2Evictions: number;
    l3Evictions: number;
    duplicatesDetected: number;
    deduplicationSavings: number;
}
/**
 * Cache configuration
 */
interface CacheConfig {
    l1MaxSize: number;
    l2MaxSize: number;
    l3MaxSize: number;
    l1MaxMemory: number;
    l2MaxMemory: number;
    l3MaxMemory: number;
    l1TTL: number;
    l2TTL: number;
    l3TTL: number;
    enableDeduplication: boolean;
    perceptualHashThreshold: number;
    evictionPolicy: 'lru' | 'lfu' | 'hybrid';
}
/**
 * Smart Multi-Level Cache
 *
 * L1: Features (visual, audio, text) - Fastest access
 * L2: Embeddings (intermediate representations) - Medium access
 * L3: Predictions (final results) - Slower but complete
 */
export declare class SmartCache {
    private l1Cache;
    private l2Cache;
    private l3Cache;
    private hashIndex;
    private stats;
    private config;
    constructor(customConfig?: Partial<CacheConfig>);
    /**
     * L1: Get features from cache
     */
    getFeatures(key: string): FeatureCacheEntry | null;
    /**
     * L1: Set features in cache
     */
    setFeatures(key: string, features: FeatureCacheEntry): void;
    /**
     * L2: Get embeddings from cache
     */
    getEmbeddings(key: string): EmbeddingCacheEntry | null;
    /**
     * L2: Set embeddings in cache
     */
    setEmbeddings(key: string, embeddings: EmbeddingCacheEntry): void;
    /**
     * L3: Get predictions from cache
     */
    getPredictions(key: string): PredictionCacheEntry[] | null;
    /**
     * L3: Set predictions in cache
     */
    setPredictions(key: string, predictions: PredictionCacheEntry[]): void;
    /**
     * Generate cache key from content
     */
    generateKey(content: any, prefix?: string): string;
    /**
     * Perceptual image hash (for deduplication)
     * Similar images get similar hashes
     */
    private perceptualImageHash;
    /**
     * Audio fingerprint (for deduplication)
     */
    private audioFingerprint;
    /**
     * Index entry by hash for deduplication
     */
    private indexByHash;
    /**
     * Find duplicate entry by perceptual hash
     */
    private findDuplicate;
    /**
     * Compute hash similarity (Hamming distance for bits)
     */
    private hashSimilarity;
    /**
     * Evict L1 entries (LRU/LFU hybrid)
     */
    private evictL1;
    /**
     * Evict L2 entries
     */
    private evictL2;
    /**
     * Evict L3 entries
     */
    private evictL3;
    /**
     * Select eviction candidates (hybrid LRU + LFU)
     */
    private selectEvictionCandidates;
    /**
     * Check if entry is expired
     */
    private isExpired;
    /**
     * Update entry access stats
     */
    private updateAccess;
    /**
     * Update lookup time stats
     */
    private updateLookupTime;
    /**
     * Estimate memory size of value
     */
    private estimateSize;
    /**
     * Hash string to hex
     */
    private hashString;
    /**
     * Hash array to hex
     */
    private hashArray;
    /**
     * Periodic cleanup of expired entries
     */
    private startPeriodicCleanup;
    /**
     * Cleanup expired entries
     */
    private cleanupExpired;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Get cache sizes
     */
    getSizes(): {
        l1: number;
        l2: number;
        l3: number;
        total: number;
    };
    /**
     * Clear specific level
     */
    clearLevel(level: 'l1' | 'l2' | 'l3'): void;
    /**
     * Clear all caches
     */
    clear(): void;
}
export declare const smartCache: SmartCache;
export {};
//# sourceMappingURL=SmartCache.d.ts.map