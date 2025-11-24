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
import { Logger } from '@shared/utils/logger';
import { PerformanceGovernor } from '../performance/PerformanceGovernor';
// @ts-ignore - Query params for worker import
import VisualAnalyzerWorker from './VisualAnalyzer.worker?worker';
const logger = new Logger('VisualColorAnalyzer');
export class VisualColorAnalyzer {
    video = null;
    rafId = null;
    lastCheckTime = 0;
    checkInterval = 200; // Default check every 200ms
    worker = null;
    performanceGovernor;
    unsubscribeGovernor = null;
    onWarningDetected = null;
    // Statistics (synced from worker)
    stats = {
        totalFramesAnalyzed: 0,
        bloodDetections: 0,
        goreDetections: 0,
        fireDetections: 0,
        vomitDetections: 0,
        medicalDetections: 0,
        underwaterDetections: 0,
        sceneChangeDetections: 0
    };
    constructor() {
        this.performanceGovernor = PerformanceGovernor.getInstance();
        this.initializeWorker();
    }
    initializeWorker() {
        try {
            this.worker = new VisualAnalyzerWorker();
            if (this.worker) {
                this.worker.onmessage = (e) => this.handleWorkerMessage(e);
                this.worker.onerror = (e) => {
                    logger.error('Visual Analyzer Worker error:', e);
                };
            }
        }
        catch (error) {
            logger.error('Failed to initialize Visual Analyzer Worker:', error);
        }
    }
    handleWorkerMessage(e) {
        const { type, payload } = e.data;
        if (type === 'detection') {
            this.handleDetection(payload);
        }
        else if (type === 'stats') {
            // Update local stats if worker sends them
            // this.stats = { ...this.stats, ...payload };
        }
    }
    handleDetection(payload) {
        // Convert payload to Warning type if needed or pass directly
        // The worker sends a payload that matches Warning structure mostly
        const warning = {
            ...payload,
            // Ensure dates are Date objects
            createdAt: new Date(payload.createdAt),
            updatedAt: new Date(payload.updatedAt),
            categoryKey: payload.categoryKey,
            status: payload.status
        };
        // Update stats based on category (simple approximation)
        if (warning.categoryKey === 'blood')
            this.stats.bloodDetections++;
        else if (warning.categoryKey === 'gore')
            this.stats.goreDetections++;
        else if (warning.categoryKey === 'violence' && warning.description && warning.description.includes('Fire'))
            this.stats.fireDetections++;
        // ... update other stats based on category/description if needed for precise tracking
        this.onWarningDetected?.(warning);
    }
    /**
     * Initialize visual analyzer for a video element
     */
    initialize(videoElement) {
        this.video = videoElement;
        logger.info('[TW VisualColorAnalyzer] ✅ Initialized with Web Worker');
        // Subscribe to performance governor
        this.unsubscribeGovernor = this.performanceGovernor.subscribe((tier) => {
            this.checkInterval = this.performanceGovernor.getRecommendedInterval(200);
            logger.debug(`Adjusted check interval to ${this.checkInterval}ms (Tier: ${tier})`);
        });
        this.startMonitoring();
    }
    /**
     * Start monitoring video frames
     */
    startMonitoring() {
        this.lastCheckTime = Date.now();
        const checkLoop = () => {
            const now = Date.now();
            if (now - this.lastCheckTime >= this.checkInterval) {
                this.captureAndSendFrame();
                this.lastCheckTime = now;
            }
            this.rafId = requestAnimationFrame(checkLoop);
        };
        this.rafId = requestAnimationFrame(checkLoop);
        logger.info('[TW VisualColorAnalyzer] 🎨 Visual monitoring started');
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
     * Capture current frame and send to worker
     */
    async captureAndSendFrame() {
        if (!this.video || !this.worker)
            return;
        if (this.video.paused || this.video.ended || this.video.readyState < 2) {
            return;
        }
        try {
            // Create ImageBitmap from video (efficient, async, off-main-thread friendly)
            // We use a smaller resolution for analysis to save performance
            const bitmap = await createImageBitmap(this.video, {
                resizeWidth: 320,
                resizeHeight: 180,
                resizeQuality: 'low'
            });
            this.stats.totalFramesAnalyzed++;
            // Transfer the bitmap to the worker (zero-copy)
            const payload = {
                timestamp: this.video.currentTime,
                bitmap: bitmap
            };
            this.worker.postMessage({
                type: 'analyze_frame',
                payload
            }, [bitmap]);
        }
        catch (error) {
            // Can fail if video is tainted (CORS) or closed
            // logger.debug('[TW VisualColorAnalyzer] Frame capture failed:', error);
        }
    }
    /**
     * Register callback
     */
    onDetection(callback) {
        this.onWarningDetected = callback;
    }
    /**
     * Get statistics
     */
    getStats() {
        return {
            ...this.stats,
            enabled: true
        };
    }
    /**
     * Clear events
     */
    clear() {
        this.worker?.postMessage({ type: 'reset' });
    }
    /**
     * Dispose
     */
    dispose() {
        this.stopMonitoring();
        if (this.unsubscribeGovernor) {
            this.unsubscribeGovernor();
        }
        this.video = null;
        this.worker?.terminate();
        this.worker = null;
        this.onWarningDetected = null;
    }
}
//# sourceMappingURL=VisualColorAnalyzer.js.map