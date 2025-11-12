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

import type { TriggerCategory } from '../../types/triggers';
import { logger } from '../../utils/Logger';

/**
 * Cache entry types for different levels
 */
export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccess: number;
  size: number; // Bytes
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
  hash: string; // Perceptual hash for deduplication
}

interface AudioFeatures {
  mfcc: number[];
  spectralCentroid: number;
  zeroCrossingRate: number;
  hash: string; // Audio fingerprint
}

interface TextFeatures {
  tokens: string[];
  embeddings: number[];
  hash: string; // Text hash
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
interface CacheStats {
  // Overall stats
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;

  // Per-level stats
  l1Hits: number;
  l1Misses: number;
  l2Hits: number;
  l2Misses: number;
  l3Hits: number;
  l3Misses: number;

  // Performance
  avgLookupTimeMs: number;
  redundantComputationSaved: number; // Percentage

  // Memory
  totalMemoryBytes: number;
  l1MemoryBytes: number;
  l2MemoryBytes: number;
  l3MemoryBytes: number;

  // Evictions
  l1Evictions: number;
  l2Evictions: number;
  l3Evictions: number;

  // Deduplication
  duplicatesDetected: number;
  deduplicationSavings: number; // Percentage
}

/**
 * Cache configuration
 */
interface CacheConfig {
  // Size limits (entries)
  l1MaxSize: number;
  l2MaxSize: number;
  l3MaxSize: number;

  // Memory limits (bytes)
  l1MaxMemory: number;
  l2MaxMemory: number;
  l3MaxMemory: number;

  // TTL (milliseconds)
  l1TTL: number;
  l2TTL: number;
  l3TTL: number;

  // Deduplication
  enableDeduplication: boolean;
  perceptualHashThreshold: number; // Similarity threshold for content dedup

  // Eviction policy
  evictionPolicy: 'lru' | 'lfu' | 'hybrid';
}

/**
 * Smart Multi-Level Cache
 *
 * L1: Features (visual, audio, text) - Fastest access
 * L2: Embeddings (intermediate representations) - Medium access
 * L3: Predictions (final results) - Slower but complete
 */
export class SmartCache {
  // Three cache levels
  private l1Cache: Map<string, CacheEntry<FeatureCacheEntry>> = new Map();
  private l2Cache: Map<string, CacheEntry<EmbeddingCacheEntry>> = new Map();
  private l3Cache: Map<string, CacheEntry<PredictionCacheEntry[]>> = new Map();

  // Perceptual hash index for deduplication
  private hashIndex: Map<string, string[]> = new Map(); // hash -> [keys]

  // Statistics
  private stats: CacheStats = {
    totalRequests: 0,
    totalHits: 0,
    totalMisses: 0,
    hitRate: 0,
    l1Hits: 0,
    l1Misses: 0,
    l2Hits: 0,
    l2Misses: 0,
    l3Hits: 0,
    l3Misses: 0,
    avgLookupTimeMs: 0,
    redundantComputationSaved: 0,
    totalMemoryBytes: 0,
    l1MemoryBytes: 0,
    l2MemoryBytes: 0,
    l3MemoryBytes: 0,
    l1Evictions: 0,
    l2Evictions: 0,
    l3Evictions: 0,
    duplicatesDetected: 0,
    deduplicationSavings: 0
  };

  // Configuration
  private config: CacheConfig = {
    // Size limits
    l1MaxSize: 1000,  // 1K feature entries
    l2MaxSize: 500,   // 500 embedding entries
    l3MaxSize: 2000,  // 2K prediction entries

    // Memory limits (50MB total)
    l1MaxMemory: 20 * 1024 * 1024,  // 20MB for features
    l2MaxMemory: 15 * 1024 * 1024,  // 15MB for embeddings
    l3MaxMemory: 15 * 1024 * 1024,  // 15MB for predictions

    // TTL
    l1TTL: 30000,   // 30 seconds
    l2TTL: 60000,   // 60 seconds
    l3TTL: 120000,  // 2 minutes

    // Deduplication
    enableDeduplication: true,
    perceptualHashThreshold: 0.90, // 90% similarity

    // Eviction
    evictionPolicy: 'hybrid' // LRU + LFU
  };

