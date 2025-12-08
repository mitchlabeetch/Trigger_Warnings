/**
 * Peacock streaming provider
 */

import { BaseProvider } from './BaseProvider';
import type { MediaInfo } from '@shared/types/Provider.types';
import { createLogger } from '@shared/utils/logger';

const logger = createLogger('Peacock');

export class PeacockProvider extends BaseProvider {
  readonly name = 'Peacock';
  readonly domains = ['peacocktv.com'];

  private lastSeekTime = 0;
  private urlCheckIntervalId: ReturnType<typeof setInterval> | null = null;

  async initialize(): Promise<void> {
    const video = await this.waitForElement<HTMLVideoElement>('video');
    if (!video) {
      logger.error('Video element not found');
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

  async getCurrentMedia(): Promise<MediaInfo | null> {
    // Peacock URLs: /watch/asset/<type>/<video-id> or /watch/<video-id>
    const assetMatch = window.location.pathname.match(/\/watch\/asset\/[^/]+\/([^/]+)/);
    const watchMatch = window.location.pathname.match(/\/watch\/([^/]+)/);

    const match = assetMatch || watchMatch;
    if (!match) return null;

    const videoId = match[1];
    const title = this.extractTitle();

    return {
      id: videoId,
      title: title || `Peacock Video ${videoId}`,
      type: 'movie',
    };
  }

  getInjectionPoint(): HTMLElement | null {
    return (
      document.querySelector('[class*="player-container"]') ||
      document.querySelector('[class*="VideoPlayer"]') ||
      document.querySelector('.player-wrapper') ||
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
      'h1[data-testid="video-title"]',
      '[class*="VideoTitle"] h1',
      '[class*="Metadata"] h1',
      'h1',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent) {
        return element.textContent.trim();
      }
    }

    const pageTitle = document.title
      .replace(' | Peacock', '')
      .replace(' - Peacock', '')
      .replace('Watch ', '')
      .trim();
    if (pageTitle && pageTitle !== 'Peacock') {
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
