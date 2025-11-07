/**
 * Netflix streaming provider
 */
import { BaseProvider } from './BaseProvider';
export class NetflixProvider extends BaseProvider {
    name = 'Netflix';
    domains = ['netflix.com'];
    videoElement = null;
    lastSeekTime = 0;
    async initialize() {
        // Wait for video element to load
        const video = await this.waitForElement('video');
        if (!video) {
            console.error('Netflix video element not found');
            return;
        }
        this.videoElement = video;
        // Set up video event listeners
        this.setupVideoListeners();
        // Monitor for URL changes (switching episodes)
        this.monitorURLChanges();
        // Get initial media info
        const media = await this.getCurrentMedia();
        if (media) {
            await this.triggerMediaChangeCallbacks(media);
        }
    }
    async getCurrentMedia() {
        // Extract video ID from URL
        const match = window.location.pathname.match(/\/watch\/(\d+)/);
        if (!match)
            return null;
        const videoId = match[1];
        // Try to get title from Netflix's player API
        const title = this.extractTitle();
        return {
            id: videoId,
            title: title || `Netflix Video ${videoId}`,
            type: 'movie', // Netflix doesn't easily expose this in the DOM
        };
    }
    getVideoElement() {
        if (this.videoElement && document.contains(this.videoElement)) {
            return this.videoElement;
        }
        // Try to find video element
        this.videoElement = document.querySelector('video');
        return this.videoElement;
    }
    getInjectionPoint() {
        // Netflix player container
        return (document.querySelector('.watch-video') ||
            document.querySelector('.NFPlayer') ||
            document.body);
    }
    setupVideoListeners() {
        const video = this.videoElement;
        if (!video)
            return;
        // Play event
        this.addEventListener(video, 'play', () => {
            this.triggerPlayCallbacks();
        });
        // Pause event
        this.addEventListener(video, 'pause', () => {
            this.triggerPauseCallbacks();
        });
        // Seek event
        this.addEventListener(video, 'seeked', () => {
            const currentTime = video.currentTime;
            const timeDiff = Math.abs(currentTime - this.lastSeekTime);
            // Only trigger if seek was significant (> 1 second)
            if (timeDiff > 1) {
                this.triggerSeekCallbacks(currentTime);
            }
            this.lastSeekTime = currentTime;
        });
        // Time update for tracking
        this.addEventListener(video, 'timeupdate', () => {
            this.lastSeekTime = video.currentTime;
        });
    }
    extractTitle() {
        // Try multiple selectors for Netflix title
        const titleSelectors = [
            '.video-title h4',
            '.ellipsize-text h4',
            '[data-uia="video-title"]',
            '.title-logo',
        ];
        for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element?.textContent) {
                return element.textContent.trim();
            }
        }
        // Fallback to page title
        const pageTitle = document.title.replace(' - Netflix', '').trim();
        if (pageTitle && pageTitle !== 'Netflix') {
            return pageTitle;
        }
        return '';
    }
    monitorURLChanges() {
        let lastURL = window.location.href;
        // Use MutationObserver to detect URL changes
        this.observeDOM(document.body, {
            childList: true,
            subtree: true,
        });
        // Also use interval as fallback
        const checkURL = setInterval(async () => {
            const currentURL = window.location.href;
            if (currentURL !== lastURL) {
                lastURL = currentURL;
                // URL changed, get new media info
                const media = await this.getCurrentMedia();
                if (media) {
                    await this.triggerMediaChangeCallbacks(media);
                }
            }
        }, 1000);
        // Store interval for cleanup
        this._urlCheckInterval = checkURL;
    }
    handleDOMMutations(_mutations) {
        // Check if video element changed
        const currentVideo = document.querySelector('video');
        if (currentVideo !== this.videoElement) {
            this.videoElement = currentVideo;
            if (this.videoElement) {
                this.setupVideoListeners();
            }
        }
    }
    dispose() {
        // Clear URL check interval
        if (this._urlCheckInterval) {
            clearInterval(this._urlCheckInterval);
            delete this._urlCheckInterval;
        }
        super.dispose();
    }
}
//# sourceMappingURL=NetflixProvider.js.map