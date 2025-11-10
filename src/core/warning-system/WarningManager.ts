/**
 * Warning manager - core logic for warning system
 */

import type { Warning, ActiveWarning, TriggerCategory } from '@shared/types/Warning.types';
import type { Profile, ProtectionType } from '@shared/types/Profile.types';
import type { IStreamingProvider, MediaInfo } from '@shared/types/Provider.types';
import { SupabaseClient } from '../api/SupabaseClient';
import { StorageAdapter } from '../storage/StorageAdapter';
import { ProfileManager } from '../profiles/ProfileManager';
import { CACHE_EXPIRATION_MS, VIDEO_CHECK_INTERVAL_MS } from '@shared/constants/defaults';
import { SubtitleAnalyzer } from '../../content/subtitle-analyzer/SubtitleAnalyzer';
import { PhotosensitivityDetector } from '../../content/photosensitivity-detector/PhotosensitivityDetector';
import { ProtectionOverlayManager } from '../../content/protection/ProtectionOverlayManager';

interface CacheEntry {
  warnings: Warning[];
  timestamp: number;
}

export class WarningManager {
  private provider: IStreamingProvider;
  private profile: Profile;
  private warnings: Warning[] = [];
  private activeWarnings: Set<string> = new Set();
  private ignoredTriggersThisSession: Set<string> = new Set();
  private ignoredCategoriesForVideo: Set<string> = new Set();
  private rafId: number | null = null;
  private lastCheckTime: number = 0;
  private currentVideoId: string | null = null;

  // In-memory cache for faster access
  private static warningCache: Map<string, CacheEntry> = new Map();

  // Real-time detection systems
  private subtitleAnalyzer: SubtitleAnalyzer | null = null;
  private photosensitivityDetector: PhotosensitivityDetector | null = null;
  private enableSubtitleAnalysis: boolean = true; // Can be made configurable
  private enablePhotosensitivityDetection: boolean = true;

  // Protection system
  private protectionManager: ProtectionOverlayManager;

  private onWarningCallback: ((warning: ActiveWarning) => void) | null = null;
  private onWarningEndCallback: ((warningId: string) => void) | null = null;

