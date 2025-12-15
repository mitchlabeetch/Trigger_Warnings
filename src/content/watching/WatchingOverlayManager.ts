/**
 * WATCHING OVERLAY MANAGER
 *
 * Manages the watching overlay during video playback.
 * Responsible for:
 * - Displaying the persistent overlay with status indicator
 * - Showing warning banners before triggers
 * - Managing protection modes (blackout, mute, skip)
 * - Handling quick actions (ignore, skip)
 * - Tracking overlay position across sessions
 */

import type { IStreamingProvider } from '@shared/types/Provider.types';
import type { Warning, TriggerCategory, ActiveWarning } from '@shared/types/Warning.types';
import type {
  WatchingStatus,
  MediaTriggerData,
  TimestampEntry,
} from '@shared/types/MediaContent.types';
import type { Profile, ProtectionType } from '@shared/types/Profile.types';
import { createContainer, injectContainer } from '@shared/utils/dom';
import { createLogger } from '@shared/utils/logger';
import browser from 'webextension-polyfill';
import WatchingOverlay from './WatchingOverlay.svelte';
import TriggerSubmissionForm from './TriggerSubmissionForm.svelte';

const logger = createLogger('WatchingOverlayManager');

/**
 * Stored overlay position
 */
interface OverlayPosition {
  x: number;
  y: number;
}

/**
 * Warning state for countdown display
 */
interface PendingWarning {
  warning: Warning;
  startTime: number;
  announced: boolean;
}

/**
 * Callbacks for overlay actions
 */
interface OverlayCallbacks {
  onIgnoreThisTime?: (warningId: string) => void;
  onIgnoreForVideo?: (category: TriggerCategory) => void;
  onSkipToEnd?: (warning: Warning) => void;
  onAddTrigger?: () => void;
  onVote?: (warningId: string, voteType: 'up' | 'down') => void;
}

/**
 * WatchingOverlayManager
 * Manages the watching overlay and warning display during playback
 */
export class WatchingOverlayManager {
  private provider: IStreamingProvider;
  private container: HTMLDivElement | null = null;
  private component: WatchingOverlay | null = null;
  private submissionFormComponent: TriggerSubmissionForm | null = null;
  private isInitialized = false;

  // Trigger data
  private triggerData: MediaTriggerData | null = null;
  private timestamps: TimestampEntry[] = [];
  private status: WatchingStatus = 'unprotected';

  // Profile settings
  private protectionType: ProtectionType = 'warn';
  private helperMode = false;
  private warningLeadTime = 10; // seconds before trigger to show warning
  private fadeOutDelay = 5000; // 5 seconds before overlay hides

  // Position (persisted)
  private position: OverlayPosition = { x: 20, y: 20 };

  // Active warning tracking
  private activeWarning: Warning | null = null;
  private countdownSeconds = 0;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private pendingWarnings: Map<string, PendingWarning> = new Map();
  private ignoredWarningsThisSession: Set<string> = new Set();
  private ignoredCategoriesThisVideo: Set<TriggerCategory> = new Set();

  // Original video state for protection
  private originalVolume = 1;
  private wasProtectionApplied = false;

  // Player bounds and fullscreen tracking
  private playerBounds: DOMRect | null = null;
  private isFullscreen = false;
  private boundsObserver: ResizeObserver | null = null;
  private fullscreenCleanup: (() => void) | null = null;

  // Callbacks
  private callbacks: OverlayCallbacks = {};

  constructor(provider: IStreamingProvider) {
    this.provider = provider;
  }

  /**
   * Initialize the watching overlay
   */
  async initialize(triggerData: MediaTriggerData): Promise<void> {
    if (this.isInitialized) {
      logger.warn('WatchingOverlayManager already initialized');
      return;
    }

    logger.info('Initializing WatchingOverlayManager...');

    this.triggerData = triggerData;
    this.timestamps = triggerData.timestampTriggers;

    // Determine status based on trigger data
    this.status = this.determineStatus();

    // Load profile settings
    await this.loadProfileSettings();

    // Load saved position
    await this.loadPosition();

    // Create and mount overlay
    this.createOverlay();

    this.isInitialized = true;
    logger.info('WatchingOverlayManager initialized with status:', this.status);
  }

