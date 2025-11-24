/**
 * ALGORITHM 3.0 - PHASE 6: INNOVATION #24
 * Parallel Detection Engine
 *
 * Web Worker pool with category-parallel execution.
 * Target: 10,000+ detections/second, 3-5x throughput increase.
 *
 * Research: Chen et al. (2022) - 3-5x throughput with parallel pipelines
 *
 * Equal Treatment: All 28 categories processed in parallel with same resources
 */
import type { TriggerCategory } from '../types/triggers';
/**
 * Detection task for parallel processing
 */
export interface DetectionTask {
    id: string;
    category?: TriggerCategory;
    input: ParallelInput;
    priority: TaskPriority;
    timestamp: number;
}
export type TaskPriority = 'high' | 'normal' | 'low';
export interface ParallelInput {
    visual?: ImageData;
    audio?: Float32Array;
    text?: string;
    metadata?: Record<string, any>;
}
/**
 * Detection result from worker
 */
export interface ParallelDetectionResult {
    taskId: string;
    category: TriggerCategory;
    confidence: number;
    processingTimeMs: number;
    workerId: number;
    metadata: Record<string, any>;
}
/**
 * Worker statistics
 */
interface WorkerStats {
    id: number;
    tasksProcessed: number;
    avgProcessingTimeMs: number;
    totalProcessingTimeMs: number;
    idleTimeMs: number;
    errorCount: number;
    status: 'idle' | 'busy' | 'error';
    currentTask: string | null;
}
/**
 * Engine statistics
 */
export interface EngineStats {
    totalTasksProcessed: number;
    tasksPerSecond: number;
    peakTasksPerSecond: number;
    avgLatencyMs: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
    parallelismDegree: number;
    maxParallelism: number;
    workerUtilization: number;
    queuedTasks: number;
    maxQueueSize: number;
    throughputMultiplier: number;
    speedup: number;
}
/**
 * Parallel Detection Engine
 *
 * Uses Web Worker pool for parallel category detection.
 * Implements pipeline parallelism and category-parallel execution.
 */
export declare class ParallelDetectionEngine {
    private workers;
    private workerCount;
    private taskQueue;
    private maxQueueSize;
    private stats;
    private latencySamples;
    private readonly MAX_SAMPLES;
    private tasksInLastSecond;
    private lastSecondTimestamp;
    private startTime;
    private serialProcessingTimeMs;
    private readonly CATEGORIES;
    constructor(workerCount?: number);
    /**
     * Detect all categories in parallel
     */
    detectAllCategories(input: ParallelInput, priority?: TaskPriority): Promise<ParallelDetectionResult[]>;
    /**
     * Detect specific category
     */
    detectCategory(category: TriggerCategory, input: ParallelInput, priority?: TaskPriority): Promise<ParallelDetectionResult[]>;
    /**
     * Detect multiple categories in parallel (category-parallel execution)
     */
    detectCategories(categories: TriggerCategory[], input: ParallelInput, priority?: TaskPriority): Promise<ParallelDetectionResult[]>;
    /**
     * Batch detection (pipeline parallelism)
     */
    detectBatch(inputs: ParallelInput[], priority?: TaskPriority): Promise<ParallelDetectionResult[][]>;
    /**
     * Enqueue task for processing
     */
    private enqueueTask;
    /**
     * Process queued tasks
     */
    private processQueue;
    /**
     * Process task on specific worker
     */
    private processTaskOnWorker;
    /**
     * Simulate detection (fast heuristics for demo)
     * In real implementation, this would call actual detection algorithms
     */
    private simulateDetection;
    /**
     * Score visual input for category
     */
    private scoreVisual;
    /**
     * Score audio input for category
     */
    private scoreAudio;
    /**
     * Score text input for category
     */
    private scoreText;
    /**
     * Update engine statistics
     */
    private updateStats;
    /**
     * Update latency percentiles
     */
    private updatePercentiles;
    /**
     * Start performance monitoring
     */
    private startPerformanceMonitoring;
    /**
     * Generate unique task ID
     */
    private generateTaskId;
    /**
     * Sleep utility
     */
    private sleep;
    /**
     * Get engine statistics
     */
    getStats(): EngineStats;
    /**
     * Get worker statistics
     */
    getWorkerStats(): WorkerStats[];
    /**
     * Get queue status
     */
    getQueueStatus(): {
        size: number;
        maxSize: number;
        utilizationPercent: number;
        oldestTaskAge: number;
    };
    /**
     * Set worker count (scale up/down)
     */
    setWorkerCount(count: number): void;
    /**
     * Clear queue
     */
    clearQueue(): void;
    /**
     * Clear all state
     */
    clear(): void;
    /**
     * Dispose engine
     */
    dispose(): void;
}
export declare const parallelEngine: ParallelDetectionEngine;
export {};
//# sourceMappingURL=ParallelDetectionEngine.d.ts.map