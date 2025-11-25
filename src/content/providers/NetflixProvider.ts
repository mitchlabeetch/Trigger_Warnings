/**
 * Netflix streaming provider
 */

import { BaseProvider } from './BaseProvider';
import type { MediaInfo } from '@shared/types/Provider.types';
import { sendHtmlToOffscreen } from '../utils/offscreen';

export class NetflixProvider extends BaseProvider {
  readonly name = 'Netflix';
  readonly domains = ['netflix.com'];

  private lastSeekTime = 0;

  async initialize(): Promise<void> {
    console.log('[TW Netflix] Starting initialization...');
    super.initialize();

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
    const { timeline } = await sendHtmlToOffscreen(document.documentElement.outerHTML);
    const title = timeline.title;

    return {
      id: videoId,
      title: title || `Netflix Video ${videoId}`,
      type: 'movie', // Netflix doesn't easily expose this in the DOM
    };
  }

  getInjectionPoint(): HTMLElement | null {
    // Netflix player container
    return (
      document.querySelector('.watch-video') ||
      document.querySelector('.NFPlayer') ||
      document.body
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
    (this as any)._urlCheckInterval = checkURL;
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