  /**
   * Determine watching status based on trigger data
   */
  private determineStatus(): WatchingStatus {
    if (this.helperMode) return 'reviewing';
    if (!this.triggerData?.hasAnyData) return 'unprotected';
    if (this.triggerData.hasTimestamps) return 'protected';
    if (this.triggerData.hasOverallTriggers) return 'overall-only';
    return 'unprotected';
  }

  /**
   * Load profile settings from storage
   */
  private async loadProfileSettings(): Promise<void> {
    try {
      const response = await browser.runtime.sendMessage({
        type: 'GET_ACTIVE_PROFILE',
      });

      if (response.success && response.data) {
        const profile: Profile = response.data;
        this.protectionType = profile.defaultProtection || 'warn';
        this.helperMode = profile.helperMode || false;
        this.warningLeadTime = profile.display?.warningLeadTime ?? 10;

        // Update status if helper mode changed
        this.status = this.determineStatus();

        logger.debug('Profile settings loaded:', {
          protectionType: this.protectionType,
          helperMode: this.helperMode,
          warningLeadTime: this.warningLeadTime,
        });
      }
    } catch (error) {
      logger.error('Failed to load profile settings:', error);
    }
  }

  /**
   * Load saved overlay position
   */
  private async loadPosition(): Promise<void> {
    try {
      const result = await browser.storage.local.get('overlayPosition');
      if (result.overlayPosition) {
        this.position = result.overlayPosition;
        logger.debug('Loaded overlay position:', this.position);
      }
    } catch (error) {
      logger.error('Failed to load overlay position:', error);
    }
  }

  /**
   * Save overlay position
   */
  private async savePosition(position: OverlayPosition): Promise<void> {
    this.position = position;
    try {
      await browser.storage.local.set({ overlayPosition: position });
      logger.debug('Saved overlay position:', position);
    } catch (error) {
      logger.error('Failed to save overlay position:', error);
    }
  }

  /**
   * Create and mount the overlay component
   */
  private createOverlay(): void {
    // Create container
    this.container = createContainer('tw-watching-container', 'tw-watching-root');

    // Inject into player container or body
    const injectionPoint = this.provider.getInjectionPoint() || document.body;
    injectContainer(this.container, injectionPoint);
    logger.debug('Watching overlay container injected');

    // Start player bounds tracking
    this.startBoundsTracking(injectionPoint);

    // Start fullscreen tracking
    this.startFullscreenTracking();

    // Mount Svelte component with player bounds awareness
    this.component = new WatchingOverlay({
      target: this.container,
      props: {
        status: this.status,
        activeWarning: null,
        countdownSeconds: 0,
        isExpanded: false,
        position: this.position,
        protectionType: this.protectionType,
        helperMode: this.helperMode,
        playerBounds: this.playerBounds,
        isFullscreen: this.isFullscreen,
        fadeOutDelay: this.fadeOutDelay,
        onAddTrigger: () => this.handleAddTrigger(),
        onIgnoreThisTime: (id: string) => this.handleIgnoreThisTime(id),
        onIgnoreAllVideo: (cat: TriggerCategory) => this.handleIgnoreForVideo(cat),
        onSkipToEnd: (w: Warning) => this.handleSkipToEnd(w),
        onPositionChange: (pos: OverlayPosition) => this.savePosition(pos),
      },
    });

    // Listen for component events
    this.component.$on('addTrigger', () => this.handleAddTrigger());
    this.component.$on('ignoreThisTime', (e) => this.handleIgnoreThisTime(e.detail));
    this.component.$on('ignoreAllVideo', (e) => this.handleIgnoreForVideo(e.detail));
    this.component.$on('skipToEnd', (e) => this.handleSkipToEnd(e.detail));
    this.component.$on('positionChange', (e) => this.savePosition(e.detail));
    this.component.$on('protectionStart', () => this.applyProtection());

    // AGGRESSIVE: Add capture-phase event listeners to ensure our overlay receives events
    // before the streaming player can intercept them
    this.addEventCapture();

    logger.info('Watching overlay component mounted');
  }

