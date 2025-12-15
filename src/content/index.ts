/**
 * Content script - main entry point
 * Runs on streaming platform pages to detect video and show warnings
 *
 * NEW DATABASE-DRIVEN WORKFLOW:
 * 1. Detect video and provider
 * 2. Pause video immediately
 * 3. Show pre-watch safety screen with trigger info
 * 4. After 10s or skip, show watching overlay
 * 5. Monitor playback for timestamp-based warnings
 */
// Content script entry point - logging happens after imports

import browser from 'webextension-polyfill';
import { ProviderFactory } from './providers/ProviderFactory';
import { WarningManager } from '@core/warning-system/WarningManager';
import { BannerManager } from './banner/BannerManager';
// ActiveIndicatorManager has been merged into WatchingOverlay
import { PreWatchManager } from './prewatch/PreWatchManager';
import { WatchingOverlayManager } from './watching/WatchingOverlayManager';
import { triggerDatabaseService } from '@database/services/TriggerDatabaseService';
import type { IStreamingProvider, MediaInfo } from '@shared/types/Provider.types';
import type { ActiveWarning, StreamingPlatform } from '@shared/types/Warning.types';
import type { MediaTriggerData } from '@shared/types/MediaContent.types';
import { createLogger } from '@shared/utils/logger';

const logger = createLogger('Content');

/**
 * Map provider names to StreamingPlatform type
 */
function getStreamingPlatform(providerName: string): StreamingPlatform {
  const mapping: Record<string, StreamingPlatform> = {
    Netflix: 'netflix',
    'Prime Video': 'prime_video',
    'Disney+': 'disney_plus',
    Hulu: 'hulu',
    Max: 'max',
    Peacock: 'peacock',
    YouTube: 'youtube',
  };
  return mapping[providerName] || 'netflix';
}

