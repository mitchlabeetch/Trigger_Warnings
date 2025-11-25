/**
 * YouTube streaming provider
 */

import { BaseProvider } from './BaseProvider';
import type { MediaInfo } from '@shared/types/Provider.types';

export class YouTubeProvider extends BaseProvider {
  readonly name = 'YouTube';
  readonly domains = ['youtube.com'];
  protected readonly videoElementSelector = 'video.html5-main-video';

  private lastSeekTime = 0;

  async initialize(): Promise<void> {
    console.log('[TW YouTube] Starting initialization...');

    super.initialize();

    this.monitorURLChanges();

    const media = await this.getCurrentMedia();
    if (media) {
      console.log('[TW YouTube] Initial media info:', media);
      await this.triggerMediaChangeCallbacks(media);
    } else {
      console.warn('[TW YouTube] No media info available');
    }

    console.log('[TW YouTube] Initialization complete');
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

    (this as any)._urlCheckInterval = checkURL;
  }

  override dispose(): void {
    if ((this as any)._urlCheckInterval) {
      clearInterval((this as any)._urlCheckInterval);
      delete (this as any)._urlCheckInterval;
    }

    super.dispose();
  }
}
