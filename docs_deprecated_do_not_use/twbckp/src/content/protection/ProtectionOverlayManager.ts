/**
 * Protection Overlay Manager
 * Manages blackout overlays and audio muting for active trigger warnings
 */

import type { IStreamingProvider } from '@shared/types/Provider.types';
import type { ProtectionType } from '@shared/types/Profile.types';
import { createContainer } from '@shared/utils/dom';
import { createLogger } from '@shared/utils/logger';
import ProtectionOverlay from './ProtectionOverlay.svelte';

const logger = createLogger('ProtectionOverlayManager');

interface ActiveProtection {
  warningId: string;
  protectionType: ProtectionType;
  container: HTMLDivElement | null;
  component: ProtectionOverlay | null;
  videoElement: HTMLVideoElement | null;
  originalMuted: boolean;
  originalVolume: number;
}

export class ProtectionOverlayManager {
  private provider: IStreamingProvider;
  private activeProtections: Map<string, ActiveProtection> = new Map();

  constructor(provider: IStreamingProvider) {
    this.provider = provider;
  }

  /**
   * Apply protection for a warning
   */
  applyProtection(
    warningId: string,
    protectionType: ProtectionType,
    categoryName: string = '',
    warningDescription: string = ''
  ): void {
    // Skip if no protection needed
    if (protectionType === 'none') {
      return;
    }

    // Don't apply twice
    if (this.activeProtections.has(warningId)) {
      logger.warn(`Protection already active for warning ${warningId}`);
      return;
    }

    logger.info(`Applying protection: ${protectionType} for warning ${warningId}`);

    const videoElement = this.provider.getVideoElement();
    if (!videoElement) {
      logger.error('No video element found');
      return;
    }

    const protection: ActiveProtection = {
      warningId,
      protectionType,
      container: null,
      component: null,
      videoElement,
      originalMuted: videoElement.muted,
      originalVolume: videoElement.volume,
    };

    // Apply blackout overlay
    if (protectionType === 'blackout' || protectionType === 'both') {
      this.applyBlackout(protection, categoryName, warningDescription);
    }

    // Apply mute
    if (protectionType === 'mute' || protectionType === 'both') {
      this.applyMute(protection);
    }

    this.activeProtections.set(warningId, protection);
  }

  /**
   * Apply blackout overlay
   */
  private applyBlackout(
    protection: ActiveProtection,
    categoryName: string,
    warningDescription: string
  ): void {
    try {
      // Create container for overlay
      protection.container = createContainer(
        'tw-protection-container',
        'tw-protection-root'
      );

      // Get video container or video element parent
      const videoElement = protection.videoElement;
      if (!videoElement || !videoElement.parentElement) {
        logger.error('Cannot find video parent element');
        return;
      }

      // Inject overlay relative to video element
      // Position it as a sibling to ensure it covers the video
      const videoParent = videoElement.parentElement;
      videoParent.style.position = 'relative'; // Ensure parent is positioned

      // Style container to cover video
      protection.container.style.position = 'absolute';
      protection.container.style.top = '0';
      protection.container.style.left = '0';
      protection.container.style.width = '100%';
      protection.container.style.height = '100%';
      protection.container.style.zIndex = '999999';

      videoParent.appendChild(protection.container);

      // Mount Svelte component
      protection.component = new ProtectionOverlay({
        target: protection.container,
        props: {
          protectionType: protection.protectionType,
          categoryName,
          warningDescription,
        },
      });

      logger.info('Blackout overlay applied');
    } catch (error) {
      logger.error('Failed to apply blackout overlay:', error);
    }
  }

  /**
   * Apply audio mute
   */
  private applyMute(protection: ActiveProtection): void {
    try {
      if (protection.videoElement) {
        protection.videoElement.muted = true;
        // Also reduce volume to ensure no sound
        protection.videoElement.volume = 0;
        logger.info('Audio muted');
      }
    } catch (error) {
      logger.error('Failed to mute audio:', error);
    }
  }

  /**
   * Remove protection for a warning
   */
  removeProtection(warningId: string): void {
    const protection = this.activeProtections.get(warningId);
    if (!protection) {
      return;
    }

    logger.info(`Removing protection for warning ${warningId}`);

    // Remove blackout overlay
    if (protection.component) {
      protection.component.$destroy();
      protection.component = null;
    }

    if (protection.container && protection.container.parentNode) {
      protection.container.parentNode.removeChild(protection.container);
      protection.container = null;
    }

    // Restore audio state
    if (protection.videoElement) {
      // Only restore if we actually muted it
      if (protection.protectionType === 'mute' || protection.protectionType === 'both') {
        protection.videoElement.muted = protection.originalMuted;
        protection.videoElement.volume = protection.originalVolume;
        logger.info('Audio state restored');
      }
    }

    this.activeProtections.delete(warningId);
  }

  /**
   * Remove all protections
   */
  removeAllProtections(): void {
    logger.info('Removing all protections');
    const warningIds = Array.from(this.activeProtections.keys());
    warningIds.forEach((id) => this.removeProtection(id));
  }

  /**
   * Check if a warning has active protection
   */
  hasProtection(warningId: string): boolean {
    return this.activeProtections.has(warningId);
  }

  /**
   * Get active protection count
   */
  getActiveCount(): number {
    return this.activeProtections.size;
  }

  /**
   * Clean up
   */
  dispose(): void {
    logger.info('Disposing protection overlay manager...');
    this.removeAllProtections();
  }
}
