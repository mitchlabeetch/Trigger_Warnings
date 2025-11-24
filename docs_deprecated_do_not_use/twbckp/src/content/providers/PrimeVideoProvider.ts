/**
 * Amazon Prime Video streaming provider
 */

import { BaseProvider } from './BaseProvider';
import type { MediaInfo } from '@shared/types/Provider.types';

export class PrimeVideoProvider extends BaseProvider {
  readonly name = 'Prime Video';
  readonly domains = ['primevideo.com', 'amazon.com'];

  private videoElement: HTMLVideoElement | null = null;
  private lastSeekTime = 0;

  async initialize(): Promise<void> {
    const video = await this.waitForElement<HTMLVideoElement>('video');
    if (!video) {
      console.error('Prime Video element not found');
      return;
    }

    this.videoElement = video;
    this.setupVideoListeners();

    const media = await this.getCurrentMedia();
    if (media) {
      await this.triggerMediaChangeCallbacks(media);
    }
  }

  async getCurrentMedia(): Promise<MediaInfo | null> {
    // Prime Video uses different URL patterns
    // Detail page: /detail/[title]/[id]
    // Player page: /gp/video/detail/[id]
    const detailMatch = window.location.pathname.match(/\/detail\/([^/]+)\/([^/]+)/);
    const playerMatch = window.location.pathname.match(/\/gp\/video\/detail\/([^/]+)/);

    let videoId: string | null = null;
    if (detailMatch) {
      videoId = detailMatch[2];
    } else if (playerMatch) {
      videoId = playerMatch[1];
    }

    if (!videoId) return null;

    const title = this.extractTitle();

    return {
      id: videoId,
      title: title || `Prime Video ${videoId}`,
      type: 'movie',
    };
  }

  getVideoElement(): HTMLVideoElement | null {
    if (this.videoElement && document.contains(this.videoElement)) {
      return this.videoElement;
    }

    this.videoElement = document.querySelector('video');
    return this.videoElement;
  }

  getInjectionPoint(): HTMLElement | null {
    return (
      document.querySelector('.rendererContainer') ||
      document.querySelector('.webPlayerContainer') ||
      document.querySelector('.dv-player-fullscreen') ||
      document.body
    );
  }

  private setupVideoListeners(): void {
    const video = this.videoElement;
    if (!video) return;

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

  private extractTitle(): string {
    const selectors = [
      '[data-automation-id="title"]',
      '.av-detail-section h1',
      '.title-text',
      'h1',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent) {
        return element.textContent.trim();
      }
    }

    const pageTitle = document.title.replace(' - Prime Video', '').trim();
    if (pageTitle && pageTitle !== 'Prime Video') {
      return pageTitle;
    }

    return '';
  }
}
