/**
 * Max (HBO Max) streaming provider
 */
import { BaseProvider } from './BaseProvider';
export class MaxProvider extends BaseProvider {
    name = 'Max';
    domains = ['max.com', 'hbomax.com'];
    videoElement = null;
    lastSeekTime = 0;
    async initialize() {
        const video = await this.waitForElement('video');
        if (!video) {
            console.error('Max video element not found');
            return;
        }
        this.videoElement = video;
        this.setupVideoListeners();
        this.monitorURLChanges();
        const media = await this.getCurrentMedia();
        if (media) {
            await this.triggerMediaChangeCallbacks(media);
        }
    }
    async getCurrentMedia() {
        // Max URLs: /video/watch/<video-id> or /feature/<video-id>
        const watchMatch = window.location.pathname.match(/\/video\/watch\/([^/]+)/);
        const featureMatch = window.location.pathname.match(/\/feature\/([^/]+)/);
        const match = watchMatch || featureMatch;
        if (!match)
            return null;
        const videoId = match[1];
        const title = this.extractTitle();
        return {
            id: videoId,
            title: title || `Max Video ${videoId}`,
            type: 'movie',
        };
    }
    getVideoElement() {
        if (this.videoElement && document.contains(this.videoElement)) {
            return this.videoElement;
        }
        this.videoElement = document.querySelector('video');
        return this.videoElement;
    }
    getInjectionPoint() {
        return (document.querySelector('[class*="PlayerContainer"]') ||
            document.querySelector('[class*="VideoPlayer"]') ||
            document.querySelector('.player-container') ||
            document.body);
    }
    setupVideoListeners() {
        const video = this.videoElement;
        if (!video)
            return;
        this.addEventListener(video, 'play', () => {
            this.triggerPlayCallbacks();
        });
        this.addEventListener(video, 'pause', () => {
            this.triggerPauseCallbacks();
        });
        this.addEventListener(video, 'seeked', () => {
            const currentTime = video.currentTime;
            if (Math.abs(currentTime - this.lastSeekTime) > 1) {
                this.triggerSeekCallbacks(currentTime);
            }
            this.lastSeekTime = currentTime;
        });
        this.addEventListener(video, 'timeupdate', () => {
            this.lastSeekTime = video.currentTime;
        });
    }
    extractTitle() {
        const selectors = [
            '[class*="Metadata"] h1',
            '[data-testid="title-metadata"] h1',
            'h1[class*="Title"]',
            'h1',
        ];
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element?.textContent) {
                return element.textContent.trim();
            }
        }
        const pageTitle = document.title
            .replace(' | Max', '')
            .replace(' - Max', '')
            .replace(' | HBO Max', '')
            .replace(' - HBO Max', '')
            .replace('Watch ', '')
            .trim();
        if (pageTitle && pageTitle !== 'Max' && pageTitle !== 'HBO Max') {
            return pageTitle;
        }
        return '';
    }
    monitorURLChanges() {
        let lastURL = window.location.href;
        const checkURL = setInterval(async () => {
            const currentURL = window.location.href;
            if (currentURL !== lastURL) {
                lastURL = currentURL;
                const media = await this.getCurrentMedia();
                if (media) {
                    await this.triggerMediaChangeCallbacks(media);
                }
            }
        }, 1000);
        this._urlCheckInterval = checkURL;
    }
    dispose() {
        if (this._urlCheckInterval) {
            clearInterval(this._urlCheckInterval);
            delete this._urlCheckInterval;
        }
        super.dispose();
    }
}
//# sourceMappingURL=MaxProvider.js.map