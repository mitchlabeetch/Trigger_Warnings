/**
 * Hulu streaming provider
 */

import { BaseProvider } from './BaseProvider';
import type { MediaInfo } from '@shared/types/Provider.types';

export class HuluProvider extends BaseProvider {
  readonly name = 'Hulu';
  readonly domains = ['hulu.com'];

  private lastSeekTime = 0;

  async initialize(): Promise<void> {
    super.initialize();
    this.monitorURLChanges();

    const media = await this.getCurrentMedia();
    if (media) {
      await this.triggerMediaChangeCallbacks(media);
    }
  }

  async getCurrentMedia(): Promise<MediaInfo | null> {
    // Hulu URLs: /watch/<entity-id>
    const match = window.location.pathname.match(/\/watch\/([^/]+)/);
    if (!match) return null;

    const videoId = match[1];
    const title = this.extractTitle();

    return {
      id: videoId,
      title: title || `Hulu Video ${videoId}`,
      type: 'movie', // Hulu doesn't easily distinguish in DOM
    };
  }

  getInjectionPoint(): HTMLElement | null {
    return (
      document.querySelector('.PlayerPresentationView') ||
      document.querySelector('.video-player') ||
      document.querySelector('[class*="Player"]') ||
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