  constructor(customConfig?: Partial<CacheConfig>) {
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    logger.info('[SmartCache] 💾 Smart Caching System initialized');
    logger.info(`[SmartCache] 📊 Config: L1=${this.config.l1MaxSize}, L2=${this.config.l2MaxSize}, L3=${this.config.l3MaxSize}`);
    logger.info('[SmartCache] 🎯 Target: 60-80% cache hit rate');

    // Periodic cleanup
    this.startPeriodicCleanup();
  }

  /**
   * L1: Get features from cache
   */
  getFeatures(key: string): FeatureCacheEntry | null {
    const startTime = performance.now();
    this.stats.totalRequests++;

    // Check for exact match
    const entry = this.l1Cache.get(key);
    if (entry && !this.isExpired(entry, this.config.l1TTL)) {
      this.updateAccess(entry);
      this.stats.l1Hits++;
      this.stats.totalHits++;
      this.updateLookupTime(performance.now() - startTime);
      logger.debug(`[SmartCache] ✅ L1 HIT: ${key}`);
      return entry.value;
    }

    // Content-based deduplication: check perceptual hash
    if (this.config.enableDeduplication) {
      const duplicate = this.findDuplicate(key, 'l1');
      if (duplicate) {
        this.stats.duplicatesDetected++;
        this.stats.l1Hits++;
        this.stats.totalHits++;
        this.updateLookupTime(performance.now() - startTime);
        logger.debug(`[SmartCache] ♻️ L1 DEDUP HIT: ${key} -> ${duplicate}`);
        return this.l1Cache.get(duplicate)!.value;
      }
    }

    this.stats.l1Misses++;
    this.stats.totalMisses++;
    this.updateLookupTime(performance.now() - startTime);
    logger.debug(`[SmartCache] ❌ L1 MISS: ${key}`);
    return null;
  }

  /**
   * L1: Set features in cache
   */
  setFeatures(key: string, features: FeatureCacheEntry): void {
    const size = this.estimateSize(features);

    // Check memory limit
    if (this.stats.l1MemoryBytes + size > this.config.l1MaxMemory) {
      this.evictL1(size);
    }

    // Check size limit
    if (this.l1Cache.size >= this.config.l1MaxSize) {
      this.evictL1(0);
    }

    const entry: CacheEntry<FeatureCacheEntry> = {
      key,
      value: features,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccess: Date.now(),
      size
    };

    this.l1Cache.set(key, entry);
    this.stats.l1MemoryBytes += size;
    this.stats.totalMemoryBytes += size;

    // Index by perceptual hash for deduplication
    if (this.config.enableDeduplication) {
      this.indexByHash(key, features, 'l1');
    }

    logger.debug(`[SmartCache] 💾 L1 SET: ${key} (${size} bytes)`);
  }

  /**
   * L2: Get embeddings from cache
   */
  getEmbeddings(key: string): EmbeddingCacheEntry | null {
    const startTime = performance.now();
    this.stats.totalRequests++;

    const entry = this.l2Cache.get(key);
    if (entry && !this.isExpired(entry, this.config.l2TTL)) {
      this.updateAccess(entry);
      this.stats.l2Hits++;
      this.stats.totalHits++;
      this.updateLookupTime(performance.now() - startTime);
      logger.debug(`[SmartCache] ✅ L2 HIT: ${key}`);
      return entry.value;
    }

    // Deduplication
    if (this.config.enableDeduplication) {
      const duplicate = this.findDuplicate(key, 'l2');
      if (duplicate) {
        this.stats.duplicatesDetected++;
        this.stats.l2Hits++;
        this.stats.totalHits++;
        this.updateLookupTime(performance.now() - startTime);
        logger.debug(`[SmartCache] ♻️ L2 DEDUP HIT: ${key}`);
        return this.l2Cache.get(duplicate)!.value;
      }
    }

    this.stats.l2Misses++;
    this.stats.totalMisses++;
    this.updateLookupTime(performance.now() - startTime);
    logger.debug(`[SmartCache] ❌ L2 MISS: ${key}`);
    return null;
  }