class TriggerWarningsContent {
  private provider: IStreamingProvider | null = null;
  private warningManager: WarningManager | null = null;
  private bannerManager: BannerManager | null = null;
  // indicatorManager removed - merged into WatchingOverlay
  private preWatchManager: PreWatchManager | null = null;
  private watchingOverlayManager: WatchingOverlayManager | null = null;
  private initialized = false;
  // Bug 3 Fix: Add explicit disposed flag to prevent race conditions
  private isDisposed = false;
  private activeWarningsMap: Map<string, ActiveWarning> = new Map();
  private currentMediaInfo: MediaInfo | null = null;
  private triggerData: MediaTriggerData | null = null;
  private monitoringIntervalId: ReturnType<typeof setInterval> | null = null;
  private useNewWorkflow = true; // Feature flag for new database-driven workflow

  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.debug('Already initialized, skipping');
      return;
    }

    // Bug 3 Fix: check if disposed
    if (this.isDisposed) {
      logger.warn('Attempted to initialize disposed instance');
      return;
    }

    logger.info('Starting initialization...');
    logger.info('Initializing content script with database-driven workflow...');

    try {
      // Check if this site is supported
      logger.debug('Checking if site is supported...');
      if (!ProviderFactory.isSupported()) {
        logger.warn('Site not supported:', window.location.hostname);
        return;
      }
      logger.debug('Site is supported');

      // Create provider for current site
      logger.debug('Creating provider...');
      this.provider = await ProviderFactory.createProvider();
      if (!this.provider) {
        logger.error('Failed to create provider');
        return;
      }

      // Bug 3 Fix: Double check disposed after await
      if (this.isDisposed) return;

      logger.info(`Provider initialized: ${this.provider.name}`);

      // Initialize database service
      await triggerDatabaseService.initialize();

      if (this.isDisposed) return;

      // Check if we should use the new workflow or fallback to legacy
      if (this.useNewWorkflow) {
        await this.initializeNewWorkflow();
      } else {
        await this.initializeLegacyWorkflow();
      }
    } catch (error) {
      logger.error('Initialization failed:', error);
      if (error instanceof Error) {
        logger.error('Error details:', { message: error.message, stack: error.stack });
      }
      // Fallback to legacy workflow on error
      if (!this.isDisposed) {
        await this.initializeLegacyWorkflow();
      }
    }
  }

  /**
   * NEW DATABASE-DRIVEN WORKFLOW
   * 1. Get video ID from provider
   * 2. Pause video
   * 3. Show pre-watch safety screen
   * 4. On complete, show watching overlay and start monitoring
   */
  private async initializeNewWorkflow(): Promise<void> {
    if (!this.provider || this.isDisposed) return;

    logger.info('Initializing new database-driven workflow...');

    // Initialize pre-watch manager
    this.preWatchManager = new PreWatchManager(this.provider);
    await this.preWatchManager.initialize();

    // Get current media info
    this.currentMediaInfo = await this.provider.getCurrentMedia();

    if (!this.currentMediaInfo) {
      logger.warn('No media info available, using legacy workflow');
      await this.initializeLegacyWorkflow();
      return;
    }

    logger.info('Current media:', this.currentMediaInfo);

    // Get platform and video ID
    const platform = getStreamingPlatform(this.provider.name);
    const videoId = this.currentMediaInfo.id;

    // Show pre-watch safety screen
    await this.preWatchManager.show(platform, videoId, {
      onComplete: () => this.onPreWatchComplete(),
      onSkip: () => this.onPreWatchComplete(),
      onError: (error) => {
        logger.error('Pre-watch error:', error);
        this.onPreWatchComplete();
      },
    });

    this.initialized = true;
    logger.info('New workflow initialized - pre-watch screen showing');
  }

  /**
   * Called when pre-watch screen completes (countdown or skip)
   */
  private async onPreWatchComplete(): Promise<void> {
    if (this.isDisposed) return;
    logger.info('Pre-watch completed, starting watching mode...');

    if (!this.provider) return;

    // Get trigger data from pre-watch manager
    this.triggerData = this.preWatchManager?.getTriggerData() || null;

    // Initialize watching overlay
    this.watchingOverlayManager = new WatchingOverlayManager(this.provider);

    if (this.triggerData) {
      await this.watchingOverlayManager.initialize(this.triggerData);
    }

    if (this.isDisposed) return;

    // Set up watching overlay callbacks
    this.watchingOverlayManager.setCallbacks({
      onIgnoreThisTime: (warningId) => {
        logger.info('Ignore this time:', warningId);
      },
      onIgnoreForVideo: (category) => {
        logger.info('Ignore for video:', category);
      },
      onSkipToEnd: (warning) => {
        logger.info('Skip to end:', warning.id);
      },
      onAddTrigger: () => {
        // Legacy support: quick add context storage
        // The UI is now handled within WatchingOverlayManager directly
        this.handleQuickAddTrigger();
      },
    });

    // Start monitoring playback for timestamp-based warnings
    this.startPlaybackMonitoring();

    // Also initialize legacy banner manager as fallback
    await this.initializeLegacyBanner();

    logger.info('Watching mode active');
  }

  /**
   * Start monitoring video playback for upcoming warnings
   */
  private startPlaybackMonitoring(): void {
    if (this.monitoringIntervalId) {
      clearInterval(this.monitoringIntervalId);
    }

    // Check every 250ms for upcoming warnings
    this.monitoringIntervalId = setInterval(() => {
      if (this.isDisposed) {
        this.stopPlaybackMonitoring();
        return;
      }
      if (!this.provider || !this.watchingOverlayManager) return;

      const video = this.provider.getVideoElement();
      if (video && !video.paused) {
        this.watchingOverlayManager.checkWarnings(video.currentTime);
      }
    }, 250);

    logger.debug('Playback monitoring started');
  }

  /**
   * Stop monitoring video playback
   */
  private stopPlaybackMonitoring(): void {
    if (this.monitoringIntervalId) {
      clearInterval(this.monitoringIntervalId);
      this.monitoringIntervalId = null;
    }
  }

  /**
   * LEGACY WORKFLOW (backward compatible)
   * Uses the existing WarningManager and BannerManager
   */
  private async initializeLegacyWorkflow(): Promise<void> {
    if (!this.provider || this.isDisposed) return;

    logger.info('Using legacy workflow...');

    try {
      // Initialize warning manager
      this.warningManager = new WarningManager(this.provider);
      await this.warningManager.initialize();

      // Initialize banner and indicator
      await this.initializeLegacyBanner();

      // Connect warning manager to banner manager and indicator
      this.warningManager.onWarning((warning: ActiveWarning) => {
        if (this.isDisposed) return;
        this.bannerManager?.showWarning(warning);

        // Update active warnings for indicator
        this.activeWarningsMap.set(warning.id, warning);
        this.updateIndicatorWarnings();
      });

      this.warningManager.onWarningEnd((warningId: string) => {
        if (this.isDisposed) return;
        this.bannerManager?.hideWarning(warningId);

        // Update active warnings for indicator
        this.activeWarningsMap.delete(warningId);
        this.updateIndicatorWarnings();
      });

      // Set up banner callbacks
      this.bannerManager?.onIgnoreThisTime((warningId: string) => {
        this.warningManager?.ignoreThisTime(warningId);
      });

      this.bannerManager?.onIgnoreForVideo((categoryKey: string) => {
        this.warningManager?.ignoreForVideo(categoryKey);
      });

      this.bannerManager?.onVote(async (warningId: string, voteType: 'up' | 'down') => {
        try {
          // 1. Send to background (optional, for remote sync)
          const response = await browser.runtime.sendMessage({
            type: 'VOTE_WARNING',
            triggerId: warningId,
            voteType,
          });

          // 2. Record Locally (LocalConsensusEngine) - Feature 2
          const warning = this.activeWarningsMap.get(warningId);
          if (warning) {
            const { LocalConsensusEngine } = await import('./consensus/LocalConsensusEngine');
            const engine = LocalConsensusEngine.getInstance();

            // Map 'up'/'down' to 'confirm'/'wrong'
            const localVote = voteType === 'up' ? 'confirm' : 'wrong';

            await engine.recordVote(
              warning.videoId,
              warning.categoryKey,
              warning.startTime,
              localVote
            );
            logger.info(`Local vote recorded: ${localVote} for ${warning.categoryKey}`);
          }

          if (response && response.success) {
            logger.info(`Remote Vote ${voteType} recorded for warning ${warningId}`);
          }
        } catch (error) {
          logger.error('Failed to vote:', error);
        }
      });

      // Note: Quick add is now handled via WatchingOverlay
      // No separate indicator callback needed

      this.initialized = true;
      logger.info('Legacy workflow initialized successfully');
    } catch (error) {
      logger.error('Legacy workflow initialization failed:', error);
      if (error instanceof Error) {
        logger.error('Error details:', { message: error.message, stack: error.stack });
      }
    }
  }

  /**
   * Initialize legacy banner and indicator managers
   * Used by both new and legacy workflows
   */
  private async initializeLegacyBanner(): Promise<void> {
    if (!this.provider || this.isDisposed) return;

    // Initialize banner manager
    this.bannerManager = new BannerManager(this.provider);
    await this.bannerManager.initialize();

    // Note: ActiveIndicatorManager has been merged into WatchingOverlay
    // No separate indicator initialization needed

    logger.debug('Legacy banner initialized');
  }

  /**
   * Update indicator with current active warnings
   */
  private updateIndicatorWarnings(): void {
    // Note: This functionality is now handled by WatchingOverlay
    // Active warnings are managed through the watching overlay manager
    const warnings = Array.from(this.activeWarningsMap.values());
    // Warnings can be passed to watchingOverlayManager if needed
    logger.debug('Active warnings updated:', warnings.length);
  }

  /**
   * Handle quick add trigger button click
   * Gets current timestamp and sends message to background to open trigger submission
   */
  async handleQuickAddTrigger(): Promise<void> {
    // This is maintained for legacy support (context storage for popup)
    // The main UI is now handled by WatchingOverlayManager directly

    logger.info('Quick add trigger requested (legacy flow)');

    if (!this.provider) {
      logger.error('No provider available for quick add');
      return;
    }

    try {
      // Get video element and current time
      const videoElement = this.provider.getVideoElement();
      if (!videoElement) {
        logger.warn('Quick add failed: No video element found');
        return;
      }

      const currentTime = videoElement.currentTime;

      // Get current media info
      const mediaInfo = await this.provider.getCurrentMedia();
      if (!mediaInfo) {
        logger.warn('Quick add failed: No media info found');
        return;
      }

      const videoId = mediaInfo.id;

      // Send message to background to store current timestamp and video info
      // This will be used if the user opens the extension popup
      await browser.runtime
        .sendMessage({
          type: 'STORE_QUICK_ADD_CONTEXT',
          videoId,
          timestamp: currentTime,
        })
        .catch((error) => {
          logger.error('Failed to store quick add context:', error);
        });

      // Context stored - user can now open popup to complete submission
      // UI 5: Feedback Toast (Handled via WatchingOverlay UI usually, but we can log/toast)
      // Since WatchingOverlay calls this, it might display the toast.
      // If we are in legacy mode, we might need a manual toast.
      logger.info(`Timestamp ${Math.floor(currentTime)}s saved. Open popup to submit trigger.`);
      logger.info(`Context saved for popup fallback.`);
    } catch (error) {
      logger.error('Failed to get current timestamp:', error);
    }
  }

  async handleProfileChange(profileId: string): Promise<void> {
    if (this.isDisposed) return;
    logger.info('Profile changed:', profileId);

    // Reinitialize warning manager with new profile
    if (this.provider && this.warningManager) {
      this.warningManager.dispose();
      this.warningManager = new WarningManager(this.provider);
      await this.warningManager.initialize();

      // Reconnect callbacks
      this.warningManager.onWarning((warning: ActiveWarning) => {
        this.bannerManager?.showWarning(warning);
      });

      this.warningManager.onWarningEnd((warningId: string) => {
        this.bannerManager?.hideWarning(warningId);
      });
    }
  }

  dispose(): void {
    logger.info('Disposing content script...');
    this.isDisposed = true; // Mark as disposed first

    // Stop playback monitoring
    this.stopPlaybackMonitoring();

    // Dispose new workflow managers
    if (this.preWatchManager) {
      this.preWatchManager.dispose();
      this.preWatchManager = null;
    }

    if (this.watchingOverlayManager) {
      this.watchingOverlayManager.dispose();
      this.watchingOverlayManager = null;
    }

    // Dispose legacy managers
    if (this.warningManager) {
      this.warningManager.dispose();
      this.warningManager = null;
    }

    if (this.bannerManager) {
      this.bannerManager.dispose();
      this.bannerManager = null;
    }

    // Note: indicatorManager removed - merged into WatchingOverlay

    if (this.provider) {
      this.provider.dispose();
      this.provider = null;
    }

    // Clear state
    this.triggerData = null;
    this.currentMediaInfo = null;
    this.activeWarningsMap.clear();
    this.initialized = false;

    logger.info('Content script disposed');
  }
}