  constructor(provider: IStreamingProvider) {
    this.provider = provider;
    this.profile = null as any; // Will be initialized in initialize()

    // Initialize protection manager
    this.protectionManager = new ProtectionOverlayManager(provider);

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
  async initialize(): Promise<void> {
    console.log('[TW WarningManager] 🚀 Initializing warning manager...');

    // Load active profile
    this.profile = await ProfileManager.getActive();
    console.log(`[TW WarningManager] ✅ Profile loaded: "${this.profile.name}" with ${this.profile.enabledCategories.length} enabled categories`);
    console.log('[TW WarningManager] Enabled categories:', this.profile.enabledCategories);

    // Get current media
    const media = await this.provider.getCurrentMedia();
    if (!media) {
      console.warn('[TW WarningManager] ❌ No media detected');
      return;
    }

    console.log(`[TW WarningManager] 🎬 Media detected: ${media.id} - "${media.title || 'Unknown'}"`);

    // Fetch warnings for this media
    await this.fetchWarnings(media.id);

    // Initialize real-time detection systems
    this.initializeDetectors();

    // Start monitoring
    this.startMonitoring();
    console.log('[TW WarningManager] ✅ Monitoring started');

    // Listen for media changes
    this.provider.onMediaChange(async (newMedia) => {
      await this.handleMediaChange(newMedia);
    });

    // Listen for profile changes
    StorageAdapter.onChange('activeProfileId', async () => {
      this.profile = await ProfileManager.getActive();
      this.refilterWarnings();
    });

    console.log('[TW WarningManager] ✅ Initialization complete');
  }

  /**
   * Initialize real-time detection systems
   */
  private initializeDetectors(): void {
    console.log('[TW WarningManager] 🔍 Initializing real-time detection systems...');
    const video = this.provider.getVideoElement();
    if (!video) {
      console.warn('[TW WarningManager] ❌ No video element found for detectors');
      return;
    }

    // Initialize subtitle analyzer
    if (this.subtitleAnalyzer) {
      console.log('[TW WarningManager] 📝 Initializing subtitle analyzer...');
      this.subtitleAnalyzer.initialize(video);
      this.subtitleAnalyzer.onDetection((warning) => {
        // Add detected warning to our list
        if (this.profile.enabledCategories.includes(warning.categoryKey as any)) {
          console.log(`[TW WarningManager] 🎯 Subtitle trigger detected and ADDED: ${warning.categoryKey} at ${Math.floor(warning.startTime)}s`);
          console.log('[TW WarningManager] Full warning details:', warning);
          this.warnings.push(warning);
          console.log(`[TW WarningManager] Total warnings now: ${this.warnings.length}`);
        } else {
          console.log(`[TW WarningManager] ⏭️ Subtitle trigger detected but SKIPPED (not in enabled categories): ${warning.categoryKey}`);
        }
      });
    }

    // Initialize photosensitivity detector
    if (this.photosensitivityDetector) {
      console.log('[TW WarningManager] ⚡ Initializing photosensitivity detector...');
      this.photosensitivityDetector.initialize(video);
      this.photosensitivityDetector.onDetection((warning) => {
        // Always show photosensitivity warnings (critical for health)
        console.warn('[TW WarningManager] ⚠️ Photosensitivity warning detected and ADDED:', warning);
        this.warnings.push(warning);
      });
    }

    console.log('[TW WarningManager] ✅ Detection systems initialized');
  }

  /**
   * Fetch warnings for a video
   */
  private async fetchWarnings(videoId: string): Promise<void> {
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
    console.log(`[TW WarningManager] 🌐 Fetching warnings from backend for video: ${videoId}`);
    const allWarnings = await SupabaseClient.getTriggers(videoId);
    console.log(`[TW WarningManager] 📦 Received ${allWarnings.length} total warnings from backend`);

    // Filter by profile
    this.warnings = this.filterWarningsByProfile(allWarnings);
    console.log(`[TW WarningManager] ✅ Filtered to ${this.warnings.length} warnings based on profile`);

    if (this.warnings.length > 0) {
      console.log('[TW WarningManager] Warning categories:', this.warnings.map(w => w.categoryKey));
      console.log('[TW WarningManager] Warning times:', this.warnings.map(w => `${Math.floor(w.startTime)}s-${Math.floor(w.endTime)}s`));
    } else {
      console.log('[TW WarningManager] ℹ️ No warnings match the current profile settings');
    }

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
  }

  /**
   * Filter warnings based on active profile
   */
  private filterWarningsByProfile(warnings: Warning[]): Warning[] {
    return warnings.filter((warning) => {
      // Check if category is enabled in profile
      return this.profile.enabledCategories.includes(warning.categoryKey);
    });
  }

  /**
   * Re-filter warnings when profile changes
   */
  private refilterWarnings(): void {
    if (this.currentVideoId) {
      this.fetchWarnings(this.currentVideoId);
    }
  }

  /**
   * Start monitoring video playback using requestAnimationFrame
   */
  private startMonitoring(): void {
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
  private stopMonitoring(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Check for active warnings at current playback time
   */
  private checkWarnings(): void {
    const video = this.provider.getVideoElement();
    if (!video) return;

    const currentTime = video.currentTime;
    const leadTime = this.profile.leadTime;

    // Log check every 30 seconds for debugging
    if (Math.floor(currentTime) % 30 === 0 && Math.floor(currentTime) !== Math.floor(this.lastCheckTime / 1000)) {
      console.log(`[TW WarningManager] 🔍 Checking warnings at ${Math.floor(currentTime)}s (${this.warnings.length} total warnings, lead time: ${leadTime}s)`);
    }

    for (const warning of this.warnings) {
      // Skip ignored warnings
      if (this.ignoredTriggersThisSession.has(warning.id)) continue;
      if (this.ignoredCategoriesForVideo.has(warning.categoryKey)) continue;

      const timeUntilStart = warning.startTime - currentTime;
      const isActive = currentTime >= warning.startTime && currentTime < warning.endTime;
      const isUpcoming = timeUntilStart > 0 && timeUntilStart <= leadTime;

      if (isActive && !this.activeWarnings.has(warning.id)) {
        // Warning just became active
        console.log(`[TW WarningManager] 🚨 WARNING ACTIVE: ${warning.categoryKey} at ${Math.floor(currentTime)}s (${warning.startTime}-${warning.endTime})`);
        this.activeWarnings.add(warning.id);
        this.triggerWarning(warning, 0, true);
        this.applyWarningAction(warning, true);
      } else if (isUpcoming && !this.activeWarnings.has(warning.id)) {
        // Upcoming warning
        console.log(`[TW WarningManager] ⏰ UPCOMING WARNING: ${warning.categoryKey} in ${Math.floor(timeUntilStart)}s`);
        this.triggerWarning(warning, timeUntilStart, false);
      } else if (!isActive && this.activeWarnings.has(warning.id)) {
        // Warning ended
        console.log(`[TW WarningManager] ✅ WARNING ENDED: ${warning.categoryKey}`);
        this.activeWarnings.delete(warning.id);
        this.triggerWarningEnd(warning.id);
        this.applyWarningAction(warning, false);
      }
    }
  }

  /**
   * Trigger warning callback
   */
  private triggerWarning(warning: Warning, timeUntilStart: number, isActive: boolean): void {
    if (!this.onWarningCallback) {
      console.warn('[TW WarningManager] ⚠️ Warning callback not registered! Cannot display warning.');
      return;
    }

    const action = this.profile.categoryActions[warning.categoryKey] || 'warn';

    const activeWarning: ActiveWarning = {
      ...warning,
      timeUntilStart,
      isActive,
      action,
    };

    console.log(`[TW WarningManager] 📤 Sending warning to BannerManager: ${warning.categoryKey} (${isActive ? 'ACTIVE' : 'UPCOMING'})`);
    this.onWarningCallback(activeWarning);
  }

  /**
   * Trigger warning end callback
   */
  private triggerWarningEnd(warningId: string): void {
    if (!this.onWarningEndCallback) return;
    this.onWarningEndCallback(warningId);
  }

  /**
   * Apply warning protection (blackout/mute)
   */
  private applyWarningAction(warning: Warning, apply: boolean): void {
    // Get protection type for this warning
    const protectionType = this.getProtectionType(warning.categoryKey);

    if (apply) {
      // Apply protection
      this.protectionManager.applyProtection(
        warning.id,
        protectionType,
        warning.categoryKey,
        warning.description || ''
      );
    } else {
      // Remove protection
      this.protectionManager.removeProtection(warning.id);
    }
  }

  /**
   * Get protection type for a category
   * Checks per-category override first, then falls back to default
   */
  private getProtectionType(categoryKey: TriggerCategory): ProtectionType {
    // Check for per-category override
    if (this.profile.categoryProtections && categoryKey in this.profile.categoryProtections) {
      const override = this.profile.categoryProtections[categoryKey];
      if (override) {
        return override;
      }
    }

    // Fall back to default protection
    return this.profile.defaultProtection || 'none';
  }

  /**
   * Handle media change
   */
  private async handleMediaChange(media: MediaInfo): Promise<void> {
    console.log('[TW WarningManager] Media changed:', media);

    // Clear state
    this.activeWarnings.clear();
    this.ignoredTriggersThisSession.clear();
    this.ignoredCategoriesForVideo.clear();

    // Clear all active protections
    this.protectionManager.removeAllProtections();

    // Fetch new warnings
    await this.fetchWarnings(media.id);
  }

  /**
   * Ignore a trigger for this session
   */
  ignoreThisTime(warningId: string): void {
    this.ignoredTriggersThisSession.add(warningId);
    if (this.activeWarnings.has(warningId)) {
      this.activeWarnings.delete(warningId);
      this.triggerWarningEnd(warningId);
      // Remove protection
      this.protectionManager.removeProtection(warningId);
    }
  }

  /**
   * Ignore a category for this video
   */
  ignoreForVideo(categoryKey: string): void {
    this.ignoredCategoriesForVideo.add(categoryKey);

    // Remove all active warnings with this category
    for (const warning of this.warnings) {
      if (warning.categoryKey === categoryKey && this.activeWarnings.has(warning.id)) {
        this.activeWarnings.delete(warning.id);
        this.triggerWarningEnd(warning.id);
        // Remove protection
        this.protectionManager.removeProtection(warning.id);
      }
    }
  }

  /**
   * Register callback for warnings
   */
  onWarning(callback: (warning: ActiveWarning) => void): void {
    this.onWarningCallback = callback;
  }

  /**
   * Register callback for warning end
   */
  onWarningEnd(callback: (warningId: string) => void): void {
    this.onWarningEndCallback = callback;
  }

  /**
   * Clean up
   */
  dispose(): void {
    this.stopMonitoring();

    // Dispose protection manager
    if (this.protectionManager) {
      this.protectionManager.dispose();
    }

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