  /**
   * L2: Set embeddings in cache
   */
  setEmbeddings(key: string, embeddings: EmbeddingCacheEntry): void {
    const size = this.estimateSize(embeddings);

    if (this.stats.l2MemoryBytes + size > this.config.l2MaxMemory) {
      this.evictL2(size);
    }

    if (this.l2Cache.size >= this.config.l2MaxSize) {
      this.evictL2(0);
    }

    const entry: CacheEntry<EmbeddingCacheEntry> = {
      key,
      value: embeddings,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccess: Date.now(),
      size
    };

    this.l2Cache.set(key, entry);
    this.stats.l2MemoryBytes += size;
    this.stats.totalMemoryBytes += size;

    if (this.config.enableDeduplication) {
      this.indexByHash(key, embeddings, 'l2');
    }

    logger.debug(`[SmartCache] 💾 L2 SET: ${key} (${size} bytes)`);
  }

  /**
   * L3: Get predictions from cache
   */
  getPredictions(key: string): PredictionCacheEntry[] | null {
    const startTime = performance.now();
    this.stats.totalRequests++;

    const entry = this.l3Cache.get(key);
    if (entry && !this.isExpired(entry, this.config.l3TTL)) {
      this.updateAccess(entry);
      this.stats.l3Hits++;
      this.stats.totalHits++;
      this.updateLookupTime(performance.now() - startTime);
      logger.debug(`[SmartCache] ✅ L3 HIT: ${key}`);
      return entry.value;
    }

    // Deduplication
    if (this.config.enableDeduplication) {
      const duplicate = this.findDuplicate(key, 'l3');
      if (duplicate) {
        this.stats.duplicatesDetected++;
        this.stats.l3Hits++;
        this.stats.totalHits++;
        this.updateLookupTime(performance.now() - startTime);
        logger.debug(`[SmartCache] ♻️ L3 DEDUP HIT: ${key}`);
        return this.l3Cache.get(duplicate)!.value;
      }
    }

    this.stats.l3Misses++;
    this.stats.totalMisses++;
    this.updateLookupTime(performance.now() - startTime);
    logger.debug(`[SmartCache] ❌ L3 MISS: ${key}`);
    return null;
  }

  /**
   * L3: Set predictions in cache
   */
  setPredictions(key: string, predictions: PredictionCacheEntry[]): void {
    const size = this.estimateSize(predictions);

    if (this.stats.l3MemoryBytes + size > this.config.l3MaxMemory) {
      this.evictL3(size);
    }

    if (this.l3Cache.size >= this.config.l3MaxSize) {
      this.evictL3(0);
    }

    const entry: CacheEntry<PredictionCacheEntry[]> = {
      key,
      value: predictions,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccess: Date.now(),
      size
    };

    this.l3Cache.set(key, entry);
    this.stats.l3MemoryBytes += size;
    this.stats.totalMemoryBytes += size;

    if (this.config.enableDeduplication) {
      this.indexByHash(key, predictions, 'l3');
    }

    logger.debug(`[SmartCache] 💾 L3 SET: ${key} (${size} bytes)`);
  }

  /**
   * Generate cache key from content
   */
  generateKey(content: any, prefix: string = ''): string {
    // Content-based key generation
    if (typeof content === 'string') {
      return `${prefix}:${this.hashString(content)}`;
    }

    if (content instanceof ImageData) {
      // Perceptual hash for images (faster than full hash)
      return `${prefix}:${this.perceptualImageHash(content)}`;
    }

    if (content instanceof Float32Array) {
      // Audio fingerprint
      return `${prefix}:${this.audioFingerprint(content)}`;
    }

    // Generic object
    return `${prefix}:${this.hashString(JSON.stringify(content))}`;
  }

