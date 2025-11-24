/**
 * Active Indicator Manager
 * Manages the "TW Active" indicator overlay and quick-add functionality
 */

import type { IStreamingProvider } from '@shared/types/Provider.types';
import type { ActiveWarning } from '@shared/types/Warning.types';
import { createContainer, injectContainer } from '@shared/utils/dom';
import { createLogger } from '@shared/utils/logger';
import ActiveIndicator from './ActiveIndicator.svelte';

const logger = createLogger('ActiveIndicatorManager');

export class ActiveIndicatorManager {
  private provider: IStreamingProvider;
  private container: HTMLDivElement | null = null;
  private indicatorComponent: ActiveIndicator | null = null;
  private activeWarnings: ActiveWarning[] = [];

  private onQuickAddCallback: (() => void) | null = null;

  constructor(provider: IStreamingProvider) {
    this.provider = provider;
  }

  async initialize(): Promise<void> {
    logger.info('Initializing active indicator...');

    // Create container for indicator
    this.container = createContainer('tw-indicator-container', 'tw-indicator-root');

    // Inject into DOM
    const injectionPoint = this.provider.getInjectionPoint();
    injectContainer(this.container, injectionPoint || undefined);

    // Mount Svelte component
    this.indicatorComponent = new ActiveIndicator({
      target: this.container,
      props: {
        onQuickAdd: () => this.handleQuickAdd(),
        activeWarnings: this.activeWarnings,
      },
    });

    logger.info('Active indicator initialized');
  }

  /**
   * Update active warnings display
   */
  updateActiveWarnings(warnings: ActiveWarning[]): void {
    this.activeWarnings = warnings;
    if (this.indicatorComponent) {
      this.indicatorComponent.$set({ activeWarnings: warnings });
    }
  }

  private handleQuickAdd(): void {
    logger.info('Quick add trigger requested');

    if (this.onQuickAddCallback) {
      this.onQuickAddCallback();
    }
  }

  /**
   * Set callback for quick add button
   */
  onQuickAdd(callback: () => void): void {
    this.onQuickAddCallback = callback;
  }

  /**
   * Show the indicator
   */
  show(): void {
    if (this.container) {
      this.container.style.display = 'block';
    }
  }

  /**
   * Hide the indicator
   */
  hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  dispose(): void {
    logger.info('Disposing active indicator...');

    if (this.indicatorComponent) {
      this.indicatorComponent.$destroy();
      this.indicatorComponent = null;
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }
}
