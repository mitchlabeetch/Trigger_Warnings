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
    hashSize?: number;
    downscaleSize?: number;
    similarityThreshold?: number;
}
/**
 * Content Fingerprint Cache
 *
 * Generates robust perceptual hashes and caches detection results
 */
export declare class ContentFingerprintCache {
    private cache;
    private fingerprintIndex;
    private indexedDB;
    private readonly DB_NAME;
    private readonly DB_VERSION;
    private readonly STORE_NAME;
    private readonly MAX_MEMORY_ENTRIES;
    private readonly DEFAULT_TTL;
    private readonly SIMILARITY_THRESHOLD;
    private stats;
    constructor();
    /**
     * Generate perceptual hash for image data
     * Robust to minor changes (compression, resizing, color adjustments)
     */
    generateImageFingerprint(imageData: ImageData, options?: FingerprintOptions): string;
    /**
     * Generate fingerprint for audio samples
     */
    generateAudioFingerprint(samples: Float32Array, sampleRate?: number, options?: FingerprintOptions): string;
    /**
     * Generate fingerprint for text
     */
    generateTextFingerprint(text: string, options?: FingerprintOptions): string;
    /**
     * Generate composite fingerprint (multi-modal)
     */
    generateCompositeFingerprint(components: {
        image?: ImageData;
        audio?: Float32Array;
        text?: string;
        sampleRate?: number;
    }): string;
    /**
     * Get cached results for fingerprint
     */
    getCachedResults(fingerprint: string): Promise<CachedDetectionResult[] | null>;
    /**
     * Cache detection results
     */
    cacheResults(fingerprint: string, results: CachedDetectionResult[], ttl?: number): Promise<void>;
    /**
     * Invalidate cached results (after user feedback)
     */
    invalidateFingerprint(fingerprint: string): Promise<void>;
    /**
     * Initialize IndexedDB
     */
    private initializeIndexedDB;
    /**
     * Get entry from IndexedDB
     */
    private getFromIndexedDB;
    /**
     * Save entry to IndexedDB
     */
    private saveToIndexedDB;
    /**
     * Delete entry from IndexedDB
     */
    private deleteFromIndexedDB;
    /**
     * Index fingerprint for similarity search
     */
    private indexFingerprint;
    /**
     * Remove fingerprint from index
     */
    private removeFromIndex;
    /**
     * Find similar fingerprint (fuzzy matching)
     */
    private findSimilarFingerprint;
    /**
     * Compute similarity between two fingerprints (Hamming distance)
     */
    private computeSimilarity;
    /**
     * Downscale image to target size
     */
    private downscaleImage;
    /**
     * Convert to grayscale (already done in downscale)
     */
    private toGrayscale;
    /**
     * Compute DCT (simplified - just use pixel differences)
     */
    private computeDCT;
    /**
     * Compute median value
     */
    private computeMedian;
    /**
     * Generate hash bits from DCT values vs median
     */
    private generateHash;
    /**
     * Simple fallback image hash
     */
    private simpleImageHash;
    /**
     * Downsample audio
     */
    private downsampleAudio;
    /**
     * Compute spectrum (simplified FFT)
     */
    private computeSpectrum;
    /**
     * Extract spectral peaks
     */
    private extractPeaks;
    /**
     * Hash peak positions
     */
    private hashPeaks;
    /**
     * Simple fallback audio hash
     */
    private simpleAudioHash;
    /**
     * Hash string (simple hash function)
     */
    private hashString;
    /**
     * Convert binary string to hex
     */
    private binaryToHex;
    /**
     * Check if cache entry is expired
     */
    private isExpired;
    /**
     * Evict least recently used entry
     */
    private evictLRU;
    /**
     * Periodic cleanup of expired entries
     */
    private startPeriodicCleanup;
    /**
     * Update statistics
     */
    private updateStats;
    /**
     * Get statistics
     */
    getStats(): CacheStats;
    /**
     * Clear all caches
     */
    clear(): Promise<void>;
}
export declare const contentFingerprintCache: ContentFingerprintCache;
export {};
//# sourceMappingURL=ContentFingerprintCache.d.ts.map