  /**
   * Perceptual image hash (for deduplication)
   * Similar images get similar hashes
   */
  private perceptualImageHash(imageData: ImageData): string {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Downsample to 8x8 grid
    const gridSize = 8;
    const cellWidth = Math.floor(width / gridSize);
    const cellHeight = Math.floor(height / gridSize);
    const grid: number[] = [];

    for (let gy = 0; gy < gridSize; gy++) {
      for (let gx = 0; gx < gridSize; gx++) {
        let sum = 0;
        let count = 0;

        for (let y = gy * cellHeight; y < (gy + 1) * cellHeight && y < height; y++) {
          for (let x = gx * cellWidth; x < (gx + 1) * cellWidth && x < width; x++) {
            const idx = (y * width + x) * 4;
            const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            sum += gray;
            count++;
          }
        }

        grid.push(count > 0 ? sum / count : 0);
      }
    }

    // DCT-like transformation (simplified)
    const avg = grid.reduce((s, v) => s + v, 0) / grid.length;
    const bits = grid.map(v => v > avg ? '1' : '0').join('');

    // Convert to hex
    const hash = parseInt(bits, 2).toString(16).padStart(16, '0');
    return hash;
  }

  /**
   * Audio fingerprint (for deduplication)
   */
  private audioFingerprint(samples: Float32Array): string {
    // Simplified audio fingerprinting
    const chunkSize = Math.floor(samples.length / 16);
    const fingerprint: number[] = [];

    for (let i = 0; i < 16; i++) {
      let sum = 0;
      for (let j = 0; j < chunkSize; j++) {
        const idx = i * chunkSize + j;
        if (idx < samples.length) {
          sum += Math.abs(samples[idx]);
        }
      }
      fingerprint.push(sum / chunkSize);
    }

    // Quantize to bits
    const avg = fingerprint.reduce((s, v) => s + v, 0) / fingerprint.length;
    const bits = fingerprint.map(v => v > avg ? '1' : '0').join('');

    return parseInt(bits, 2).toString(16).padStart(4, '0');
  }

  /**
   * Index entry by hash for deduplication
   */
  private indexByHash(key: string, value: any, level: 'l1' | 'l2' | 'l3'): void {
    let hash = '';

    if (level === 'l1') {
      const features = value as FeatureCacheEntry;
      hash = features.visual?.hash || features.audio?.hash || features.text?.hash || '';
    } else if (level === 'l2') {
      // Use embedding as hash
      const embeddings = value as EmbeddingCacheEntry;
      const embedding = embeddings.fusedEmbedding || embeddings.visualEmbedding || [];
      hash = this.hashArray(embedding.slice(0, 8)); // First 8 dims
    } else {
      // Use first prediction as hash
      const predictions = value as PredictionCacheEntry[];
      if (predictions.length > 0) {
        hash = `${predictions[0].category}:${predictions[0].confidence.toFixed(2)}`;
      }
    }

    if (hash) {
      const keys = this.hashIndex.get(hash) || [];
      keys.push(key);
      this.hashIndex.set(hash, keys);
    }
  }

  /**
   * Find duplicate entry by perceptual hash
   */
  private findDuplicate(key: string, level: 'l1' | 'l2' | 'l3'): string | null {
    // Extract hash from key
    const hashPart = key.split(':').slice(-1)[0];

    // Find similar hashes
    for (const [hash, keys] of this.hashIndex) {
      if (keys.includes(key)) continue; // Skip self

      // Check similarity
      const similarity = this.hashSimilarity(hashPart, hash);
      if (similarity >= this.config.perceptualHashThreshold) {
        // Found duplicate - return first matching key
        for (const candidateKey of keys) {
          if (level === 'l1' && this.l1Cache.has(candidateKey)) return candidateKey;
          if (level === 'l2' && this.l2Cache.has(candidateKey)) return candidateKey;
          if (level === 'l3' && this.l3Cache.has(candidateKey)) return candidateKey;
        }
      }
    }

    return null;
  }

  /**
   * Compute hash similarity (Hamming distance for bits)
   */
  private hashSimilarity(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) return 0;

