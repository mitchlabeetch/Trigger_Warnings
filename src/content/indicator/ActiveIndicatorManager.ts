/**
 * Active Indicator Manager
 * Manages the "TW Active" indicator overlay and quick-add functionality
 */

import type { IStreamingProvider } from '@shared/types/Provider.types';
import { createContainer, injectContainer } from '@shared/utils/dom';
import { createLogger } from '@shared/utils/logger';
import { ProfileManager } from '@core/profiles/ProfileManager';
import ActiveIndicator from './ActiveIndicator.svelte';

const logger = createLogger('ActiveIndicatorManager');

export class ActiveIndicatorManager {
  private provider: IStreamingProvider;
  private container: HTMLDivElement | null = null;
  private indicatorComponent: ActiveIndicator | null = null;

  private onQuickAddCallback: (() => void) | null = null;

  constructor(provider: IStreamingProvider) {
    this.provider = provider;
  }

  async initialize(): Promise<void> {
    logger.info('Initializing active indicator...');

    // Load active profile for customization settings
    const profile = await ProfileManager.getActive();

    // Extract overlay customization from profile (with fallback defaults)
    const overlaySettings = profile.display?.overlaySettings || {};
    const buttonColor = overlaySettings.buttonColor || '#8b5cf6';
    const buttonOpacity =
      overlaySettings.buttonOpacity !== undefined ? overlaySettings.buttonOpacity : 0.45;
    // Map profile settings to component's expected type ('always' | 'hover')
    const profileAppearingMode = overlaySettings.appearingMode || 'always';
    const appearingMode: 'always' | 'hover' =
      profileAppearingMode === 'onMove' || profileAppearingMode === 'onHover' ? 'hover' : 'always';
    const fadeOutDelay = overlaySettings.fadeOutDelay || 3000;

    logger.info('Overlay customization:', {
      buttonColor,
      buttonOpacity,
      appearingMode,
      fadeOutDelay,
    });

    // Create container for indicator
    this.container = createContainer('tw-indicator-container', 'tw-indicator-root');

    // Inject into DOM
    try {
      const injectionPoint = this.provider.getInjectionPoint();
      logger.info(
        'Injection point lookup result:',
        injectionPoint ? injectionPoint.tagName : 'null'
      );

      if (injectionPoint) {
        logger.info('Injection point found:', injectionPoint.tagName, injectionPoint.className);
        injectContainer(this.container, injectionPoint);
        logger.info('Container injected into DOM');
      } else {
        logger.error('Failed to find injection point for overlay');
      }

      // Mount Svelte component with customization
      logger.info('Mounting Svelte component...');
      this.indicatorComponent = new ActiveIndicator({
        target: this.container,
        props: {
          onQuickAdd: () => this.handleQuickAdd(),
          buttonColor: buttonColor || '#8b5cf6',
          buttonOpacity: buttonOpacity !== undefined ? buttonOpacity : 0.45,
          appearingMode: appearingMode,
          fadeOutDelay: fadeOutDelay || 3000,
        },
      });
      logger.info('Svelte component mounted successfully');
    } catch (error) {
      logger.error('Error initializing indicator:', error);
    }

    logger.info('Active indicator initialized with custom settings');
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
