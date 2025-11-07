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
import { Logger } from '@shared/utils/logger';
const logger = new Logger('PhotosensitivityDetector');
export class PhotosensitivityDetector {
    video = null;
    canvas;
    ctx;
    rafId = null;
    lastCheckTime = 0;
    checkInterval = 100; // Check every 100ms
    // Flash detection state
    recentFlashes = [];
    flashWindow = 1000; // 1 second window
    detectedWarnings = new Map();
    // Thresholds (WCAG 2.1 compliant)
    maxFlashesPerSecond = 3;
    minLuminanceChange = 0.2; // 20% change
    // minFlashArea would be 0.25 (25% of screen) but simplified for now
    // Callback
    onWarningDetected = null;
    // Frame analysis
    previousLuminance = null;
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', {
            willReadFrequently: true,
        });
    }
    /**
     * Initialize detector for a video element
     */
    initialize(video) {
        this.video = video;
        // Set canvas size to match video
        this.canvas.width = 320; // Reduced resolution for performance
        this.canvas.height = 180;
        this.startMonitoring();
        logger.info('[PhotosensitivityDetector] Initialized');
    }
    /**
     * Start monitoring video for flashes
     */
    startMonitoring() {
        if (this.rafId !== null) {
            this.stopMonitoring();
        }
        this.lastCheckTime = Date.now();
        const checkLoop = () => {
            const now = Date.now();
            if (now - this.lastCheckTime >= this.checkInterval) {
                this.analyzeFrame();
                this.lastCheckTime = now;
            }
            this.rafId = requestAnimationFrame(checkLoop);
        };
        this.rafId = requestAnimationFrame(checkLoop);
    }
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }
    /**
     * Analyze current video frame for flashing
     */
    analyzeFrame() {
        if (!this.video || this.video.paused || this.video.ended) {
            return;
        }
        try {
            // Draw current frame to canvas
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            // Get image data
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            // Calculate average luminance
            const luminance = this.calculateLuminance(imageData);
            // Check for flash
            if (this.previousLuminance !== null) {
                const luminanceChange = Math.abs(luminance - this.previousLuminance);
                if (luminanceChange > this.minLuminanceChange) {
                    // Potential flash detected
                    const flashEvent = {
                        timestamp: this.video.currentTime,
                        luminanceChange: luminanceChange,
                        area: 1.0, // Simplified: assume full screen
                    };
                    this.registerFlash(flashEvent);
                }
            }
            this.previousLuminance = luminance;
            // Clean up old flashes
            this.cleanupOldFlashes();
            // Check if we're in a dangerous flash sequence
            this.checkFlashSequence();
        }
        catch (error) {
            // Canvas access can fail due to CORS
            logger.debug('[PhotosensitivityDetector] Frame analysis failed:', error);
        }
    }
    /**
     * Calculate relative luminance of an image
     * Based on WCAG formula
     */
    calculateLuminance(imageData) {
        const data = imageData.data;
        let totalLuminance = 0;
        const pixelCount = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;
            // WCAG relative luminance formula
            const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
            const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
            const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
            const luminance = 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
            totalLuminance += luminance;
        }
        return totalLuminance / pixelCount;
    }
    /**
     * Register a flash event
     */
    registerFlash(flash) {
        this.recentFlashes.push(flash);
        logger.debug(`[PhotosensitivityDetector] Flash at ${flash.timestamp}s, ` +
            `change: ${(flash.luminanceChange * 100).toFixed(1)}%`);
    }
    /**
     * Remove flashes older than the window
     */
    cleanupOldFlashes() {
        if (!this.video)
            return;
        const cutoff = this.video.currentTime - this.flashWindow / 1000;
        this.recentFlashes = this.recentFlashes.filter((flash) => flash.timestamp >= cutoff);
    }
    /**
     * Check if current flash sequence is dangerous
     */
    checkFlashSequence() {
        if (!this.video || this.recentFlashes.length < this.maxFlashesPerSecond) {
            return;
        }
        // Count flashes in the last second
        const now = this.video.currentTime;
        const flashesInWindow = this.recentFlashes.filter((flash) => now - flash.timestamp <= 1.0);
        if (flashesInWindow.length > this.maxFlashesPerSecond) {
            // Dangerous flash sequence detected!
            this.triggerWarning(now);
        }
    }
    /**
     * Trigger photosensitivity warning
     */
    triggerWarning(timestamp) {
        // Round to nearest 5 seconds to avoid duplicate warnings
        const roundedTime = Math.floor(timestamp / 5) * 5;
        if (this.detectedWarnings.has(roundedTime)) {
            return; // Already warned about this segment
        }
        const warning = {
            id: `photosensitivity-${roundedTime}`,
            videoId: 'photosensitivity-detected',
            categoryKey: 'flashing_lights', // Photosensitivity warnings
            startTime: Math.max(0, roundedTime - 3), // 3 second warning
            endTime: roundedTime + 5, // Assume 5 second duration
            submittedBy: 'photosensitivity-detector',
            status: 'approved',
            score: 0,
            confidenceLevel: 95,
            requiresModeration: false,
            description: `Rapid flashing detected (${this.recentFlashes.length} flashes/second). May trigger photosensitive epilepsy.`,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.detectedWarnings.set(roundedTime, warning);
        logger.warn(`[PhotosensitivityDetector] ⚠️ FLASH WARNING at ${roundedTime}s ` +
            `(${this.recentFlashes.length} flashes)`);
        if (this.onWarningDetected) {
            this.onWarningDetected(warning);
        }
    }
    /**
     * Register callback for warnings
     */
    onDetection(callback) {
        this.onWarningDetected = callback;
    }
    /**
     * Get all detected warnings
     */
    getDetectedWarnings() {
        return Array.from(this.detectedWarnings.values());
    }
    /**
     * Clear warnings
     */
    clear() {
        this.detectedWarnings.clear();
        this.recentFlashes = [];
        this.previousLuminance = null;
    }
    /**
     * Dispose
     */
    dispose() {
        this.stopMonitoring();
        this.video = null;
        this.detectedWarnings.clear();
        this.recentFlashes = [];
        this.onWarningDetected = null;
    }
}
//# sourceMappingURL=PhotosensitivityDetector.js.map