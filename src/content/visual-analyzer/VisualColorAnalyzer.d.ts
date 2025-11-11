/**
 * VISUAL COLOR ANALYZER
 *
 * Detects trigger warnings from visual color analysis
 * Uses Canvas API for real-time frame analysis
 *
 * Detects:
 * - Blood (bright red channel spike, R > 200, R > G+B)
 * - Gore (red + dark shadows + irregular patterns)
 * - Fire (orange/yellow saturation + brightness)
 * - Medical scenes (sterile white + blue-green medical tones)
 * - Underwater scenes (blue-green tint + low saturation)
 * - Dark/night scenes (low luminance sustained)
 * - Scene changes (rapid cuts, transitions)
 *
 * Browser Support: Universal (Canvas API)
 *
 * Created by: Claude Code (Legendary Session)
 * Date: 2024-11-11
 */
import type { Warning } from '@shared/types/Warning.types';
export declare class VisualColorAnalyzer {
    private canvas;
    private ctx;
    private video;
    private rafId;
    private lastCheckTime;
    private checkInterval;
    private previousFrame;
    private sceneChangeCount;
    private sceneChangeWindow;
    private detectedEvents;
    private onWarningDetected;
    private stats;
    constructor();
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
     * Analyze current video frame
     */
    private analyzeFrame;
    /**
     * Analyze color composition of frame
     */
    private analyzeColors;
    /**
     * Calculate irregularity (edge density) using simplified Sobel-like approach
     * High irregularity = gore, violence
     * Low irregularity = smooth surfaces
     */
    private calculateIrregularity;
    /**
     * Calculate chunkiness (texture irregularity) - useful for vomit, gore detection
     * Looks for inconsistent color patches (chunky appearance)
     */
    private calculateChunkiness;
    /**
     * Detect blood (bright red pixels > 15% of frame)
     */
    private detectBlood;
    /**
     * Detect gore (blood + shadows + high irregularity)
     */
    private detectGore;
    /**
     * Detect fire (orange/yellow > 20% + high brightness)
     */
    private detectFire;
    /**
     * Detect vomit (yellowBrown OR greenishYellow > 12% + chunkiness)
     *
     * EQUAL TREATMENT: Vomit detection with same rigor as blood detection
     * ADDRESSES CONCERN: "I'm not sensitive to blood, but to vomit!!"
     *
     * Vomit characteristics:
     * - Yellowish-brown or greenish-yellow colors (12%+ of frame)
     * - Chunky, irregular texture (high chunkiness score)
     * - Often combined with liquid pooling
     */
    private detectVomit;
    /**
     * Detect medical scenes (sterile white + medical blue-green)
     */
    private detectMedical;
    /**
     * Detect underwater scenes (blue-green > 40% + low saturation)
     */
    private detectUnderwater;
    /**
     * Detect scene changes (rapid cuts)
     */
    private detectSceneChange;
    /**
     * Calculate frame difference (0-1)
     */
    private calculateFrameDifference;
    /**
     * Create warning from visual detection
     */
    private createWarning;
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