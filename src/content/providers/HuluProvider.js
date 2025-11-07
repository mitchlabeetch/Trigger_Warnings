/**
 * Hulu streaming provider
 */
import { BaseProvider } from './BaseProvider';
export class HuluProvider extends BaseProvider {
    name = 'Hulu';
    domains = ['hulu.com'];
    videoElement = null;
    lastSeekTime = 0;
    async initialize() {
        const video = await this.waitForElement('video');
        if (!video) {
            console.error('Hulu video element not found');
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
        // Hulu URLs: /watch/<entity-id>
        const match = window.location.pathname.match(/\/watch\/([^/]+)/);
        if (!match)
            return null;
        const videoId = match[1];
        const title = this.extractTitle();
        return {
            id: videoId,
            title: title || `Hulu Video ${videoId}`,
            type: 'movie', // Hulu doesn't easily distinguish in DOM
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
        return (document.querySelector('.PlayerPresentationView') ||
            document.querySelector('.video-player') ||
            document.querySelector('[class*="Player"]') ||
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
            'h1[class*="Masthead"]',
            '[class*="PlayerMetadata"] h1',
            '[data-automationid="masthead-title"]',
            'h1',
        ];
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element?.textContent) {
                return element.textContent.trim();
            }
        }
        const pageTitle = document.title.replace(' - Hulu', '').replace(' | Hulu', '').trim();
        if (pageTitle && pageTitle !== 'Hulu') {
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
//# sourceMappingURL=HuluProvider.js.map