/**
 * Max (HBO Max) streaming provider
 */

import { BaseProvider } from './BaseProvider';
import type { MediaInfo } from '@shared/types/Provider.types';
import { createLogger } from '@shared/utils/logger';

const logger = createLogger('Max');

export class MaxProvider extends BaseProvider {
  readonly name = 'Max';
  readonly domains = ['max.com', 'hbomax.com'];

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
    // Max URLs: /video/watch/<video-id> or /feature/<video-id>
    const watchMatch = window.location.pathname.match(/\/video\/watch\/([^/]+)/);
    const featureMatch = window.location.pathname.match(/\/feature\/([^/]+)/);

    const match = watchMatch || featureMatch;
    if (!match) return null;

    const videoId = match[1];
    const title = this.extractTitle();

    return {
      id: videoId,
      title: title || `Max Video ${videoId}`,
      type: 'movie',
    };
  }

  getInjectionPoint(): HTMLElement | null {
    return (
      document.querySelector('[class*="PlayerContainer"]') ||
      document.querySelector('[class*="VideoPlayer"]') ||
      document.querySelector('.player-container') ||
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
      '[class*="Metadata"] h1',
      '[data-testid="title-metadata"] h1',
      'h1[class*="Title"]',
      'h1',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent) {
        return element.textContent.trim();
      }
    }

    const pageTitle = document.title
      .replace(' | Max', '')
      .replace(' - Max', '')
      .replace(' | HBO Max', '')
      .replace(' - HBO Max', '')
      .replace('Watch ', '')
      .trim();
    if (pageTitle && pageTitle !== 'Max' && pageTitle !== 'HBO Max') {
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
