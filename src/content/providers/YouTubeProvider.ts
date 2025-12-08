/**
 * YouTube streaming provider
 */

import { BaseProvider } from './BaseProvider';
import type { MediaInfo } from '@shared/types/Provider.types';
import { createLogger } from '@shared/utils/logger';

const logger = createLogger('YouTube');

export class YouTubeProvider extends BaseProvider {
  readonly name = 'YouTube';
  readonly domains = ['youtube.com'];
  protected readonly videoElementSelector = 'video.html5-main-video';

  private lastSeekTime = 0;
  private urlCheckIntervalId: ReturnType<typeof setInterval> | null = null;

  async initialize(): Promise<void> {
    logger.debug('Starting initialization...');

    // Wait for YouTube's specific video element
    const video = await this.waitForElement<HTMLVideoElement>('video.html5-main-video', 15000);
    if (!video) {
      logger.error('Primary video element not found after 15s');
      logger.debug('Attempting fallback detection...');

      // Fallback: try generic video selector
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const fallbackVideo =
          document.querySelector<HTMLVideoElement>('video.html5-main-video') ||
          document.querySelector<HTMLVideoElement>('video');
        if (fallbackVideo) {
          logger.debug('Video element found via fallback!');
          this.videoElement = fallbackVideo;
          break;
        }
      }

      if (!this.videoElement) {
        logger.error('Failed to find video element after all attempts');
        return;
      }
    } else {
      this.videoElement = video;
      logger.debug('Video element found successfully');
    }

    this.setupVideoListeners();
    logger.debug('Video listeners set up');

    this.monitorURLChanges();

    const media = await this.getCurrentMedia();
    if (media) {
      logger.debug('Initial media info:', media);
      await this.triggerMediaChangeCallbacks(media);
    } else {
      logger.warn('No media info available');
    }

    logger.info('Initialization complete');
  }

  async getCurrentMedia(): Promise<MediaInfo | null> {
    // YouTube video ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v');

    if (!videoId) return null;

    const title = this.extractTitle();

    return {
      id: videoId,
      title: title || `YouTube Video ${videoId}`,
      type: 'movie', // YouTube doesn't have seasons/episodes
    };
  }

  getVideoElement(): HTMLVideoElement | null {
    // Check if we already have a valid video element
    if (this.videoElement && document.contains(this.videoElement)) {
      return this.videoElement;
    }

    // Try to find video element with YouTube-specific selector first
    const video =
      document.querySelector<HTMLVideoElement>('video.html5-main-video') ||
      document.querySelector<HTMLVideoElement>('video');

    if (video) {
      logger.debug('Video element re-acquired from DOM');
      this.videoElement = video;
      // Re-setup listeners if video element changed
      this.setupVideoListeners();
    } else {
      logger.warn('No video element found in DOM');
    }

    return this.videoElement;
  }

  getInjectionPoint(): HTMLElement | null {
    return (
      document.querySelector('.html5-video-container') ||
      document.querySelector('#movie_player') ||
      document.body
    );
  }

  protected setupVideoListeners(): void {
    if (!this.videoElement) return;

    this.addEventListener(this.videoElement, 'play', () => {
      this.triggerPlayCallbacks();
    });

    this.addEventListener(this.videoElement, 'pause', () => {
      this.triggerPauseCallbacks();
    });

    this.addEventListener(this.videoElement, 'seeked', () => {
      if (!this.videoElement) return;
      const currentTime = this.videoElement.currentTime;
      if (Math.abs(currentTime - this.lastSeekTime) > 1) {
        this.triggerSeekCallbacks(currentTime);
      }
      this.lastSeekTime = currentTime;
    });

    this.addEventListener(this.videoElement, 'timeupdate', () => {
      if (!this.videoElement) return;
      this.lastSeekTime = this.videoElement.currentTime;
    });
  }

  private extractTitle(): string {
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

  private monitorURLChanges(): void {
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

    this.urlCheckIntervalId = checkURL;
  }

  override dispose(): void {
    if (this.urlCheckIntervalId) {
      clearInterval(this.urlCheckIntervalId);
      this.urlCheckIntervalId = null;
    }

    super.dispose();
  }
}
