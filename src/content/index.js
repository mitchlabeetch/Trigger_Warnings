/**
 * Content script - main entry point
 * Runs on streaming platform pages to detect video and show warnings
 */
import browser from 'webextension-polyfill';
import { ProviderFactory } from './providers/ProviderFactory';
import { WarningManager } from '@core/warning-system/WarningManager';
import { BannerManager } from './banner/BannerManager';
import { createLogger } from '@shared/utils/logger';
const logger = createLogger('Content');
class TriggerWarningsContent {
    provider = null;
    warningManager = null;
    bannerManager = null;
    initialized = false;
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
            // Connect warning manager to banner manager
            this.warningManager.onWarning((warning) => {
                this.bannerManager?.showWarning(warning);
            });
            this.warningManager.onWarningEnd((warningId) => {
                this.bannerManager?.hideWarning(warningId);
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
            this.initialized = true;
            logger.info('Content script initialized successfully');
        }
        catch (error) {
            logger.error('Initialization error:', error);
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
    }
});
// Clean up on unload
window.addEventListener('beforeunload', () => {
    app.dispose();
});
logger.info('Content script loaded');
//# sourceMappingURL=index.js.map