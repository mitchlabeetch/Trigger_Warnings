/**
 * Warning manager - core logic for warning system
 */
import { SupabaseClient } from '../api/SupabaseClient';
import { StorageAdapter } from '../storage/StorageAdapter';
import { ProfileManager } from '../profiles/ProfileManager';
import { CACHE_EXPIRATION_MS, VIDEO_CHECK_INTERVAL_MS } from '@shared/constants/defaults';
import { SubtitleAnalyzer } from '../../content/subtitle-analyzer/SubtitleAnalyzer';
import { PhotosensitivityDetector } from '../../content/photosensitivity-detector/PhotosensitivityDetector';
export class WarningManager {
    provider;
    profile;
    warnings = [];
    activeWarnings = new Set();
    ignoredTriggersThisSession = new Set();
    ignoredCategoriesForVideo = new Set();
    rafId = null;
    lastCheckTime = 0;
    currentVideoId = null;
    // In-memory cache for faster access
    static warningCache = new Map();
    // Real-time detection systems
    subtitleAnalyzer = null;
    photosensitivityDetector = null;
    enableSubtitleAnalysis = true; // Can be made configurable
    enablePhotosensitivityDetection = true;
    onWarningCallback = null;
    onWarningEndCallback = null;
    constructor(provider) {
        this.provider = provider;
        this.profile = null; // Will be initialized in initialize()
        // Initialize analyzers
        if (this.enableSubtitleAnalysis) {
            this.subtitleAnalyzer = new SubtitleAnalyzer();
        }
        if (this.enablePhotosensitivityDetection) {
            this.photosensitivityDetector = new PhotosensitivityDetector();
        }
    }
    /**
     * Initialize the warning manager
     */
    async initialize() {
        // Load active profile
        this.profile = await ProfileManager.getActive();
        // Get current media
        const media = await this.provider.getCurrentMedia();
        if (!media) {
            console.warn('[TW WarningManager] No media detected');
            return;
        }
        // Fetch warnings for this media
        await this.fetchWarnings(media.id);
        // Initialize real-time detection systems
        this.initializeDetectors();
        // Start monitoring
        this.startMonitoring();
        // Listen for media changes
        this.provider.onMediaChange(async (newMedia) => {
            await this.handleMediaChange(newMedia);
        });
        // Listen for profile changes
        StorageAdapter.onChange('activeProfileId', async () => {
            this.profile = await ProfileManager.getActive();
            this.refilterWarnings();
        });
    }
    /**
     * Initialize real-time detection systems
     */
    initializeDetectors() {
        const video = this.provider.getVideoElement();
        if (!video)
            return;
        // Initialize subtitle analyzer
        if (this.subtitleAnalyzer) {
            this.subtitleAnalyzer.initialize(video);
            this.subtitleAnalyzer.onDetection((warning) => {
                // Add detected warning to our list
                if (this.profile.enabledCategories.includes(warning.categoryKey)) {
                    console.log('[TW WarningManager] Subtitle detected trigger:', warning);
                    this.warnings.push(warning);
                }
            });
        }
        // Initialize photosensitivity detector
        if (this.photosensitivityDetector) {
            this.photosensitivityDetector.initialize(video);
            this.photosensitivityDetector.onDetection((warning) => {
                // Always show photosensitivity warnings (critical for health)
                console.warn('[TW WarningManager] ⚠️ Photosensitivity warning:', warning);
                this.warnings.push(warning);
            });
        }
    }
    /**
     * Fetch warnings for a video
     */
    async fetchWarnings(videoId) {
        this.currentVideoId = videoId;
        // Check in-memory cache first (fastest)
        const memoryCache = WarningManager.warningCache.get(videoId);
        if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_EXPIRATION_MS) {
            console.log('[TW WarningManager] Using in-memory cached warnings');
            this.warnings = this.filterWarningsByProfile(memoryCache.warnings);
            return;
        }
        // Check chrome.storage cache (slower, but persists)
        const cache = await StorageAdapter.get('warningsCache');
        const cacheExpiration = await StorageAdapter.get('cacheExpiration');
        if (cache && cache[videoId] && cacheExpiration && cacheExpiration[videoId]) {
            const expirationTime = cacheExpiration[videoId];
            if (Date.now() < expirationTime) {
                console.log('[TW WarningManager] Using storage cached warnings');
                const allWarnings = cache[videoId];
                // Update in-memory cache
                WarningManager.warningCache.set(videoId, {
                    warnings: allWarnings,
                    timestamp: Date.now(),
                });
                this.warnings = this.filterWarningsByProfile(allWarnings);
                return;
            }
        }
        // Fetch from backend
        console.log('[TW WarningManager] Fetching warnings from backend');
        const allWarnings = await SupabaseClient.getTriggers(videoId);
        // Filter by profile
        this.warnings = this.filterWarningsByProfile(allWarnings);
        // Update both caches
        WarningManager.warningCache.set(videoId, {
            warnings: allWarnings,
            timestamp: Date.now(),
        });
        const newCache = cache || {};
        newCache[videoId] = allWarnings;
        await StorageAdapter.set('warningsCache', newCache);
        const newExpiration = cacheExpiration || {};
        newExpiration[videoId] = Date.now() + CACHE_EXPIRATION_MS;
        await StorageAdapter.set('cacheExpiration', newExpiration);
        console.log(`[TW WarningManager] Loaded ${this.warnings.length} warnings`);
    }
    /**
     * Filter warnings based on active profile
     */
    filterWarningsByProfile(warnings) {
        return warnings.filter((warning) => {
            // Check if category is enabled in profile
            return this.profile.enabledCategories.includes(warning.categoryKey);
        });
    }
    /**
     * Re-filter warnings when profile changes
     */
    refilterWarnings() {
        if (this.currentVideoId) {
            this.fetchWarnings(this.currentVideoId);
        }
    }
    /**
     * Start monitoring video playback using requestAnimationFrame
     */
    startMonitoring() {
        if (this.rafId !== null) {
            this.stopMonitoring();
        }
        this.lastCheckTime = Date.now();
        const checkLoop = () => {
            const now = Date.now();
            // Only check every VIDEO_CHECK_INTERVAL_MS to avoid excessive calls
            if (now - this.lastCheckTime >= VIDEO_CHECK_INTERVAL_MS) {
                this.checkWarnings();
                this.lastCheckTime = now;
            }
            // Continue loop
            this.rafId = requestAnimationFrame(checkLoop);
        };
        this.rafId = requestAnimationFrame(checkLoop);
    }
    /**
     * Stop monitoring video playback
     */
    stopMonitoring() {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }
    /**
     * Check for active warnings at current playback time
     */
    checkWarnings() {
        const video = this.provider.getVideoElement();
        if (!video)
            return;
        const currentTime = video.currentTime;
        const leadTime = this.profile.leadTime;
        for (const warning of this.warnings) {
            // Skip ignored warnings
            if (this.ignoredTriggersThisSession.has(warning.id))
                continue;
            if (this.ignoredCategoriesForVideo.has(warning.categoryKey))
                continue;
            const timeUntilStart = warning.startTime - currentTime;
            const isActive = currentTime >= warning.startTime && currentTime < warning.endTime;
            const isUpcoming = timeUntilStart > 0 && timeUntilStart <= leadTime;
            if (isActive && !this.activeWarnings.has(warning.id)) {
                // Warning just became active
                this.activeWarnings.add(warning.id);
                this.triggerWarning(warning, 0, true);
                this.applyWarningAction(warning, true);
            }
            else if (isUpcoming && !this.activeWarnings.has(warning.id)) {
                // Upcoming warning
                this.triggerWarning(warning, timeUntilStart, false);
            }
            else if (!isActive && this.activeWarnings.has(warning.id)) {
                // Warning ended
                this.activeWarnings.delete(warning.id);
                this.triggerWarningEnd(warning.id);
                this.applyWarningAction(warning, false);
            }
        }
    }
    /**
     * Trigger warning callback
     */
    triggerWarning(warning, timeUntilStart, isActive) {
        if (!this.onWarningCallback)
            return;
        const action = this.profile.categoryActions[warning.categoryKey] || 'warn';
        const activeWarning = {
            ...warning,
            timeUntilStart,
            isActive,
            action,
        };
        this.onWarningCallback(activeWarning);
    }
    /**
     * Trigger warning end callback
     */
    triggerWarningEnd(warningId) {
        if (!this.onWarningEndCallback)
            return;
        this.onWarningEndCallback(warningId);
    }
    /**
     * Apply warning action (mute/hide video)
     */
    applyWarningAction(warning, apply) {
        const video = this.provider.getVideoElement();
        if (!video)
            return;
        const action = this.profile.categoryActions[warning.categoryKey] || 'warn';
        if (apply) {
            if (action === 'mute' || action === 'mute-and-hide') {
                video.muted = true;
            }
            if (action === 'hide' || action === 'mute-and-hide') {
                video.style.opacity = '0';
            }
        }
        else {
            // Restore video state
            if (action === 'mute' || action === 'mute-and-hide') {
                video.muted = false;
            }
            if (action === 'hide' || action === 'mute-and-hide') {
                video.style.opacity = '1';
            }
        }
    }
    /**
     * Handle media change
     */
    async handleMediaChange(media) {
        console.log('[TW WarningManager] Media changed:', media);
        // Clear state
        this.activeWarnings.clear();
        this.ignoredTriggersThisSession.clear();
        this.ignoredCategoriesForVideo.clear();
        // Fetch new warnings
        await this.fetchWarnings(media.id);
    }
    /**
     * Ignore a trigger for this session
     */
    ignoreThisTime(warningId) {
        this.ignoredTriggersThisSession.add(warningId);
        if (this.activeWarnings.has(warningId)) {
            this.activeWarnings.delete(warningId);
            this.triggerWarningEnd(warningId);
        }
    }
    /**
     * Ignore a category for this video
     */
    ignoreForVideo(categoryKey) {
        this.ignoredCategoriesForVideo.add(categoryKey);
        // Remove all active warnings with this category
        for (const warning of this.warnings) {
            if (warning.categoryKey === categoryKey && this.activeWarnings.has(warning.id)) {
                this.activeWarnings.delete(warning.id);
                this.triggerWarningEnd(warning.id);
            }
        }
    }
    /**
     * Register callback for warnings
     */
    onWarning(callback) {
        this.onWarningCallback = callback;
    }
    /**
     * Register callback for warning end
     */
    onWarningEnd(callback) {
        this.onWarningEndCallback = callback;
    }
    /**
     * Clean up
     */
    dispose() {
        this.stopMonitoring();
        // Dispose detectors
        if (this.subtitleAnalyzer) {
            this.subtitleAnalyzer.dispose();
        }
        if (this.photosensitivityDetector) {
            this.photosensitivityDetector.dispose();
        }
        this.activeWarnings.clear();
        this.warnings = [];
        this.onWarningCallback = null;
        this.onWarningEndCallback = null;
    }
}
//# sourceMappingURL=WarningManager.js.map