// Create and initialize
logger.debug('Creating TriggerWarningsContent instance...');
const app = new TriggerWarningsContent();

// Initialize when DOM is ready
logger.debug('Setting up initialization trigger...');
if (document.readyState === 'loading') {
  logger.debug('DOM still loading, waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', () => {
    logger.debug('DOMContentLoaded fired, initializing...');
    app.initialize().catch((err) => {
      logger.error('Fatal error during initialization:', err);
    });
  });
} else {
  logger.debug('DOM already ready, initializing immediately...');
  app.initialize().catch((err) => {
    logger.error('Fatal error during initialization:', err);
  });
}

// Listen for messages from background script
browser.runtime.onMessage.addListener((message): void | Promise<any> => {
  if (message.type === 'PROFILE_CHANGED') {
    app.handleProfileChange(message.profileId);
    return;
  }

  if (message.type === 'GET_CURRENT_TIMESTAMP') {
    // Return current video timestamp
    try {
      if (app['provider']) {
        const videoElement = app['provider'].getVideoElement();
        if (videoElement) {
          return Promise.resolve({
            success: true,
            timestamp: videoElement.currentTime,
          });
        }
      }
      return Promise.resolve({ success: false, error: 'No video element found' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return Promise.resolve({ success: false, error: errorMessage });
    }
  }

  if (message.type === 'CONTROL_VIDEO') {
    // Control video playback (play, pause, seek)
    try {
      if (app['provider']) {
        const videoElement = app['provider'].getVideoElement();
        if (videoElement) {
          const { action, seekTime } = message;

          if (action === 'play') {
            videoElement.play();
          } else if (action === 'pause') {
            videoElement.pause();
          } else if (action === 'seek' && seekTime !== undefined) {
            videoElement.currentTime = seekTime;
          }

          return Promise.resolve({
            success: true,
            timestamp: videoElement.currentTime,
            paused: videoElement.paused,
          });
        }
      }
      return Promise.resolve({ success: false, error: 'No video element found' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return Promise.resolve({ success: false, error: errorMessage });
    }
  }

  return;
});

// Clean up on unload
window.addEventListener('beforeunload', () => {
  app.dispose();
});

logger.info('Content script loaded');
