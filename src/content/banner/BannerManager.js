/**
 * Banner Manager
 * Manages the warning banner lifecycle and Svelte component mounting
 */
import { createContainer, injectContainer } from '@shared/utils/dom';
import { createLogger } from '@shared/utils/logger';
import browser from 'webextension-polyfill';
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
    // Banner settings
    position = 'top-right';
    fontSize = 16;
    transparency = 85;
    spoilerFreeMode = false;
    constructor(provider) {
        this.provider = provider;
    }
    async initialize() {
        logger.info('[TW BannerManager] 🚀 Initializing banner manager...');
        // Load profile settings
        await this.loadProfileSettings();
        // Create container for banner
        this.container = createContainer('tw-banner-container', 'tw-banner-root');
        logger.info('[TW BannerManager] ✅ Container created');
        // Inject into DOM
        const injectionPoint = this.provider.getInjectionPoint();
        injectContainer(this.container, injectionPoint || undefined);
        logger.info('[TW BannerManager] ✅ Container injected into DOM');
        // Mount Svelte component
        this.bannerComponent = new Banner({
            target: this.container,
            props: {
                warnings: [],
                onIgnoreThisTime: (warningId) => this.handleIgnoreThisTime(warningId),
                onIgnoreForVideo: (categoryKey) => this.handleIgnoreForVideo(categoryKey),
                onVote: (warningId, voteType) => this.handleVote(warningId, voteType),
                position: this.position,
                fontSize: this.fontSize,
                transparency: this.transparency,
                spoilerFreeMode: this.spoilerFreeMode,
            },
        });
        logger.info('[TW BannerManager] ✅ Banner component mounted');
        // Listen for profile changes
        browser.runtime.onMessage.addListener((message) => {
            if (message.type === 'PROFILE_CHANGED') {
                this.loadProfileSettings();
            }
        });
        logger.info('[TW BannerManager] ✅ Initialization complete');
    }
    async loadProfileSettings() {
        try {
            const response = await browser.runtime.sendMessage({
                type: 'GET_ACTIVE_PROFILE',
            });
            if (response.success && response.data) {
                const profile = response.data;
                this.position = profile.display.position;
                this.fontSize = profile.display.fontSize;
                this.transparency = profile.display.transparency;
                this.spoilerFreeMode = profile.display.spoilerFreeMode;
                // Update banner if already mounted
                if (this.bannerComponent) {
                    this.bannerComponent.$set({
                        position: this.position,
                        fontSize: this.fontSize,
                        transparency: this.transparency,
                        spoilerFreeMode: this.spoilerFreeMode,
                    });
                }
                logger.debug('Profile settings loaded:', {
                    position: this.position,
                    fontSize: this.fontSize,
                    transparency: this.transparency,
                    spoilerFreeMode: this.spoilerFreeMode,
                });
            }
        }
        catch (error) {
            logger.error('Failed to load profile settings:', error);
        }
    }
    showWarning(warning) {
        logger.info(`[TW BannerManager] 📥 Received warning to show: ${warning.categoryKey} (${warning.isActive ? 'ACTIVE' : 'UPCOMING'})`);
        console.log('[TW BannerManager] Full warning details:', warning);
        this.activeWarnings.set(warning.id, warning);
        logger.info(`[TW BannerManager] Active warnings count: ${this.activeWarnings.size}`);
        this.updateBanner();
    }
    hideWarning(warningId) {
        logger.info(`[TW BannerManager] 🔽 Hiding warning: ${warningId}`);
        this.activeWarnings.delete(warningId);
        logger.info(`[TW BannerManager] Active warnings count: ${this.activeWarnings.size}`);
        this.updateBanner();
    }
    updateBanner() {
        if (!this.bannerComponent) {
            console.warn('[TW BannerManager] ⚠️ Cannot update banner - component not mounted!');
            return;
        }
        const warnings = Array.from(this.activeWarnings.values());
        // Sort by priority: active warnings first, then by time until start
        warnings.sort((a, b) => {
            if (a.isActive && !b.isActive)
                return -1;
            if (!a.isActive && b.isActive)
                return 1;
            return a.timeUntilStart - b.timeUntilStart;
        });
        logger.info(`[TW BannerManager] 🎨 Updating banner with ${warnings.length} warning(s)`);
        if (warnings.length > 0) {
            console.log('[TW BannerManager] Warning categories being displayed:', warnings.map(w => w.categoryKey));
        }
        else {
            console.log('[TW BannerManager] No warnings to display');
        }
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