/**
 * Disney+ streaming provider
 */
import { BaseProvider } from './BaseProvider';
export class DisneyPlusProvider extends BaseProvider {
    name = 'Disney+';
    domains = ['disneyplus.com'];
    videoElement = null;
    lastSeekTime = 0;
    async initialize() {
        const video = await this.waitForElement('video');
        if (!video) {
            console.error('Disney+ video element not found');
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
        // Disney+ URLs: /video/<video-id>
        const match = window.location.pathname.match(/\/video\/([^/]+)/);
        if (!match)
            return null;
        const videoId = match[1];
        const title = this.extractTitle();
        return {
            id: videoId,
            title: title || `Disney+ Video ${videoId}`,
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
        return (document.querySelector('[class*="StyledContainer"]') ||
            document.querySelector('[class*="PlayerContainer"]') ||
            document.querySelector('.btm-media-player') ||
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
            'h1[class*="title"]',
            '[class*="TitleTreatment"] h1',
            '[data-testid="title"]',
            'h1',
        ];
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element?.textContent) {
                return element.textContent.trim();
            }
        }
        const pageTitle = document.title
            .replace(' | Disney+', '')
            .replace(' - Disney+', '')
            .replace('Watch ', '')
            .trim();
        if (pageTitle && pageTitle !== 'Disney+') {
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
//# sourceMappingURL=DisneyPlusProvider.js.map