    let matches = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] === hash2[i]) matches++;
    }

    return matches / hash1.length;
  }

  /**
   * Evict L1 entries (LRU/LFU hybrid)
   */
  private evictL1(requiredBytes: number): void {
    const toEvict = this.selectEvictionCandidates(this.l1Cache, requiredBytes, this.config.l1MaxSize);

    for (const key of toEvict) {
      const entry = this.l1Cache.get(key)!;
      this.stats.l1MemoryBytes -= entry.size;
      this.stats.totalMemoryBytes -= entry.size;
      this.l1Cache.delete(key);
      this.stats.l1Evictions++;
    }

    if (toEvict.length > 0) {
      logger.debug(`[SmartCache] 🗑️ Evicted ${toEvict.length} L1 entries`);
    }
  }

  /**
   * Evict L2 entries
   */
  private evictL2(requiredBytes: number): void {
    const toEvict = this.selectEvictionCandidates(this.l2Cache, requiredBytes, this.config.l2MaxSize);

    for (const key of toEvict) {
      const entry = this.l2Cache.get(key)!;
      this.stats.l2MemoryBytes -= entry.size;
      this.stats.totalMemoryBytes -= entry.size;
      this.l2Cache.delete(key);
      this.stats.l2Evictions++;
    }

    if (toEvict.length > 0) {
      logger.debug(`[SmartCache] 🗑️ Evicted ${toEvict.length} L2 entries`);
    }
  }

  /**
   * Evict L3 entries
   */
  private evictL3(requiredBytes: number): void {
    const toEvict = this.selectEvictionCandidates(this.l3Cache, requiredBytes, this.config.l3MaxSize);

    for (const key of toEvict) {
      const entry = this.l3Cache.get(key)!;
      this.stats.l3MemoryBytes -= entry.size;
      this.stats.totalMemoryBytes -= entry.size;
      this.l3Cache.delete(key);
      this.stats.l3Evictions++;
    }

    if (toEvict.length > 0) {
      logger.debug(`[SmartCache] 🗑️ Evicted ${toEvict.length} L3 entries`);
    }
  }

  /**
   * Select eviction candidates (hybrid LRU + LFU)
   */
  private selectEvictionCandidates<T>(
    cache: Map<string, CacheEntry<T>>,
    requiredBytes: number,
    maxSize: number
  ): string[] {
    const entries = Array.from(cache.entries());

    if (entries.length === 0) return [];

    // Calculate eviction score (lower = evict first)
    const scored = entries.map(([key, entry]) => {
      const age = Date.now() - entry.lastAccess;
      const frequency = entry.accessCount;

      // Hybrid: balance recency (LRU) and frequency (LFU)
      const score = this.config.evictionPolicy === 'lru'
        ? -age  // LRU: older = lower score
        : this.config.evictionPolicy === 'lfu'
        ? frequency  // LFU: less frequent = lower score
        : frequency * 0.6 - (age / 1000) * 0.4;  // Hybrid

      return { key, entry, score };
    });

    // Sort by score (ascending - lowest first)
    scored.sort((a, b) => a.score - b.score);

    // Evict until we have enough space
    const toEvict: string[] = [];
    let freedBytes = 0;
    let idx = 0;

    while ((freedBytes < requiredBytes || cache.size - toEvict.length > maxSize * 0.9) && idx < scored.length) {
      toEvict.push(scored[idx].key);
      freedBytes += scored[idx].entry.size;
      idx++;
    }

    return toEvict;
  }

  /**
   * Check if entry is expired
   */
  private isExpired<T>(entry: CacheEntry<T>, ttl: number): boolean {
    return Date.now() - entry.timestamp > ttl;
  }

  /**
   * Update entry access stats
   */
  private updateAccess<T>(entry: CacheEntry<T>): void {
    entry.accessCount++;
    entry.lastAccess = Date.now();
  }

  /**
   * Update lookup time stats
   */
  private updateLookupTime(timeMs: number): void {
    const totalRequests = this.stats.totalRequests;
    this.stats.avgLookupTimeMs =
      (this.stats.avgLookupTimeMs * (totalRequests - 1) + timeMs) / totalRequests;
  }

  /**
   * Estimate memory size of value
   */
  private estimateSize(value: any): number {
    // Rough estimation (actual size depends on V8 implementation)
    const str = JSON.stringify(value);
    return str.length * 2; // UTF-16 encoding
  }

  /**
   * Hash string to hex
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Hash array to hex
   */
  private hashArray(arr: number[]): string {
    const str = arr.map(v => v.toFixed(3)).join(',');
    return this.hashString(str);
  }

  /**
   * Periodic cleanup of expired entries
   */
  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanupExpired();
    }, 30000); // Every 30 seconds
  }

  /**
   * Cleanup expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let cleaned = 0;

    // L1
    for (const [key, entry] of this.l1Cache) {
      if (now - entry.timestamp > this.config.l1TTL) {
        this.stats.l1MemoryBytes -= entry.size;
        this.stats.totalMemoryBytes -= entry.size;
        this.l1Cache.delete(key);
        cleaned++;
      }
    }

    // L2
    for (const [key, entry] of this.l2Cache) {
      if (now - entry.timestamp > this.config.l2TTL) {
        this.stats.l2MemoryBytes -= entry.size;
        this.stats.totalMemoryBytes -= entry.size;
        this.l2Cache.delete(key);
        cleaned++;
      }
    }

    // L3
    for (const [key, entry] of this.l3Cache) {
      if (now - entry.timestamp > this.config.l3TTL) {
        this.stats.l3MemoryBytes -= entry.size;
        this.stats.totalMemoryBytes -= entry.size;
        this.l3Cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`[SmartCache] 🧹 Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    // Calculate hit rate
    const totalRequests = this.stats.totalRequests;
    this.stats.hitRate = totalRequests > 0
      ? (this.stats.totalHits / totalRequests) * 100
      : 0;

    // Calculate redundant computation saved
    this.stats.redundantComputationSaved = this.stats.hitRate; // Hits = computation saved

    // Calculate deduplication savings
    this.stats.deduplicationSavings = totalRequests > 0
      ? (this.stats.duplicatesDetected / totalRequests) * 100
      : 0;

    return {
      ...this.stats,
      totalMemoryBytes: this.stats.l1MemoryBytes + this.stats.l2MemoryBytes + this.stats.l3MemoryBytes
    };
  }

  /**
   * Get cache sizes
   */
  getSizes(): { l1: number; l2: number; l3: number; total: number } {
    return {
      l1: this.l1Cache.size,
      l2: this.l2Cache.size,
      l3: this.l3Cache.size,
      total: this.l1Cache.size + this.l2Cache.size + this.l3Cache.size
    };
  }

  /**
   * Clear specific level
   */
  clearLevel(level: 'l1' | 'l2' | 'l3'): void {
    if (level === 'l1') {
      this.stats.totalMemoryBytes -= this.stats.l1MemoryBytes;
      this.stats.l1MemoryBytes = 0;
      this.l1Cache.clear();
      logger.info('[SmartCache] 🧹 Cleared L1 cache');
    } else if (level === 'l2') {
      this.stats.totalMemoryBytes -= this.stats.l2MemoryBytes;
      this.stats.l2MemoryBytes = 0;
      this.l2Cache.clear();
      logger.info('[SmartCache] 🧹 Cleared L2 cache');
    } else {
      this.stats.totalMemoryBytes -= this.stats.l3MemoryBytes;
      this.stats.l3MemoryBytes = 0;
      this.l3Cache.clear();
      logger.info('[SmartCache] 🧹 Cleared L3 cache');
    }
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.l1Cache.clear();
    this.l2Cache.clear();
    this.l3Cache.clear();
    this.hashIndex.clear();

    this.stats = {
      totalRequests: 0,
      totalHits: 0,
      totalMisses: 0,
      hitRate: 0,
      l1Hits: 0,
      l1Misses: 0,
      l2Hits: 0,
      l2Misses: 0,
      l3Hits: 0,
      l3Misses: 0,
      avgLookupTimeMs: 0,
      redundantComputationSaved: 0,
      totalMemoryBytes: 0,
      l1MemoryBytes: 0,
      l2MemoryBytes: 0,
      l3MemoryBytes: 0,
      l1Evictions: 0,
      l2Evictions: 0,
      l3Evictions: 0,
      duplicatesDetected: 0,
      deduplicationSavings: 0
    };

    logger.info('[SmartCache] 🧹 Cleared all caches');
  }
}

// Singleton instance
export const smartCache = new SmartCache();
