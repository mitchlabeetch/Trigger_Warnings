/**
 * ALGORITHM 3.0 - PHASE 6: INNOVATION #22
 * Incremental Processing Pipeline
 *
 * Stream-based processing with <5ms latency per detection.
 * No batch delays, frame-by-frame analysis, lazy computation.
 *
 * Research: Martinez et al. (2023) - 70% latency reduction with incremental processing
 *
 * Equal Treatment: All 28 categories processed with same low-latency streaming pipeline
 */
import type { TriggerCategory } from '../types/triggers';
/**
 * Input types for incremental processing
 */
export interface IncrementalInput {
    type: 'text' | 'video-frame' | 'audio-chunk' | 'image';
    data: TextChunk | VideoFrame | AudioChunk | ImageData;
    timestamp: number;
    sequenceId: string;
}
export interface TextChunk {
    text: string;
    position: number;
    isComplete: boolean;
}
export interface VideoFrame {
    imageData: ImageData;
    frameNumber: number;
    fps: number;
    isKeyFrame: boolean;
}
export interface AudioChunk {
    samples: Float32Array;
    sampleRate: number;
    channelCount: number;
    startTime: number;
}
/**
 * Incremental processing result (partial or complete)
 */
export interface IncrementalResult {
    category: TriggerCategory;
    confidence: number;
    isPartial: boolean;
    latency: number;
    features: PartialFeatures;
    needsMoreData: boolean;
}
export interface PartialFeatures {
    visual?: Partial<VisualFeatures>;
    audio?: Partial<AudioFeatures>;
    text?: Partial<TextFeatures>;
    completeness: number;
}
interface VisualFeatures {
    colors: number[];
    edges: number[];
    motion: number[];
    objects: string[];
}
interface AudioFeatures {
    spectralCentroid: number;
    zeroCrossingRate: number;
    mfcc: number[];
    loudness: number;
}
interface TextFeatures {
    tokens: string[];
    embeddings: number[];
    sentiment: number;
    entities: string[];
}
/**
 * Performance metrics
 */
interface IncrementalStats {
    totalChunksProcessed: number;
    avgLatencyMs: number;
    maxLatencyMs: number;
    minLatencyMs: number;
    partialResults: number;
    completeResults: number;
    lazyComputationSavings: number;
    streamCount: number;
}
/**
 * Incremental Processing Pipeline
 *
 * Processes data as it arrives (streaming), no batch delays.
 * Uses lazy computation to only process what's needed.
 */
export declare class IncrementalProcessor {
    private streams;
    private stats;
    private readonly LAZY_THRESHOLDS;
    private readonly TARGET_LATENCY_MS;
    private readonly MAX_STREAM_AGE_MS;
    constructor();
    /**
     * Process incoming data chunk incrementally
     * Target: <5ms latency
     */
    processChunk(input: IncrementalInput): IncrementalResult[];
    /**
     * Process text word-by-word (instant feedback)
     */
    processTextIncremental(text: string, sequenceId: string, position?: number): IncrementalResult[];
    /**
     * Process video frame-by-frame (no buffer waits)
     */
    processVideoFrame(imageData: ImageData, frameNumber: number, fps: number, sequenceId: string): IncrementalResult[];
    /**
     * Process audio chunk-by-chunk (streaming)
     */
    processAudioChunk(samples: Float32Array, sampleRate: number, sequenceId: string, startTime?: number): IncrementalResult[];
    /**
     * Extract features incrementally (lazy computation)
     */
    private extractFeaturesIncremental;
    /**
     * Extract text features word-by-word
     */
    private extractTextFeaturesIncremental;
    /**
     * Extract visual features frame-by-frame
     */
    private extractVisualFeaturesIncremental;
    /**
     * Extract audio features chunk-by-chunk
     */
    private extractAudioFeaturesIncremental;
    /**
     * Extract image features (complete)
     */
    private extractImageFeatures;
    /**
     * Merge new features with accumulated features
     */
    private mergeFeatures;
    /**
     * Try to make early decision (lazy computation)
     */
    private tryEarlyDecision;
    /**
     * Generate incremental results for all categories
     */
    private generateIncrementalResults;
    /**
     * Predict category from partial features (fast heuristics)
     */
    private predictFromPartialFeatures;
    /**
     * Score visual features for category (fast heuristics)
     */
    private scoreVisualForCategory;
    /**
     * Score audio features for category (fast heuristics)
     */
    private scoreAudioForCategory;
    /**
     * Score text features for category (fast keyword matching)
     */
    private scoreTextForCategory;
    /**
     * Get keywords for category (fast heuristics)
     */
    private getCategoryKeywords;
    /**
     * Lazy computation: should skip visual processing?
     */
    private shouldSkipVisualProcessing;
    /**
     * Lazy computation: should skip audio processing?
     */
    private shouldSkipAudioProcessing;
    /**
     * Get highest text confidence from accumulated features
     */
    private getHighestTextConfidence;
    /**
     * Get highest visual confidence from accumulated features
     */
    private getHighestVisualConfidence;
    /**
     * Create new stream state
     */
    private createStreamState;
    /**
     * Update statistics
     */
    private updateStats;
    /**
     * Periodic cleanup of old streams
     */
    private startStreamCleanup;
    /**
     * Fast text embedding (character trigrams)
     */
    private fastTextEmbedding;
    /**
     * Fast edge detection (Sobel approximation, downsampled)
     */
    private fastEdgeDetection;
    /**
     * Estimate motion between frames
     */
    private estimateMotion;
    /**
     * Fast FFT approximation for audio
     */
    private fastFFTApproximation;
    /**
     * Hash string to number
     */
    private hashString;
    /**
     * Finalize stream (mark as complete)
     */
    finalizeStream(sequenceId: string): void;
    /**
     * Get statistics
     */
    getStats(): IncrementalStats;
    /**
     * Clear all state
     */
    clear(): void;
}
export declare const incrementalProcessor: IncrementalProcessor;
export {};
//# sourceMappingURL=IncrementalProcessor.d.ts.map