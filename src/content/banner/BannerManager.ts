/**
 * Banner Manager
 * Manages the warning banner lifecycle and Svelte component mounting
 */

import type { IStreamingProvider } from '@shared/types/Provider.types';
import type { ActiveWarning } from '@shared/types/Warning.types';
import { createContainer, injectContainer } from '@shared/utils/dom';
import { createLogger } from '@shared/utils/logger';
import Banner from './Banner.svelte';

const logger = createLogger('BannerManager');

export class BannerManager {
  private provider: IStreamingProvider;
  private container: HTMLDivElement | null = null;
  private bannerComponent: Banner | null = null;
  private activeWarnings: Map<string, ActiveWarning> = new Map();

  private onIgnoreThisTimeCallback: ((warningId: string) => void) | null = null;
  private onIgnoreForVideoCallback: ((categoryKey: string) => void) | null = null;
  private onVoteCallback: ((warningId: string, voteType: 'up' | 'down') => void) | null = null;

  constructor(provider: IStreamingProvider) {
    this.provider = provider;
  }

  async initialize(): Promise<void> {
    logger.info('Initializing banner manager...');

    // Create container for banner
    this.container = createContainer('tw-banner-container', 'tw-banner-root');

    // Inject into DOM
    const injectionPoint = this.provider.getInjectionPoint();
    injectContainer(this.container, injectionPoint || undefined);

    // Mount Svelte component
    this.bannerComponent = new Banner({
      target: this.container,
      props: {
        warnings: [],
        onIgnoreThisTime: (warningId: string) => this.handleIgnoreThisTime(warningId),
        onIgnoreForVideo: (categoryKey: string) => this.handleIgnoreForVideo(categoryKey),
        onVote: (warningId: string, voteType: 'up' | 'down') => this.handleVote(warningId, voteType),
      },
    });

    logger.info('Banner manager initialized');
  }

  showWarning(warning: ActiveWarning): void {
    logger.debug('Showing warning:', warning.id, warning.categoryKey);

    this.activeWarnings.set(warning.id, warning);
    this.updateBanner();
  }

  hideWarning(warningId: string): void {
    logger.debug('Hiding warning:', warningId);

    this.activeWarnings.delete(warningId);
    this.updateBanner();
  }

  private updateBanner(): void {
    if (!this.bannerComponent) return;

    const warnings = Array.from(this.activeWarnings.values());

    // Sort by priority: active warnings first, then by time until start
    warnings.sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return a.timeUntilStart - b.timeUntilStart;
    });

    this.bannerComponent.$set({ warnings });
  }

  private handleIgnoreThisTime(warningId: string): void {
    logger.info('Ignore this time:', warningId);

    this.activeWarnings.delete(warningId);
    this.updateBanner();

    if (this.onIgnoreThisTimeCallback) {
      this.onIgnoreThisTimeCallback(warningId);
    }
  }

  private handleIgnoreForVideo(categoryKey: string): void {
    logger.info('Ignore for video:', categoryKey);

    // Remove all warnings with this category
    for (const [id, warning] of this.activeWarnings.entries()) {
      if (warning.categoryKey === categoryKey) {
        this.activeWarnings.delete(id);
      }
    }

    this.updateBanner();

    if (this.onIgnoreForVideoCallback) {
      this.onIgnoreForVideoCallback(categoryKey);
    }
  }

  private handleVote(warningId: string, voteType: 'up' | 'down'): void {
    logger.info('Vote:', warningId, voteType);

    if (this.onVoteCallback) {
      this.onVoteCallback(warningId, voteType);
    }
  }

  onIgnoreThisTime(callback: (warningId: string) => void): void {
    this.onIgnoreThisTimeCallback = callback;
  }

  onIgnoreForVideo(callback: (categoryKey: string) => void): void {
    this.onIgnoreForVideoCallback = callback;
  }

  onVote(callback: (warningId: string, voteType: 'up' | 'down') => void): void {
    this.onVoteCallback = callback;
  }

  dispose(): void {
    logger.info('Disposing banner manager...');

    if (this.bannerComponent) {
      this.bannerComponent.$destroy();
      this.bannerComponent = null;
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }

    this.activeWarnings.clear();
  }
}
