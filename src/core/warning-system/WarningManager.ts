/**
 * Warning manager - core logic for warning system
 */

import type { Warning, ActiveWarning } from '@shared/types/Warning.types';
import type { Profile } from '@shared/types/Profile.types';
import type { IStreamingProvider, MediaInfo } from '@shared/types/Provider.types';
import { SupabaseClient } from '../api/SupabaseClient';
import { StorageAdapter } from '../storage/StorageAdapter';
import { ProfileManager } from '../profiles/ProfileManager';
import { CACHE_EXPIRATION_MS, VIDEO_CHECK_INTERVAL_MS } from '@shared/constants/defaults';

export class WarningManager {
  private provider: IStreamingProvider;
  private profile: Profile;
  private warnings: Warning[] = [];
  private activeWarnings: Set<string> = new Set();
  private ignoredTriggersThisSession: Set<string> = new Set();
  private ignoredCategoriesForVideo: Set<string> = new Set();
  private checkInterval: number | null = null;
  private currentVideoId: string | null = null;

  private onWarningCallback: ((warning: ActiveWarning) => void) | null = null;
  private onWarningEndCallback: ((warningId: string) => void) | null = null;

  constructor(provider: IStreamingProvider) {
    this.provider = provider;
    this.profile = null as any; // Will be initialized in initialize()
  }

  /**
   * Initialize the warning manager
   */
  async initialize(): Promise<void> {
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
   * Fetch warnings for a video
   */
  private async fetchWarnings(videoId: string): Promise<void> {
    this.currentVideoId = videoId;

    // Check cache first
    const cache = await StorageAdapter.get('warningsCache');
    const cacheExpiration = await StorageAdapter.get('cacheExpiration');

    if (cache && cache[videoId] && cacheExpiration && cacheExpiration[videoId]) {
      const expirationTime = cacheExpiration[videoId];
      if (Date.now() < expirationTime) {
        console.log('[TW WarningManager] Using cached warnings');
        this.warnings = cache[videoId];
        return;
      }
    }

    // Fetch from backend
    console.log('[TW WarningManager] Fetching warnings from backend');
    const allWarnings = await SupabaseClient.getTriggers(videoId);

    // Filter by profile
    this.warnings = this.filterWarningsByProfile(allWarnings);

    // Update cache
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
   * Start monitoring video playback
   */
  private startMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = window.setInterval(() => {
      this.checkWarnings();
    }, VIDEO_CHECK_INTERVAL_MS);
  }

  /**
   * Check for active warnings at current playback time
   */
  private checkWarnings(): void {
    const video = this.provider.getVideoElement();
    if (!video) return;

    const currentTime = video.currentTime;
    const leadTime = this.profile.leadTime;

    for (const warning of this.warnings) {
      // Skip ignored warnings
      if (this.ignoredTriggersThisSession.has(warning.id)) continue;
      if (this.ignoredCategoriesForVideo.has(warning.categoryKey)) continue;

      const timeUntilStart = warning.startTime - currentTime;
      const isActive = currentTime >= warning.startTime && currentTime < warning.endTime;
      const isUpcoming = timeUntilStart > 0 && timeUntilStart <= leadTime;

      if (isActive && !this.activeWarnings.has(warning.id)) {
        // Warning just became active
        this.activeWarnings.add(warning.id);
        this.triggerWarning(warning, 0, true);
        this.applyWarningAction(warning, true);
      } else if (isUpcoming && !this.activeWarnings.has(warning.id)) {
        // Upcoming warning
        this.triggerWarning(warning, timeUntilStart, false);
      } else if (!isActive && this.activeWarnings.has(warning.id)) {
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
  private triggerWarning(warning: Warning, timeUntilStart: number, isActive: boolean): void {
    if (!this.onWarningCallback) return;

    const action = this.profile.categoryActions[warning.categoryKey] || 'warn';

    const activeWarning: ActiveWarning = {
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
  private triggerWarningEnd(warningId: string): void {
    if (!this.onWarningEndCallback) return;
    this.onWarningEndCallback(warningId);
  }

  /**
   * Apply warning action (mute/hide video)
   */
  private applyWarningAction(warning: Warning, apply: boolean): void {
    const video = this.provider.getVideoElement();
    if (!video) return;

    const action = this.profile.categoryActions[warning.categoryKey] || 'warn';

    if (apply) {
      if (action === 'mute' || action === 'mute-and-hide') {
        video.muted = true;
      }
      if (action === 'hide' || action === 'mute-and-hide') {
        video.style.opacity = '0';
      }
    } else {
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
  private async handleMediaChange(media: MediaInfo): Promise<void> {
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
  ignoreThisTime(warningId: string): void {
    this.ignoredTriggersThisSession.add(warningId);
    if (this.activeWarnings.has(warningId)) {
      this.activeWarnings.delete(warningId);
      this.triggerWarningEnd(warningId);
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
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.activeWarnings.clear();
    this.warnings = [];
    this.onWarningCallback = null;
    this.onWarningEndCallback = null;
  }
}
