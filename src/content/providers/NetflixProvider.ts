/**
 * Netflix streaming provider
 */

import { BaseProvider } from './BaseProvider';
import type { MediaInfo } from '@shared/types/Provider.types';
import { createLogger } from '@shared/utils/logger';

const logger = createLogger('Netflix');
import { sendHtmlToOffscreen } from '../utils/offscreen';

export class NetflixProvider extends BaseProvider {
  readonly name = 'Netflix';
  readonly domains = ['netflix.com'];

  private lastSeekTime = 0;
  private urlCheckIntervalId: ReturnType<typeof setInterval> | null = null;

  async initialize(): Promise<void> {
    logger.debug('Starting initialization...');

    // Wait for video element to load with extended timeout
    const video = await this.waitForElement<HTMLVideoElement>('video', 15000);
    if (!video) {
      logger.error('Video element not found after 15s timeout');
      logger.debug('Attempting fallback detection...');

      // Fallback: try multiple times
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const fallbackVideo = document.querySelector<HTMLVideoElement>('video');
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

    // Set up video event listeners
    this.setupVideoListeners();
    logger.debug('Video listeners set up');

    // Monitor for URL changes (switching episodes)
    this.monitorURLChanges();

    // Get initial media info
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
    // Extract video ID from URL
    const match = window.location.pathname.match(/\/watch\/(\d+)/);
    if (!match) return null;

    const videoId = match[1];

    // Try to get title from Netflix's player API
    const { timeline } = await sendHtmlToOffscreen(document.documentElement.outerHTML);
    const title = timeline.title;

    return {
      id: videoId,
      title: title || `Netflix Video ${videoId}`,
      type: 'movie', // Netflix doesn't easily expose this in the DOM
    };
  }

  getVideoElement(): HTMLVideoElement | null {
    // Check if we already have a valid video element
    if (this.videoElement && document.contains(this.videoElement)) {
      return this.videoElement;
    }

    // Try to find video element in DOM
    const video = document.querySelector<HTMLVideoElement>('video');
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
    // Netflix player container
    return (
      document.querySelector('.watch-video') || document.querySelector('.NFPlayer') || document.body
    );
  }

  protected setupVideoListeners(): void {
    if (!this.videoElement) return;

    // Play event
    this.addEventListener(this.videoElement, 'play', () => {
      this.triggerPlayCallbacks();
    });

    // Pause event
    this.addEventListener(this.videoElement, 'pause', () => {
      this.triggerPauseCallbacks();
    });

    // Seek event
    this.addEventListener(this.videoElement, 'seeked', () => {
      if (!this.videoElement) return;
      const currentTime = this.videoElement.currentTime;
      const timeDiff = Math.abs(currentTime - this.lastSeekTime);

      // Only trigger if seek was significant (> 1 second)
      if (timeDiff > 1) {
        this.triggerSeekCallbacks(currentTime);
      }

      this.lastSeekTime = currentTime;
    });

    // Time update for tracking
    this.addEventListener(this.videoElement, 'timeupdate', () => {
      if (!this.videoElement) return;
      this.lastSeekTime = this.videoElement.currentTime;
    });
  }

  private monitorURLChanges(): void {
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
    this.urlCheckIntervalId = checkURL;
  }

  override dispose(): void {
    // Clear URL check interval
    if (this.urlCheckIntervalId) {
      clearInterval(this.urlCheckIntervalId);
      this.urlCheckIntervalId = null;
    }

    super.dispose();
  }
}
