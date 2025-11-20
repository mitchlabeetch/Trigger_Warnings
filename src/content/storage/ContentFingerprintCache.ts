/**
 * ALGORITHM 3.0 - PHASE 7: INNOVATION #24
 * Content Fingerprinting & Result Cache
 *
 * Generates perceptual hashes for content and caches detection results.
 * Prevents reprocessing of same content across sessions.
 *
 * Target: 70-90% cache hit rate on repeat content
 *
 * Equal Treatment: All 28 categories benefit from same caching strategy
 */

import type { TriggerCategory } from '../types/triggers';
import { logger } from '../utils/Logger';

/**
 * Detection result to cache
 */
export interface CachedDetectionResult {
  category: TriggerCategory;
  confidence: number;
  source: string;
  timestamp: number;
  algorithmVersion: string;
  metadata?: Record<string, any>;
}

/**
 * Cache entry with TTL
 */
interface CacheEntry {
  fingerprint: string;
  results: CachedDetectionResult[];
  cachedAt: number;
  ttl: number;
  hitCount: number;
  lastAccess: number;
}

/**
 * Cache statistics
 */
interface CacheStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  totalFingerprints: number;
  memoryUsageBytes: number;
  avgHitsPerFingerprint: number;
  evictions: number;
}

/**
 * Fingerprint options
 */
interface FingerprintOptions {
  hashSize?: number;        // Size of perceptual hash (default: 8x8 = 64 bits)
  downscaleSize?: number;   // Downscale to this size before hashing
  similarityThreshold?: number; // 0-1, how similar to consider a match
}

/**
 * Content Fingerprint Cache
 *
 * Generates robust perceptual hashes and caches detection results
 */
export class ContentFingerprintCache {
  // In-memory cache (L1)
  private cache: Map<string, CacheEntry> = new Map();

  // Similarity index (for fuzzy matching)
  private fingerprintIndex: Map<string, string[]> = new Map();

  // IndexedDB for persistent storage (L2) - initialized lazily
  private indexedDB: IDBDatabase | null = null;
  private readonly DB_NAME = 'TriggerWarningsCache';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'detectionResults';

  // Configuration
  private readonly MAX_MEMORY_ENTRIES = 1000;  // Max entries in memory
  private readonly DEFAULT_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly SIMILARITY_THRESHOLD = 0.90; // 90% similar = match