  /**
   * Add capture-phase event listeners to ensure overlay receives events
   * This prevents streaming players from capturing/blocking our events
   */
  private addEventCapture(): void {
    if (!this.container) return;

    // Block events from propagating to player when they hit our interactive elements
    const captureEvents = [
      'click',
      'mousedown',
      'mouseup',
      'pointerdown',
      'pointerup',
      'touchstart',
      'touchend',
    ];

    captureEvents.forEach((eventType) => {
      this.container!.addEventListener(
        eventType,
        (e: Event) => {
          const target = e.target as HTMLElement;
          // Only stop propagation if clicking on an interactive element within our overlay
          if (
            target.closest('.watching-overlay, .warning-banner, .action-btn, .quick-action-btn')
          ) {
            e.stopPropagation();
          }
        },
        { capture: true }
      );
    });

    // Ensure pointer events reach our elements by capturing at document level
    // and re-dispatching to our overlay if they're within bounds
    const overlayElement = this.container.querySelector('.watching-overlay');
    if (overlayElement) {
      // Force pointer-events on the overlay element directly via JS
      (overlayElement as HTMLElement).style.setProperty('pointer-events', 'auto', 'important');
      (overlayElement as HTMLElement).style.setProperty(
        'touch-action',
        'manipulation',
        'important'
      );
    }
  }

  /**
   * Start tracking player container bounds using ResizeObserver
   */
  private startBoundsTracking(playerContainer: HTMLElement): void {
    // Get initial bounds
    this.playerBounds = playerContainer.getBoundingClientRect();

    // Create ResizeObserver to track changes
    this.boundsObserver = new ResizeObserver(() => {
      this.playerBounds = playerContainer.getBoundingClientRect();
      this.updateOverlay();
    });

    this.boundsObserver.observe(playerContainer);
    logger.debug('Player bounds tracking started');
  }

