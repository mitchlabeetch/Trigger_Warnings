/**
 * Content script - main entry point
 * Runs on streaming platform pages to detect video and show warnings
 */
import browser from 'webextension-polyfill';
import { ProviderFactory } from './providers/ProviderFactory';
import { WarningManager } from '@core/warning-system/WarningManager';
import { BannerManager } from './banner/BannerManager';
import { ActiveIndicatorManager } from './indicator/ActiveIndicatorManager';
import { createLogger } from '@shared/utils/logger';
const logger = createLogger('Content');
class TriggerWarningsContent {
    provider = null;
    warningManager = null;
    bannerManager = null;
    indicatorManager = null;
    initialized = false;
    activeWarningsMap = new Map();
    async initialize() {
        if (this.initialized)
            return;
        logger.info('Initializing content script...');
        try {
            // Check if this site is supported
            if (!ProviderFactory.isSupported()) {
                logger.warn('Site not supported');
                return;
            }
            // Create provider for current site
            this.provider = await ProviderFactory.createProvider();
            if (!this.provider) {
                logger.error('Failed to create provider');
                return;
            }
            logger.info(`Provider initialized: ${this.provider.name}`);
            // Initialize warning manager
            this.warningManager = new WarningManager(this.provider);
            await this.warningManager.initialize();
            // Initialize banner manager
            this.bannerManager = new BannerManager(this.provider);
            await this.bannerManager.initialize();
            // Initialize active indicator
            this.indicatorManager = new ActiveIndicatorManager(this.provider);
            await this.indicatorManager.initialize();
            // Connect warning manager to banner manager and indicator
            this.warningManager.onWarning((warning) => {
                this.bannerManager?.showWarning(warning);
                // Update active warnings for indicator
                this.activeWarningsMap.set(warning.id, warning);
                this.updateIndicatorWarnings();
            });
            this.warningManager.onWarningEnd((warningId) => {
                this.bannerManager?.hideWarning(warningId);
                // Update active warnings for indicator
                this.activeWarningsMap.delete(warningId);
                this.updateIndicatorWarnings();
            });
            // Set up banner callbacks
            this.bannerManager.onIgnoreThisTime((warningId) => {
                this.warningManager?.ignoreThisTime(warningId);
            });
            this.bannerManager.onIgnoreForVideo((categoryKey) => {
                this.warningManager?.ignoreForVideo(categoryKey);
            });
            this.bannerManager.onVote(async (warningId, voteType) => {
                try {
                    const response = await browser.runtime.sendMessage({
                        type: 'VOTE_WARNING',
                        triggerId: warningId,
                        voteType,
                    });
                    if (response.success) {
                        logger.info(`Vote ${voteType} recorded for warning ${warningId}`);
                    }
                }
                catch (error) {
                    logger.error('Failed to vote:', error);
                }
            });
            // Set up indicator callbacks
            this.indicatorManager.onQuickAdd(() => {
                this.handleQuickAddTrigger();
            });
            this.initialized = true;
            logger.info('Content script initialized successfully');
        }
        catch (error) {
            logger.error('Initialization error:', error);
        }
    }
    /**
     * Update indicator with current active warnings
     */
    updateIndicatorWarnings() {
        const warnings = Array.from(this.activeWarningsMap.values());
        this.indicatorManager?.updateActiveWarnings(warnings);
    }
    /**
     * Handle quick add trigger button click
     * Gets current timestamp and sends message to background to open trigger submission
     */
    async handleQuickAddTrigger() {
        logger.info('Quick add trigger requested');
        if (!this.provider) {
            logger.error('No provider available for quick add');
            return;
        }
        try {
            // Get video element and current time
            const videoElement = this.provider.getVideoElement();
            if (!videoElement) {
                logger.error('No video element found');
                alert('Unable to detect video player. Please try again.');
                return;
            }
            const currentTime = videoElement.currentTime;
            // Get current media info
            const mediaInfo = await this.provider.getCurrentMedia();
            if (!mediaInfo) {
                logger.error('No media info found');
                alert('Unable to detect current video. Please try again.');
                return;
            }
            const videoId = mediaInfo.id;
            logger.info(`Current timestamp: ${currentTime}s, Video ID: ${videoId}`);
            // Send message to background to store current timestamp and video info
            // This will be used when the user opens the popup or trigger submission UI
            await browser.runtime.sendMessage({
                type: 'STORE_QUICK_ADD_CONTEXT',
                videoId,
                timestamp: currentTime,
            }).catch(error => {
                logger.error('Failed to store quick add context:', error);
            });
            // For now, alert the user - later this will open a proper submission UI
            // TODO: Implement proper trigger submission UI in the content script or popup
            alert(`Quick Add Trigger\n\nCurrent timestamp: ${Math.floor(currentTime)}s\n\nPlease use the extension popup to complete the trigger submission.\n\n(Timestamp has been saved)`);
        }
        catch (error) {
            logger.error('Failed to get current timestamp:', error);
        }
    }
    async handleProfileChange(profileId) {
        logger.info('Profile changed:', profileId);
        // Reinitialize warning manager with new profile
        if (this.provider && this.warningManager) {
            this.warningManager.dispose();
            this.warningManager = new WarningManager(this.provider);
            await this.warningManager.initialize();
            // Reconnect callbacks
            this.warningManager.onWarning((warning) => {
                this.bannerManager?.showWarning(warning);
            });
            this.warningManager.onWarningEnd((warningId) => {
                this.bannerManager?.hideWarning(warningId);
            });
        }
    }
    dispose() {
        logger.info('Disposing content script...');
        if (this.warningManager) {
            this.warningManager.dispose();
            this.warningManager = null;
        }
        if (this.bannerManager) {
            this.bannerManager.dispose();
            this.bannerManager = null;
        }
        if (this.indicatorManager) {
            this.indicatorManager.dispose();
            this.indicatorManager = null;
        }
        if (this.provider) {
            this.provider.dispose();
            this.provider = null;
        }
        this.initialized = false;
    }
}
// Create and initialize
const app = new TriggerWarningsContent();
// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app.initialize();
    });
}
else {
    app.initialize();
}
// Listen for messages from background script
browser.runtime.onMessage.addListener((message) => {
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
        }
        catch (error) {
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
                    }
                    else if (action === 'pause') {
                        videoElement.pause();
                    }
                    else if (action === 'seek' && seekTime !== undefined) {
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
        }
        catch (error) {
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
//# sourceMappingURL=index.js.map