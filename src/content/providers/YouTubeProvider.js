/**
 * YouTube streaming provider
 */
import { BaseProvider } from './BaseProvider';
export class YouTubeProvider extends BaseProvider {
    name = 'YouTube';
    domains = ['youtube.com'];
    videoElement = null;
    lastSeekTime = 0;
    async initialize() {
        console.log('[TW YouTube] Starting initialization...');
        // Wait for YouTube's specific video element
        const video = await this.waitForElement('video.html5-main-video', 15000);
        if (!video) {
            console.error('[TW YouTube] Primary video element not found after 15s');
            console.log('[TW YouTube] Attempting fallback detection...');
            // Fallback: try generic video selector
            for (let i = 0; i < 5; i++) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                const fallbackVideo = document.querySelector('video.html5-main-video') ||
                    document.querySelector('video');
                if (fallbackVideo) {
                    console.log('[TW YouTube] Video element found via fallback!');
                    this.videoElement = fallbackVideo;
                    break;
                }
            }
            if (!this.videoElement) {
                console.error('[TW YouTube] Failed to find video element after all attempts');
                return;
            }
        }
        else {
            this.videoElement = video;
            console.log('[TW YouTube] Video element found successfully');
        }
        this.setupVideoListeners();
        console.log('[TW YouTube] Video listeners set up');
        this.monitorURLChanges();
        const media = await this.getCurrentMedia();
        if (media) {
            console.log('[TW YouTube] Initial media info:', media);
            await this.triggerMediaChangeCallbacks(media);
        }
        else {
            console.warn('[TW YouTube] No media info available');
        }
        console.log('[TW YouTube] Initialization complete');
    }
    async getCurrentMedia() {
        // YouTube video ID from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('v');
        if (!videoId)
            return null;
        const title = this.extractTitle();
        return {
            id: videoId,
            title: title || `YouTube Video ${videoId}`,
            type: 'movie', // YouTube doesn't have seasons/episodes
        };
    }
    getVideoElement() {
        // Check if we already have a valid video element
        if (this.videoElement && document.contains(this.videoElement)) {
            return this.videoElement;
        }
        // Try to find video element with YouTube-specific selector first
        const video = document.querySelector('video.html5-main-video') ||
            document.querySelector('video');
        if (video) {
            console.log('[TW YouTube] Video element re-acquired from DOM');
            this.videoElement = video;
            // Re-setup listeners if video element changed
            this.setupVideoListeners();
        }
        else {
            console.warn('[TW YouTube] No video element found in DOM');
        }
        return this.videoElement;
    }
    getInjectionPoint() {
        return (document.querySelector('.html5-video-container') ||
            document.querySelector('#movie_player') ||
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
            'h1.ytd-watch-metadata yt-formatted-string',
            'h1.title.ytd-video-primary-info-renderer',
            '.ytp-title-link',
        ];
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element?.textContent) {
                return element.textContent.trim();
            }
        }
        const pageTitle = document.title.replace(' - YouTube', '').trim();
        if (pageTitle && pageTitle !== 'YouTube') {
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
//# sourceMappingURL=YouTubeProvider.js.map