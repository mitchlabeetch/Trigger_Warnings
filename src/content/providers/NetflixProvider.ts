/**
 * Netflix streaming provider
 */

import { BaseProvider } from './BaseProvider';
import type { MediaInfo } from '@shared/types/Provider.types';

export class NetflixProvider extends BaseProvider {
  readonly name = 'Netflix';
  readonly domains = ['netflix.com'];

  private videoElement: HTMLVideoElement | null = null;
  private lastSeekTime = 0;

  async initialize(): Promise<void> {
    console.log('[TW Netflix] Starting initialization...');

    // Wait for video element to load with extended timeout
    const video = await this.waitForElement<HTMLVideoElement>('video', 15000);
    if (!video) {
      console.error('[TW Netflix] Video element not found after 15s timeout');
      console.log('[TW Netflix] Attempting fallback detection...');

      // Fallback: try multiple times
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const fallbackVideo = document.querySelector<HTMLVideoElement>('video');
        if (fallbackVideo) {
          console.log('[TW Netflix] Video element found via fallback!');
          this.videoElement = fallbackVideo;
          break;
        }
      }

      if (!this.videoElement) {
        console.error('[TW Netflix] Failed to find video element after all attempts');
        return;
      }
    } else {
      this.videoElement = video;
      console.log('[TW Netflix] Video element found successfully');
    }

    // Set up video event listeners
    this.setupVideoListeners();
    console.log('[TW Netflix] Video listeners set up');

    // Monitor for URL changes (switching episodes)
    this.monitorURLChanges();

    // Get initial media info
    const media = await this.getCurrentMedia();
    if (media) {
      console.log('[TW Netflix] Initial media info:', media);
      await this.triggerMediaChangeCallbacks(media);
    } else {
      console.warn('[TW Netflix] No media info available');
    }

    console.log('[TW Netflix] Initialization complete');
  }

  async getCurrentMedia(): Promise<MediaInfo | null> {
    // Extract video ID from URL
    const match = window.location.pathname.match(/\/watch\/(\d+)/);
    if (!match) return null;

    const videoId = match[1];

    // Try to get title from Netflix's player API
    const title = this.extractTitle();

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
      console.log('[TW Netflix] Video element re-acquired from DOM');
      this.videoElement = video;
      // Re-setup listeners if video element changed
      this.setupVideoListeners();
    } else {
      console.warn('[TW Netflix] No video element found in DOM');
    }

    return this.videoElement;
  }

  getInjectionPoint(): HTMLElement | null {
    // Netflix player container
    return (
      document.querySelector('.watch-video') ||
      document.querySelector('.NFPlayer') ||
      document.body
    );
  }

  private setupVideoListeners(): void {
    const video = this.videoElement;
    if (!video) return;

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

  private extractTitle(): string {
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
    (this as any)._urlCheckInterval = checkURL;
  }

  protected override handleDOMMutations(_mutations: MutationRecord[]): void {
    // Check if video element changed
    const currentVideo = document.querySelector('video');
    if (currentVideo !== this.videoElement) {
      this.videoElement = currentVideo as HTMLVideoElement;
      if (this.videoElement) {
        this.setupVideoListeners();
      }
    }
  }

  override dispose(): void {
    // Clear URL check interval
    if ((this as any)._urlCheckInterval) {
      clearInterval((this as any)._urlCheckInterval);
      delete (this as any)._urlCheckInterval;
    }

    super.dispose();
  }
}
