/**
 * Photosensitivity Detector
 *
 * Detects rapid flashing/strobing in video that could trigger
 * photosensitive epilepsy or other conditions.
 *
 * Based on WCAG 2.1 Level A guidelines:
 * - More than 3 flashes per second
 * - Flash area > 25% of screen
 * - Luminance contrast > 20%
 *
 * This is 100% algorithmic and doesn't require ML.
 */
import type { Warning } from '@shared/types/Warning.types';
export declare class PhotosensitivityDetector {
    private video;
    private canvas;
    private ctx;
    private rafId;
    private lastCheckTime;
    private checkInterval;
    private recentFlashes;
    private flashWindow;
    private detectedWarnings;
    private maxFlashesPerSecond;
    private minLuminanceChange;
    private onWarningDetected;
    private previousLuminance;
    constructor();
    /**
     * Initialize detector for a video element
     */
    initialize(video: HTMLVideoElement): void;
    /**
     * Start monitoring video for flashes
     */
    private startMonitoring;
    /**
     * Stop monitoring
     */
    private stopMonitoring;
    /**
     * Analyze current video frame for flashing
     */
    private analyzeFrame;
    /**
     * Calculate relative luminance of an image
     * Based on WCAG formula
     */
    private calculateLuminance;
    /**
     * Register a flash event
     */
    private registerFlash;
    /**
     * Remove flashes older than the window
     */
    private cleanupOldFlashes;
    /**
     * Check if current flash sequence is dangerous
     */
    private checkFlashSequence;
    /**
     * Trigger photosensitivity warning
     */
    private triggerWarning;
    /**
     * Register callback for warnings
     */
    onDetection(callback: (warning: Warning) => void): void;
    /**
     * Get all detected warnings
     */
    getDetectedWarnings(): Warning[];
    /**
     * Clear warnings
     */
    clear(): void;
    /**
     * Dispose
     */
    dispose(): void;
}
//# sourceMappingURL=PhotosensitivityDetector.d.ts.map