  /**
   * Start tracking fullscreen state
   */
  private startFullscreenTracking(): void {
    const handleFullscreenChange = () => {
      this.isFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );
      this.updateOverlay();
      logger.debug('Fullscreen state changed:', this.isFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    // Store cleanup function
    this.fullscreenCleanup = () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }

  /**
   * Update the overlay with current state
   */
  private updateOverlay(): void {
    if (!this.component) return;

    this.component.$set({
      status: this.status,
      activeWarning: this.activeWarning,
      countdownSeconds: this.countdownSeconds,
      protectionType: this.protectionType,
      helperMode: this.helperMode,
      playerBounds: this.playerBounds,
      isFullscreen: this.isFullscreen,
    });
  }

  /**
   * Check for upcoming warnings at current playback time
   * This should be called periodically during playback
   */
  checkWarnings(currentTime: number): void {
    if (!this.isInitialized || this.status !== 'protected') return;

    for (const timestamp of this.timestamps) {
      const warningId = timestamp.id;

      // Skip if already ignored
      if (this.ignoredWarningsThisSession.has(warningId)) continue;
      if (this.ignoredCategoriesThisVideo.has(timestamp.category)) continue;

      const timeUntilStart = timestamp.start_time - currentTime;
      const isApproaching = timeUntilStart > 0 && timeUntilStart <= this.warningLeadTime;
      const isActive = currentTime >= timestamp.start_time && currentTime <= timestamp.end_time;

      if (isApproaching && !this.pendingWarnings.has(warningId)) {
        // New warning approaching
        this.announceWarning(timestamp, timeUntilStart);
      } else if (isActive && !this.activeWarning) {
        // Warning is now active
        this.activateWarning(timestamp);
      } else if (this.activeWarning?.id === warningId && currentTime > timestamp.end_time) {
        // Warning ended
        this.endWarning();
      }
    }

    // Update countdown for pending warning
    if (this.activeWarning && this.countdownSeconds > 0) {
      const timestamp = this.timestamps.find((t) => t.id === this.activeWarning!.id);
      if (timestamp) {
        const newCountdown = Math.ceil(timestamp.start_time - currentTime);
        if (newCountdown !== this.countdownSeconds && newCountdown >= 0) {
          this.countdownSeconds = Math.max(0, newCountdown);
          this.updateOverlay();
        }
      }
    }
  }

  /**
   * Announce an upcoming warning
   */
  private announceWarning(timestamp: TimestampEntry, timeUntil: number): void {
    logger.info('Warning approaching:', timestamp.category, 'in', timeUntil, 'seconds');

    // Convert timestamp to Warning format
    const warning: Warning = {
      id: timestamp.id,
      videoId: timestamp.media_id,
      categoryKey: timestamp.category,
      startTime: timestamp.start_time,
      endTime: timestamp.end_time,
      status: 'approved',
      score: timestamp.vote_score,
      confidenceLevel: timestamp.is_verified ? 100 : 50,
      requiresModeration: false,
      description: timestamp.description,
      createdAt: timestamp.created_at,
      updatedAt: timestamp.updated_at,
    };

    this.activeWarning = warning;
    this.countdownSeconds = Math.ceil(timeUntil);
    this.pendingWarnings.set(timestamp.id, {
      warning,
      startTime: timestamp.start_time,
      announced: true,
    });

    this.updateOverlay();
  }

  /**
   * Activate protection for a warning (trigger time reached)
   */
  private activateWarning(timestamp: TimestampEntry): void {
    logger.info('Warning active:', timestamp.category);

    this.countdownSeconds = 0;
    this.applyProtection();
    this.updateOverlay();
  }

  /**
   * End the current warning
   */
  private endWarning(): void {
    if (!this.activeWarning) return;

    logger.info('Warning ended:', this.activeWarning.categoryKey);

    this.pendingWarnings.delete(this.activeWarning.id);
    this.activeWarning = null;
    this.countdownSeconds = 0; // Bug 4 Fix: ensure reset
    this.removeProtection();
    this.updateOverlay();
  }

  /**
   * Apply protection based on type
   */
  private applyProtection(): void {
    if (this.wasProtectionApplied) return;

    const video = this.provider.getVideoElement();
    if (!video) return;

    logger.info('Applying protection:', this.protectionType);

    switch (this.protectionType) {
      case 'mute':
        this.originalVolume = video.volume;
        video.muted = true;
        break;

      case 'hide':
        video.style.opacity = '0';
        break;

      case 'mute-and-hide':
        this.originalVolume = video.volume;
        video.muted = true;
        video.style.opacity = '0';
        break;

      case 'skip':
        if (this.activeWarning) {
          video.currentTime = this.activeWarning.endTime + 1;
        }
        break;

      case 'warn':
      default:
        // Just show warning, no additional action
        break;
    }

    this.wasProtectionApplied = true;
  }

  /**
   * Remove protection after warning ends
   */
  private removeProtection(): void {
    if (!this.wasProtectionApplied) return;

    const video = this.provider.getVideoElement();
    if (!video) return;

    logger.info('Removing protection');

    switch (this.protectionType) {
      case 'mute':
        video.muted = false;
        video.volume = this.originalVolume;
        break;

      case 'hide':
        video.style.opacity = '1';
        break;

      case 'mute-and-hide':
        video.muted = false;
        video.volume = this.originalVolume;
        video.style.opacity = '1';
        break;

      case 'skip':
      case 'warn':
      default:
        // Nothing to undo
        break;
    }

    this.wasProtectionApplied = false;
  }

  /**
   * Handle add trigger button click
   */
  private handleAddTrigger(): void {
    logger.info('Add trigger clicked');

    const video = this.provider.getVideoElement();
    const currentTime = video?.currentTime || 0;
    const duration = video?.duration || 0;

    // Check if we are in fullscreen and exit if needed (optional)
    // Or just overlay the form. Since the form is in the same container,
    // and we handle fullscreen events, it should display correctly on top.

    // If form is already open, do nothing
    if (this.submissionFormComponent) {
        return;
    }

    if (!this.container) return;

    // Mount submission form
    this.submissionFormComponent = new TriggerSubmissionForm({
      target: this.container,
      props: {
        currentTime,
        duration,
      },
    });

    // Handle events
    this.submissionFormComponent.$on('submit', (e) => this.handleSubmitTrigger(e.detail));
    this.submissionFormComponent.$on('cancel', () => this.handleCancelTrigger());

    // Pause video while adding trigger
    if (video && !video.paused) {
      video.pause();
    }

    // UI 5: Feedback Toast (Handled inside WatchingOverlay component if extended, or here)
    // For now we rely on the button animation, but we could show a toast.
    // WatchingOverlay.svelte should probably handle the toast display if triggered.

    this.callbacks.onAddTrigger?.();
  }

  /**
   * Handle submission of new trigger
   */
  private async handleSubmitTrigger(data: any): Promise<void> {
    logger.info('Submitting new trigger:', data);

    try {
      const { categoryKey, startTime, endTime, description } = data;

      const submission = {
          videoId: this.triggerData?.media?.internal_id || this.triggerData?.media?.id, // Use internal_id if available (UUID) or provider ID
          platform: this.provider.name.toLowerCase(),
          categoryKey,
          startTime,
          endTime,
          description,
          confidence: 100 // User manual submission
      };

      // Send to background
      await browser.runtime.sendMessage({
        type: 'SUBMIT_TRIGGER',
        data: submission
      });

      // Show success feedback (TODO: Add toast or notification)
      logger.info('Trigger submitted successfully');

    } catch (error) {
      logger.error('Failed to submit trigger:', error);
    } finally {
      this.handleCancelTrigger();
    }
  }

  /**
   * Close submission form
   */
  private handleCancelTrigger(): void {
    if (this.submissionFormComponent) {
      this.submissionFormComponent.$destroy();
      this.submissionFormComponent = null;
    }
  }

  /**
   * Handle ignore this time action
   */
  private handleIgnoreThisTime(warningId: string): void {
    logger.info('Ignoring warning for this time:', warningId);

    this.ignoredWarningsThisSession.add(warningId);

    if (this.activeWarning?.id === warningId) {
      this.endWarning();
    }

    this.callbacks.onIgnoreThisTime?.(warningId);
  }

  /**
   * Handle ignore for video action
   */
  private handleIgnoreForVideo(category: TriggerCategory): void {
    logger.info('Ignoring category for video:', category);

    this.ignoredCategoriesThisVideo.add(category);

    if (this.activeWarning?.categoryKey === category) {
      this.endWarning();
    }

    // Remove all pending warnings of this category
    for (const [id, pending] of this.pendingWarnings) {
      if (pending.warning.categoryKey === category) {
        this.pendingWarnings.delete(id);
      }
    }

    this.callbacks.onIgnoreForVideo?.(category);
  }

  /**
   * Handle skip to end action
   */
  private handleSkipToEnd(warning: Warning): void {
    logger.info('Skipping to end of warning:', warning.id);

    const video = this.provider.getVideoElement();
    if (video) {
      video.currentTime = warning.endTime + 1;
    }

    this.endWarning();
    this.callbacks.onSkipToEnd?.(warning);
  }

  /**
   * Register callbacks for overlay actions
   */
  setCallbacks(callbacks: OverlayCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Update trigger data (e.g., after submitting new trigger)
   */
  updateTriggerData(triggerData: MediaTriggerData): void {
    this.triggerData = triggerData;
    this.timestamps = triggerData.timestampTriggers;
    this.status = this.determineStatus();
    this.updateOverlay();
  }

  /**
   * Update status
   */
  setStatus(status: WatchingStatus): void {
    this.status = status;
    this.updateOverlay();
  }

  /**
   * Set helper mode
   */
  setHelperMode(enabled: boolean): void {
    this.helperMode = enabled;
    this.status = this.determineStatus();
    this.updateOverlay();
  }

  /**
   * Check if overlay is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current active warning
   */
  getActiveWarning(): Warning | null {
    return this.activeWarning;
  }

  /**
   * Get current status
   */
  getStatus(): WatchingStatus {
    return this.status;
  }

  /**
   * Show the overlay
   */
  show(): void {
    if (this.container) {
      this.container.style.display = 'block';
    }
  }

  /**
   * Hide the overlay
   */
  hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /**
   * Dispose of the manager
   */
  dispose(): void {
    logger.info('Disposing WatchingOverlayManager...');

    // Stop countdown
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    // Remove protection
    this.removeProtection();

    // Clean up bounds observer
    if (this.boundsObserver) {
      this.boundsObserver.disconnect();
      this.boundsObserver = null;
    }

    // Clean up fullscreen listener
    if (this.fullscreenCleanup) {
      this.fullscreenCleanup();
      this.fullscreenCleanup = null;
    }

    // Destroy component
    if (this.component) {
      this.component.$destroy();
      this.component = null;
    }

    // Destroy submission form if open
    if (this.submissionFormComponent) {
      this.submissionFormComponent.$destroy();
      this.submissionFormComponent = null;
    }

    // Remove container
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }

    // Clear state
    this.triggerData = null;
    this.timestamps = [];
    this.activeWarning = null;
    this.pendingWarnings.clear();
    this.ignoredWarningsThisSession.clear();
    this.ignoredCategoriesThisVideo.clear();
    this.isInitialized = false;
    this.playerBounds = null;

    logger.info('WatchingOverlayManager disposed');
  }
}
