/**
 * VISUAL COLOR ANALYZER
 *
 * Detects trigger warnings from visual color analysis
 * Uses Web Workers and OffscreenCanvas for real-time frame analysis
 * off the main thread.
 *
 * Browser Support: Universal (Canvas API, Web Workers)
 *
 * Created by: Claude Code (Legendary Session)
 * Date: 2024-11-11
 * Refactored for Web Worker: Jules
 */
import type { Warning } from '@shared/types/Warning.types';
export declare class VisualColorAnalyzer {
    private video;
    private rafId;
    private lastCheckTime;
    private checkInterval;
    private worker;
    private performanceGovernor;
    private unsubscribeGovernor;
    private onWarningDetected;
    private stats;
    constructor();
    private initializeWorker;
    private handleWorkerMessage;
    private handleDetection;
    /**
     * Initialize visual analyzer for a video element
     */
    initialize(videoElement: HTMLVideoElement): void;
    /**
     * Start monitoring video frames
     */
    private startMonitoring;
    /**
     * Stop monitoring
     */
    private stopMonitoring;
    /**
     * Capture current frame and send to worker
     */
    private captureAndSendFrame;
    /**
     * Register callback
     */
    onDetection(callback: (warning: Warning) => void): void;
    /**
     * Get statistics
     */
    getStats(): typeof this.stats & {
        enabled: boolean;
    };
    /**
     * Clear events
     */
    clear(): void;
    /**
     * Dispose
     */
    dispose(): void;
}
//# sourceMappingURL=VisualColorAnalyzer.d.ts.map