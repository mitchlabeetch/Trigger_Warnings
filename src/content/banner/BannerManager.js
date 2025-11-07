/**
 * Banner Manager
 * Manages the warning banner lifecycle and Svelte component mounting
 */
import { createContainer, injectContainer } from '@shared/utils/dom';
import { createLogger } from '@shared/utils/logger';
import Banner from './Banner.svelte';
const logger = createLogger('BannerManager');
export class BannerManager {
    provider;
    container = null;
    bannerComponent = null;
    activeWarnings = new Map();
    onIgnoreThisTimeCallback = null;
    onIgnoreForVideoCallback = null;
    onVoteCallback = null;
    constructor(provider) {
        this.provider = provider;
    }
    async initialize() {
        logger.info('Initializing banner manager...');
        // Create container for banner
        this.container = createContainer('tw-banner-container', 'tw-banner-root');
        // Inject into DOM
        const injectionPoint = this.provider.getInjectionPoint();
        injectContainer(this.container, injectionPoint || undefined);
        // Mount Svelte component
        this.bannerComponent = new Banner({
            target: this.container,
            props: {
                warnings: [],
                onIgnoreThisTime: (warningId) => this.handleIgnoreThisTime(warningId),
                onIgnoreForVideo: (categoryKey) => this.handleIgnoreForVideo(categoryKey),
                onVote: (warningId, voteType) => this.handleVote(warningId, voteType),
            },
        });
        logger.info('Banner manager initialized');
    }
    showWarning(warning) {
        logger.debug('Showing warning:', warning.id, warning.categoryKey);
        this.activeWarnings.set(warning.id, warning);
        this.updateBanner();
    }
    hideWarning(warningId) {
        logger.debug('Hiding warning:', warningId);
        this.activeWarnings.delete(warningId);
        this.updateBanner();
    }
    updateBanner() {
        if (!this.bannerComponent)
            return;
        const warnings = Array.from(this.activeWarnings.values());
        // Sort by priority: active warnings first, then by time until start
        warnings.sort((a, b) => {
            if (a.isActive && !b.isActive)
                return -1;
            if (!a.isActive && b.isActive)
                return 1;
            return a.timeUntilStart - b.timeUntilStart;
        });
        this.bannerComponent.$set({ warnings });
    }
    handleIgnoreThisTime(warningId) {
        logger.info('Ignore this time:', warningId);
        this.activeWarnings.delete(warningId);
        this.updateBanner();
        if (this.onIgnoreThisTimeCallback) {
            this.onIgnoreThisTimeCallback(warningId);
        }
    }
    handleIgnoreForVideo(categoryKey) {
        logger.info('Ignore for video:', categoryKey);
        // Remove all warnings with this category
        for (const [id, warning] of this.activeWarnings.entries()) {
            if (warning.categoryKey === categoryKey) {
                this.activeWarnings.delete(id);
            }
        }
        this.updateBanner();
        if (this.onIgnoreForVideoCallback) {
            this.onIgnoreForVideoCallback(categoryKey);
        }
    }
    handleVote(warningId, voteType) {
        logger.info('Vote:', warningId, voteType);
        if (this.onVoteCallback) {
            this.onVoteCallback(warningId, voteType);
        }
    }
    onIgnoreThisTime(callback) {
        this.onIgnoreThisTimeCallback = callback;
    }
    onIgnoreForVideo(callback) {
        this.onIgnoreForVideoCallback = callback;
    }
    onVote(callback) {
        this.onVoteCallback = callback;
    }
    dispose() {
        logger.info('Disposing banner manager...');
        if (this.bannerComponent) {
            this.bannerComponent.$destroy();
            this.bannerComponent = null;
        }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
            this.container = null;
        }
        this.activeWarnings.clear();
    }
}
//# sourceMappingURL=BannerManager.js.map