  // Statistics
  private stats: CacheStats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    hitRate: 0,
    totalFingerprints: 0,
    memoryUsageBytes: 0,
    avgHitsPerFingerprint: 0,
    evictions: 0
  };

  constructor() {
    logger.info('[FingerprintCache] 🔐 Content Fingerprint Cache initialized');
    logger.info(`[FingerprintCache] 💾 Max memory: ${this.MAX_MEMORY_ENTRIES} entries, TTL: ${this.DEFAULT_TTL / 1000 / 60 / 60 / 24} days`);

    // Initialize IndexedDB (async)
    this.initializeIndexedDB();

    // Periodic cleanup
    this.startPeriodicCleanup();
  }

  // ========================================
  // PERCEPTUAL HASHING
  // ========================================

  /**
   * Generate perceptual hash for image data
   * Robust to minor changes (compression, resizing, color adjustments)
   */
  generateImageFingerprint(
    imageData: ImageData,
    options: FingerprintOptions = {}
  ): string {
    const hashSize = options.hashSize || 8;
    const downscaleSize = options.downscaleSize || 32;

    try {
      // 1. Downscale to small size (e.g., 32x32)
      const downscaled = this.downscaleImage(imageData, downscaleSize, downscaleSize);

      // 2. Convert to grayscale
      const grayscale = this.toGrayscale(downscaled);

      // 3. Compute DCT (Discrete Cosine Transform) - simplified
      const dct = this.computeDCT(grayscale, hashSize);

      // 4. Compute median
      const median = this.computeMedian(dct);

      // 5. Generate hash (bits based on median threshold)
      const hash = this.generateHash(dct, median);

      // 6. Convert to hex string
      const fingerprint = `img:${hash}`;

      logger.debug(`[FingerprintCache] 🔐 Generated image fingerprint: ${fingerprint}`);
      return fingerprint;

    } catch (error) {
      logger.error('[FingerprintCache] ❌ Error generating image fingerprint:', error);
      // Fallback to simpler hash
      return `img:${this.simpleImageHash(imageData)}`;
    }
  }

  /**
   * Generate fingerprint for audio samples
   */
  generateAudioFingerprint(
    samples: Float32Array,
    sampleRate: number = 48000,
    options: FingerprintOptions = {}
  ): string {
    try {
      // 1. Downsample to reduce size
      const downsampled = this.downsampleAudio(samples, sampleRate, 8000);

      // 2. Compute spectral features (simplified FFT)
      const spectrum = this.computeSpectrum(downsampled);

      // 3. Extract peaks
      const peaks = this.extractPeaks(spectrum, 32);

      // 4. Generate hash from peak positions
      const hash = this.hashPeaks(peaks);

      const fingerprint = `audio:${hash}`;

      logger.debug(`[FingerprintCache] 🔐 Generated audio fingerprint: ${fingerprint}`);
      return fingerprint;

    } catch (error) {
      logger.error('[FingerprintCache] ❌ Error generating audio fingerprint:', error);
      return `audio:${this.simpleAudioHash(samples)}`;
    }
  }

  /**
   * Generate fingerprint for text
   */
  generateTextFingerprint(text: string, options: FingerprintOptions = {}): string {
    try {
      // Normalize text (lowercase, remove extra spaces)
      const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();

      // Use SHA-256-like hash (simplified)
      const hash = this.hashString(normalized);

      const fingerprint = `text:${hash}`;

      logger.debug(`[FingerprintCache] 🔐 Generated text fingerprint: ${fingerprint}`);
      return fingerprint;

    } catch (error) {
      logger.error('[FingerprintCache] ❌ Error generating text fingerprint:', error);
      return `text:${Date.now()}`;
    }
  }

  /**
   * Generate composite fingerprint (multi-modal)
   */
  generateCompositeFingerprint(components: {
    image?: ImageData;
    audio?: Float32Array;
    text?: string;
    sampleRate?: number;
  }): string {
    const parts: string[] = [];

    if (components.image) {
      parts.push(this.generateImageFingerprint(components.image));
    }

    if (components.audio) {
      parts.push(this.generateAudioFingerprint(components.audio, components.sampleRate));
    }

    if (components.text) {
      parts.push(this.generateTextFingerprint(components.text));
    }

    // Combine all parts
    const composite = parts.join('|');
    const hash = this.hashString(composite);

    return `composite:${hash}`;
  }

  // ========================================
  // CACHING
  // ========================================

  /**
   * Get cached results for fingerprint
   */
  async getCachedResults(fingerprint: string): Promise<CachedDetectionResult[] | null> {
    this.stats.totalRequests++;

    // L1: Check memory cache
    const memoryHit = this.cache.get(fingerprint);
    if (memoryHit && !this.isExpired(memoryHit)) {
      memoryHit.hitCount++;
      memoryHit.lastAccess = Date.now();
      this.stats.cacheHits++;
      this.updateStats();
      logger.debug(`[FingerprintCache] ✅ L1 cache hit: ${fingerprint}`);
      return memoryHit.results;
    }

    // L1: Check for similar fingerprints (fuzzy matching)
    const similarFingerprint = this.findSimilarFingerprint(fingerprint);
    if (similarFingerprint) {
      const similarHit = this.cache.get(similarFingerprint);
      if (similarHit && !this.isExpired(similarHit)) {
        similarHit.hitCount++;
        similarHit.lastAccess = Date.now();
        this.stats.cacheHits++;
        this.updateStats();
        logger.debug(`[FingerprintCache] ✅ L1 fuzzy match: ${fingerprint} → ${similarFingerprint}`);
        return similarHit.results;
      }
    }

    // L2: Check IndexedDB
    const indexedDBHit = await this.getFromIndexedDB(fingerprint);
    if (indexedDBHit) {
      // Promote to L1 cache
      this.cache.set(fingerprint, indexedDBHit);
      this.indexFingerprint(fingerprint);
      this.stats.cacheHits++;
      this.updateStats();
      logger.debug(`[FingerprintCache] ✅ L2 (IndexedDB) hit: ${fingerprint}`);
      return indexedDBHit.results;
    }

    // Cache miss
    this.stats.cacheMisses++;
    this.updateStats();
    logger.debug(`[FingerprintCache] ❌ Cache miss: ${fingerprint}`);
    return null;
  }

  /**
   * Cache detection results
   */
  async cacheResults(
    fingerprint: string,
    results: CachedDetectionResult[],
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    const entry: CacheEntry = {
      fingerprint,
      results,
      cachedAt: Date.now(),
      ttl,
      hitCount: 0,
      lastAccess: Date.now()
    };

    // Store in L1 (memory)
    this.cache.set(fingerprint, entry);
    this.indexFingerprint(fingerprint);
    this.stats.totalFingerprints = this.cache.size;

    // Evict if over limit
    if (this.cache.size > this.MAX_MEMORY_ENTRIES) {
      this.evictLRU();
    }

    // Store in L2 (IndexedDB) - async, don't wait
    this.saveToIndexedDB(entry);

    logger.debug(`[FingerprintCache] 💾 Cached results: ${fingerprint} (${results.length} detections)`);
  }

  /**
   * Invalidate cached results (after user feedback)
   */
  async invalidateFingerprint(fingerprint: string): Promise<void> {
    // Remove from L1
    this.cache.delete(fingerprint);

    // Remove from index
    this.removeFromIndex(fingerprint);

    // Remove from L2 (IndexedDB)
    await this.deleteFromIndexedDB(fingerprint);

    logger.debug(`[FingerprintCache] 🗑️ Invalidated: ${fingerprint}`);
  }

  // ========================================
  // INDEXEDDB OPERATIONS
  // ========================================

  /**
   * Initialize IndexedDB
   */
  private async initializeIndexedDB(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      logger.warn('[FingerprintCache] ⚠️ IndexedDB not available - memory-only mode');
      return;
    }

    try {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        logger.error('[FingerprintCache] ❌ Failed to open IndexedDB');
      };

      request.onsuccess = () => {
        this.indexedDB = request.result;
        logger.info('[FingerprintCache] ✅ IndexedDB initialized');
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'fingerprint' });
          store.createIndex('cachedAt', 'cachedAt', { unique: false });
          logger.info('[FingerprintCache] 🔧 Created IndexedDB object store');
        }
      };

    } catch (error) {
      logger.error('[FingerprintCache] ❌ Error initializing IndexedDB:', error);
    }
  }

  /**
   * Get entry from IndexedDB
   */
  private async getFromIndexedDB(fingerprint: string): Promise<CacheEntry | null> {
    if (!this.indexedDB) return null;

    return new Promise((resolve) => {
      try {
        const transaction = this.indexedDB!.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(fingerprint);

        request.onsuccess = () => {
          const entry = request.result as CacheEntry | undefined;
          if (entry && !this.isExpired(entry)) {
            resolve(entry);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          logger.error('[FingerprintCache] ❌ IndexedDB read error');
          resolve(null);
        };

      } catch (error) {
        logger.error('[FingerprintCache] ❌ Error reading from IndexedDB:', error);
        resolve(null);
      }
    });
  }

  /**
   * Save entry to IndexedDB
   */
  private async saveToIndexedDB(entry: CacheEntry): Promise<void> {
    if (!this.indexedDB) return;

    try {
      const transaction = this.indexedDB.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      store.put(entry);

    } catch (error) {
      logger.error('[FingerprintCache] ❌ Error saving to IndexedDB:', error);
    }
  }

  /**
   * Delete entry from IndexedDB
   */
  private async deleteFromIndexedDB(fingerprint: string): Promise<void> {
    if (!this.indexedDB) return;

    try {
      const transaction = this.indexedDB.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      store.delete(fingerprint);

    } catch (error) {
      logger.error('[FingerprintCache] ❌ Error deleting from IndexedDB:', error);
    }
  }

  // ========================================
  // FUZZY MATCHING
  // ========================================

  /**
   * Index fingerprint for similarity search
   */
  private indexFingerprint(fingerprint: string): void {
    // Extract hash component (after prefix)
    const hash = fingerprint.split(':')[1];
    if (!hash) return;

    // Store in index (grouped by first few chars for faster lookup)
    const prefix = hash.substring(0, 4);
    const existing = this.fingerprintIndex.get(prefix) || [];
    existing.push(fingerprint);
    this.fingerprintIndex.set(prefix, existing);
  }

  /**
   * Remove fingerprint from index
   */
  private removeFromIndex(fingerprint: string): void {
    const hash = fingerprint.split(':')[1];
    if (!hash) return;

    const prefix = hash.substring(0, 4);
    const existing = this.fingerprintIndex.get(prefix) || [];
    const filtered = existing.filter(f => f !== fingerprint);

    if (filtered.length > 0) {
      this.fingerprintIndex.set(prefix, filtered);
    } else {
      this.fingerprintIndex.delete(prefix);
    }
  }

  /**
   * Find similar fingerprint (fuzzy matching)
   */
  private findSimilarFingerprint(fingerprint: string): string | null {
    const hash = fingerprint.split(':')[1];
    if (!hash) return null;

    const prefix = hash.substring(0, 4);
    const candidates = this.fingerprintIndex.get(prefix) || [];

    // Find most similar candidate
    let bestMatch: string | null = null;
    let bestSimilarity = 0;

    for (const candidate of candidates) {
      if (candidate === fingerprint) continue;

      const similarity = this.computeSimilarity(fingerprint, candidate);
      if (similarity >= this.SIMILARITY_THRESHOLD && similarity > bestSimilarity) {
        bestMatch = candidate;
        bestSimilarity = similarity;
      }
    }

    return bestMatch;
  }

  /**
   * Compute similarity between two fingerprints (Hamming distance)
   */
  private computeSimilarity(fp1: string, fp2: string): number {
    const hash1 = fp1.split(':')[1] || '';
    const hash2 = fp2.split(':')[1] || '';

    if (hash1.length !== hash2.length) return 0;

    let matches = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] === hash2[i]) matches++;
    }

    return matches / hash1.length;
  }

  // ========================================
  // IMAGE PROCESSING (Perceptual Hashing)
  // ========================================

  /**
   * Downscale image to target size
   */
  private downscaleImage(imageData: ImageData, targetWidth: number, targetHeight: number): number[][] {
    const { width, height, data } = imageData;
    const result: number[][] = [];

    const scaleX = width / targetWidth;
    const scaleY = height / targetHeight;

    for (let y = 0; y < targetHeight; y++) {
      const row: number[] = [];
      for (let x = 0; x < targetWidth; x++) {
        // Sample center of block
        const srcX = Math.floor(x * scaleX);
        const srcY = Math.floor(y * scaleY);
        const idx = (srcY * width + srcX) * 4;

        // Average RGB to grayscale
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        row.push(gray);
      }
      result.push(row);
    }

    return result;
  }

  /**
   * Convert to grayscale (already done in downscale)
   */
  private toGrayscale(pixels: number[][]): number[][] {
    return pixels; // Already grayscale from downscaleImage
  }

  /**
   * Compute DCT (simplified - just use pixel differences)
   */
  private computeDCT(pixels: number[][], hashSize: number): number[] {
    const dct: number[] = [];

    // Simplified: just flatten and take first hashSize^2 values
    for (let y = 0; y < Math.min(hashSize, pixels.length); y++) {
      for (let x = 0; x < Math.min(hashSize, pixels[y].length); x++) {
        dct.push(pixels[y][x]);
      }
    }

    return dct;
  }

  /**
   * Compute median value
   */
  private computeMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Generate hash bits from DCT values vs median
   */
  private generateHash(dct: number[], median: number): string {
    let hash = '';
    for (let i = 0; i < dct.length; i++) {
      hash += dct[i] > median ? '1' : '0';
    }

    // Convert binary string to hex
    return this.binaryToHex(hash);
  }

  /**
   * Simple fallback image hash
   */
  private simpleImageHash(imageData: ImageData): string {
    const { data } = imageData;
    let hash = 0;

    // Sample every 100th pixel
    for (let i = 0; i < data.length; i += 400) {
      hash = ((hash << 5) - hash) + data[i];
      hash = hash & hash; // Convert to 32-bit
    }

    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  // ========================================
  // AUDIO PROCESSING
  // ========================================

  /**
   * Downsample audio
   */
  private downsampleAudio(samples: Float32Array, fromRate: number, toRate: number): Float32Array {
    if (fromRate === toRate) return samples;

    const ratio = fromRate / toRate;
    const newLength = Math.floor(samples.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const srcIdx = Math.floor(i * ratio);
      result[i] = samples[srcIdx];
    }

    return result;
  }

  /**
   * Compute spectrum (simplified FFT)
   */
  private computeSpectrum(samples: Float32Array): number[] {
    const bins = 64;
    const binSize = Math.floor(samples.length / bins);
    const spectrum: number[] = [];

    for (let i = 0; i < bins; i++) {
      let energy = 0;
      for (let j = 0; j < binSize; j++) {
        const idx = i * binSize + j;
        if (idx < samples.length) {
          energy += samples[idx] * samples[idx];
        }
      }
      spectrum.push(Math.sqrt(energy / binSize));
    }

    return spectrum;
  }

  /**
   * Extract spectral peaks
   */
  private extractPeaks(spectrum: number[], count: number): number[] {
    const indexed = spectrum.map((value, index) => ({ value, index }));
    indexed.sort((a, b) => b.value - a.value);
    return indexed.slice(0, count).map(p => p.index);
  }

  /**
   * Hash peak positions
   */
  private hashPeaks(peaks: number[]): string {
    const str = peaks.sort((a, b) => a - b).join(',');
    return this.hashString(str).substring(0, 16);
  }

  /**
   * Simple fallback audio hash
   */
  private simpleAudioHash(samples: Float32Array): string {
    let hash = 0;

    for (let i = 0; i < samples.length; i += 100) {
      const value = Math.floor(samples[i] * 1000);
      hash = ((hash << 5) - hash) + value;
      hash = hash & hash;
    }

    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  // ========================================
  // UTILITIES
  // ========================================

  /**
   * Hash string (simple hash function)
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
   * Convert binary string to hex
   */
  private binaryToHex(binary: string): string {
    let hex = '';

    for (let i = 0; i < binary.length; i += 4) {
      const chunk = binary.substring(i, i + 4);
      const value = parseInt(chunk, 2);
      hex += value.toString(16);
    }

    return hex;
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.cachedAt > entry.ttl;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestEntry: [string, CacheEntry] | null = null;
    let oldestAccess = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.lastAccess < oldestAccess) {
        oldestAccess = entry.lastAccess;
        oldestEntry = [key, entry];
      }
    }

    if (oldestEntry) {
      this.cache.delete(oldestEntry[0]);
      this.removeFromIndex(oldestEntry[0]);
      this.stats.evictions++;
      logger.debug(`[FingerprintCache] 🗑️ Evicted LRU entry: ${oldestEntry[0]}`);
    }
  }

  /**
   * Periodic cleanup of expired entries
   */
  private startPeriodicCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const toDelete: string[] = [];

      for (const [key, entry] of this.cache) {
        if (now - entry.cachedAt > entry.ttl) {
          toDelete.push(key);
        }
      }

      toDelete.forEach(key => {
        this.cache.delete(key);
        this.removeFromIndex(key);
      });

      if (toDelete.length > 0) {
        logger.debug(`[FingerprintCache] 🧹 Cleaned up ${toDelete.length} expired entries`);
      }
    }, 60000); // Every minute
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    this.stats.hitRate = this.stats.totalRequests > 0
      ? (this.stats.cacheHits / this.stats.totalRequests) * 100
      : 0;

    let totalHits = 0;
    for (const entry of this.cache.values()) {
      totalHits += entry.hitCount;
    }

    this.stats.avgHitsPerFingerprint = this.cache.size > 0
      ? totalHits / this.cache.size
      : 0;

    // Estimate memory usage
    this.stats.memoryUsageBytes = this.cache.size * 1024; // ~1KB per entry (rough estimate)
  }

  /**
   * Get statistics
   */
  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.fingerprintIndex.clear();

    // Clear IndexedDB
    if (this.indexedDB) {
      try {
        const transaction = this.indexedDB.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        store.clear();
      } catch (error) {
        logger.error('[FingerprintCache] ❌ Error clearing IndexedDB:', error);
      }
    }

    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      totalFingerprints: 0,
      memoryUsageBytes: 0,
      avgHitsPerFingerprint: 0,
      evictions: 0
    };

    logger.info('[FingerprintCache] 🧹 Cleared all caches');
  }
}

// Singleton instance
export const contentFingerprintCache = new ContentFingerprintCache();
