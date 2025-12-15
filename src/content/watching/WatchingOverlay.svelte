<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { fade, fly, slide, scale } from 'svelte/transition';
  import { quintOut, backOut, elasticOut } from 'svelte/easing';
  import type { Warning, TriggerCategory } from '@shared/types/Warning.types';
  import type { WatchingStatus } from '@shared/types/MediaContent.types';
  import type { ProtectionType } from '@shared/types/Profile.types';
  import { TRIGGER_CATEGORIES } from '@shared/constants/categories';

  // Props
  export let status: WatchingStatus = 'unprotected';
  export let activeWarning: Warning | null = null;
  export let countdownSeconds: number = 0;
  export let isExpanded: boolean = false;
  export let position: { x: number; y: number } = { x: 20, y: 20 };
  export let protectionType: ProtectionType = 'warn';
  export let helperMode: boolean = false;

  // Player bounds awareness (for embed vs fullscreen)
  export let playerBounds: DOMRect | null = null;
  export let isFullscreen: boolean = false;

  // Mouse activity visibility settings - 5 seconds
  export let fadeOutDelay: number = 5000;
  export let buttonColor: string = '#8b5cf6';
  export let buttonOpacity: number = 0.45;

  // Callbacks
  export let onAddTrigger: () => void = () => {};
  export let onIgnoreThisTime: (warningId: string) => void = () => {};
  export let onIgnoreAllVideo: (category: TriggerCategory) => void = () => {};
  export let onSkipToEnd: (warning: Warning) => void = () => {};
  export let onPositionChange: (pos: { x: number; y: number }) => void = () => {};

  const dispatch = createEventDispatcher();

  // State
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let overlayRef: HTMLDivElement | null = null;
  let isHovering = false;
  let showWarningBanner = false;
  let isProtectionActive = false;
  // UI 5: Feedback Toast State
  let showToast = false;
  let toastMessage = '';
  let toastTimeout: number | null = null;

  // Mouse activity visibility state
  let isMouseActive = true;
  let mouseActivityTimeout: ReturnType<typeof setTimeout> | null = null;

  // Computed
  $: statusText = getStatusText(status);
  $: statusIcon = getStatusIcon(status);
  $: shouldShowExpanded = isExpanded || isHovering;
  $: categoryInfo = activeWarning ? TRIGGER_CATEGORIES[activeWarning.categoryKey] : null;

  // Visibility: show when mouse active, hovering, or warning banner visible
  $: isOverlayVisible = isMouseActive || isHovering || showWarningBanner || isDragging || showToast;

  // Dynamic opacity based on hover state
  $: overlayOpacity = isHovering ? 1 : buttonOpacity;

  // Watch for active warning changes
  $: if (activeWarning && countdownSeconds > 0) {
    showWarningBanner = true;
  } else if (!activeWarning) {
    showWarningBanner = false;
    isProtectionActive = false;
  }

  function getStatusText(s: WatchingStatus): string {
    switch (s) {
      case 'protected':
        return 'Protected';
      case 'overall-only':
        return 'Limited';
      case 'unprotected':
        return 'Not Covered';
      case 'reviewing':
        return 'Helper';
      default:
        return '';
    }
  }

  function getStatusIcon(s: WatchingStatus): string {
    switch (s) {
      case 'protected':
        return '🛡️';
      case 'overall-only':
        return '◐';
      case 'unprotected':
        return '○';
      case 'reviewing':
        return '👁️';
      default:
        return '';
    }
  }

  // Mouse activity handlers - work in both embedded and fullscreen
  function handleMouseActivity() {
    isMouseActive = true;
    resetMouseActivityTimer();
  }

  function resetMouseActivityTimer() {
    if (mouseActivityTimeout) {
      clearTimeout(mouseActivityTimeout);
    }
    mouseActivityTimeout = setTimeout(() => {
      if (!isHovering && !isDragging) {
        isMouseActive = false;
      }
    }, fadeOutDelay);
  }

  // Attach mouse listeners to multiple targets for robust fullscreen detection
  function attachMouseListeners() {
    const targets = [window, document, document.documentElement];
    targets.forEach((target) => {
      target.addEventListener('mousemove', handleMouseActivity, { passive: true, capture: true });
      target.addEventListener('pointermove', handleMouseActivity, { passive: true, capture: true });
    });
    // Also listen for keyboard activity
    document.addEventListener('keydown', handleMouseActivity, { passive: true, capture: true });
  }

  function detachMouseListeners() {
    const targets = [window, document, document.documentElement];
    targets.forEach((target) => {
      target.removeEventListener('mousemove', handleMouseActivity);
      target.removeEventListener('pointermove', handleMouseActivity);
    });
    document.removeEventListener('keydown', handleMouseActivity);
  }

  function handleOverlayMouseEnter() {
    isHovering = true;
    if (mouseActivityTimeout) {
      clearTimeout(mouseActivityTimeout);
    }
  }

  function handleOverlayMouseLeave() {
    isHovering = false;
    resetMouseActivityTimer();
  }

  // Drag handlers
  function handleDragStart(e: MouseEvent | TouchEvent) {
    if (!overlayRef) return;

    isDragging = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragStart = {
      x: clientX - position.x,
      y: clientY - position.y,
    };

    e.preventDefault();
  }

  function handleDragMove(e: MouseEvent | TouchEvent) {
    if (!isDragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;

    // Constrain to viewport
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 40;

    position = {
      x: Math.max(10, Math.min(newX, maxX)),
      y: Math.max(10, Math.min(newY, maxY)),
    };
  }

  function handleDragEnd() {
    if (isDragging) {
      isDragging = false;
      onPositionChange(position);
      dispatch('positionChange', position);
    }
  }

  // Action handlers
  function handleAddTrigger() {
    dispatch('addTrigger');
    onAddTrigger();
    // UI 5: Show feedback toast
    showToastMessage('Timestamp saved! Open popup to finish.');
  }

  function showToastMessage(msg: string) {
    toastMessage = msg;
    showToast = true;
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => {
      showToast = false;
    }, 3000);
  }

  function handleIgnoreThisTime() {
    if (activeWarning) {
      dispatch('ignoreThisTime', activeWarning.id);
      onIgnoreThisTime(activeWarning.id);
    }
  }

  function handleIgnoreAllVideo() {
    if (activeWarning) {
      dispatch('ignoreAllVideo', activeWarning.categoryKey);
      onIgnoreAllVideo(activeWarning.categoryKey);
    }
  }

  function handleSkipToEnd() {
    if (activeWarning) {
      dispatch('skipToEnd', activeWarning);
      onSkipToEnd(activeWarning);
    }
  }

  function handleProtectionStart() {
    isProtectionActive = true;
    showWarningBanner = false;
    dispatch('protectionStart');
  }

  // Lifecycle
  onMount(() => {
    // Drag event listeners
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove);
    window.addEventListener('touchend', handleDragEnd);

    // Mouse activity listeners for visibility - robust detection for fullscreen
    attachMouseListeners();

    // Start initial activity timer
    handleMouseActivity();
  });

  onDestroy(() => {
    // Clean up drag listeners
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
    window.removeEventListener('touchmove', handleDragMove);
    window.removeEventListener('touchend', handleDragEnd);

    // Clean up mouse activity listeners
    detachMouseListeners();

    // Clear any pending timers
    if (mouseActivityTimeout) {
      clearTimeout(mouseActivityTimeout);
    }
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
  });
</script>

<!-- Main Overlay Container - Flat Island Design -->
{#if isOverlayVisible}
  <div
    class="watching-overlay"
    class:dragging={isDragging}
    class:expanded={shouldShowExpanded}
    class:helper-mode={helperMode}
    class:fullscreen={isFullscreen}
    style="left: {position.x}px; top: {position.y}px; opacity: {overlayOpacity}; --tw-button-color: {buttonColor};"
    transition:fade={{ duration: 250 }}
    bind:this={overlayRef}
    on:mouseenter={handleOverlayMouseEnter}
    on:mouseleave={handleOverlayMouseLeave}
    on:click|stopPropagation
    on:mousedown|stopPropagation
    role="region"
    aria-label="Trigger Warnings Overlay"
  >
    <!-- Drag Handle (only on hover) UI 10: Always visible on hover for better affordance -->
    {#if shouldShowExpanded}
      <div
        class="drag-handle"
        on:mousedown|stopPropagation={handleDragStart}
        on:touchstart|stopPropagation={handleDragStart}
        title="Drag to move"
        in:fade={{ duration: 150, delay: 100 }}
      >
        <!-- Improved drag icon (6 dots grid) -->
        <svg viewBox="0 0 12 12" class="drag-icon">
          <circle cx="3" cy="3" r="1.2" fill="currentColor" opacity="0.6" />
          <circle cx="9" cy="3" r="1.2" fill="currentColor" opacity="0.6" />
          <circle cx="3" cy="6" r="1.2" fill="currentColor" opacity="0.6" />
          <circle cx="9" cy="6" r="1.2" fill="currentColor" opacity="0.6" />
          <circle cx="3" cy="9" r="1.2" fill="currentColor" opacity="0.6" />
          <circle cx="9" cy="9" r="1.2" fill="currentColor" opacity="0.6" />
        </svg>
      </div>
    {/if}

    <!-- Compact State: Status Dot + TW Label -->
    <div
      class="island-core"
      on:mousedown|stopPropagation={handleDragStart}
      on:touchstart|stopPropagation={handleDragStart}
      role="button"
      tabindex="0"
      aria-label="Trigger Warnings Active"
    >
      <span
        class="status-dot"
        class:protected={status === 'protected'}
        class:partial={status === 'overall-only'}
        class:unprotected={status === 'unprotected'}
      ></span>
      <span class="tw-label">TW</span>
    </div>

    <!-- Expanded Toolbox (liquid expand on hover) -->
    {#if shouldShowExpanded}
      <div class="toolbox" in:slide={{ duration: 200, axis: 'x' }}>
        <span class="status-divider">•</span>
        <span class="status-text">{statusText}</span>

        <!-- Add Trigger Button -->
        <button
          class="action-btn add-trigger"
          on:click={handleAddTrigger}
          title="Add a trigger timestamp"
        >
          <span class="btn-icon">+</span>
        </button>

        {#if helperMode}
          <span class="helper-badge">Helper</span>
        {/if}
      </div>
    {/if}

    <!-- UI 5: Feedback Toast inside overlay -->
    {#if showToast}
      <div class="mini-toast" in:fly={{ y: 10, duration: 200 }} out:fade>
        {toastMessage}
      </div>
    {/if}
  </div>
{/if}

<!-- Warning Banner (shows when trigger is approaching) -->
{#if showWarningBanner && activeWarning && categoryInfo}
  <div
    class="warning-banner"
    class:fullscreen={isFullscreen}
    in:fly={{ y: -50, duration: 400, easing: backOut }}
    out:fade={{ duration: 200 }}
  >
    <div class="warning-content">
      <!-- Countdown -->
      <div class="countdown-section">
        <div class="countdown-ring">
          <svg viewBox="0 0 36 36" class="countdown-svg">
            <path
              class="countdown-bg"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              class="countdown-progress"
              stroke-dasharray="{(countdownSeconds / 10) * 100}, 100"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span class="countdown-number">{countdownSeconds}</span>
        </div>
      </div>

      <!-- Warning Info -->
      <div class="warning-info">
        <div class="warning-header">
          <span class="warning-icon">{categoryInfo.icon}</span>
          <span class="warning-title">{categoryInfo.name}</span>
        </div>
        <p class="warning-subtitle">Trigger warning in {countdownSeconds}s</p>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button
          class="quick-action-btn ignore-once"
          on:click={handleIgnoreThisTime}
          title="Ignore this occurrence"
        >
          Ignore
        </button>
        <button
          class="quick-action-btn ignore-all"
          on:click={handleIgnoreAllVideo}
          title="Ignore all {categoryInfo.name} warnings in this video"
        >
          Ignore All
        </button>
        <button
          class="quick-action-btn skip-now"
          on:click={handleSkipToEnd}
          title="Skip to after this trigger"
        >
          Skip →
        </button>
      </div>
    </div>

    <!-- Protection Mode Label -->
    <div class="protection-label">
      {#if protectionType === 'hide'}
        🖤 Screen will black out
      {:else if protectionType === 'mute'}
        🔇 Audio will mute
      {:else if protectionType === 'mute-and-hide'}
        🖤🔇 Screen + audio protection
      {:else if protectionType === 'skip'}
        ⏭️ Will skip automatically
      {:else}
        ⚠️ Warning only
      {/if}
    </div>
  </div>
{/if}

<!-- Protection Overlay (when trigger is active) -->
{#if isProtectionActive && (protectionType === 'hide' || protectionType === 'mute-and-hide')}
  <div
    class="protection-overlay"
    class:fullscreen={isFullscreen}
    in:fade={{ duration: 300 }}
    out:fade={{ duration: 500 }}
  >
    <div class="protection-content" in:scale={{ duration: 400, delay: 100, easing: elasticOut }}>
      <span class="protection-icon">🛡️</span>
      <p class="protection-text">Content temporarily hidden for your safety</p>
      {#if activeWarning && categoryInfo}
        <p class="protection-category">{categoryInfo.name}</p>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* ==========================================
     FLAT ISLAND OVERLAY - Glassmorphic Design
     ========================================== */
  .watching-overlay {
    position: absolute !important;
    z-index: 2147483647 !important;
    display: flex;
    align-items: center;
    gap: 0;
    height: 28px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    pointer-events: auto !important;
    user-select: none;

    /* AGGRESSIVE: Ensure interaction priority over streaming players */
    touch-action: manipulation !important;
    cursor: pointer !important;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;

    /* Glassmorphic styling */
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 14px;
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);

    /* Liquid transition for expansion */
    transition:
      width 0.4s cubic-bezier(0.23, 1, 0.32, 1),
      opacity 0.3s ease,
      transform 0.2s ease,
      box-shadow 0.3s ease;
  }

  .watching-overlay.fullscreen {
    position: fixed !important;
  }

  .watching-overlay:hover {
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      0 0 20px rgba(139, 92, 246, 0.15);
  }

  .watching-overlay.dragging {
    cursor: grabbing;
    transform: scale(1.02);
    box-shadow:
      0 16px 48px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }

  /* Drag Handle - 12x12px */
  .drag-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 28px;
    cursor: grab;
    padding-left: 6px;
    color: rgba(255, 255, 255, 0.5);
    transition: color 0.2s ease;
  }

  .drag-handle:hover {
    color: rgba(255, 255, 255, 0.8);
  }

  .drag-icon {
    width: 12px;
    height: 12px;
  }

  /* Island Core - Compact State */
  .island-core {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 10px;
    height: 100%;
    cursor: grab;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #6b7280;
    transition: all 0.3s ease;
  }

  .status-dot.protected {
    background: #22c55e;
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
    animation: pulse-green 2s infinite;
  }

  .status-dot.partial {
    background: #fbbf24;
    box-shadow: 0 0 8px rgba(251, 191, 36, 0.5);
  }

  .status-dot.unprotected {
    background: #6b7280;
  }

  @keyframes pulse-green {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  .tw-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--tw-button-color, #8b5cf6);
    text-shadow: 0 0 10px var(--tw-button-color, #8b5cf6);
    letter-spacing: 0.02em;
  }

  /* Toolbox - Expanded State */
  .toolbox {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-right: 8px;
    height: 100%;
  }

  .status-divider {
    font-size: 8px;
    color: rgba(255, 255, 255, 0.3);
  }

  .status-text {
    font-size: 10px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
    white-space: nowrap;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;

    /* AGGRESSIVE: Ensure button is always clickable */
    pointer-events: auto !important;
    touch-action: manipulation !important;
  }

  .add-trigger {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    font-size: 14px;
    font-weight: 600;
  }

  .add-trigger:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }

  .btn-icon {
    line-height: 1;
  }

  .helper-badge {
    font-size: 9px;
    background: rgba(139, 92, 246, 0.3);
    color: #c4b5fd;
    padding: 2px 6px;
    border-radius: 50px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .helper-mode .island-core {
    border-left: 2px solid rgba(139, 92, 246, 0.5);
  }

  /* UI 5: Mini Toast */
  .mini-toast {
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 23, 42, 0.9);
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    color: white;
    white-space: nowrap;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }

  /* ==========================================
     WARNING BANNER
     ========================================== */
  .warning-banner {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2147483647;
    min-width: 320px;
    max-width: 90%;
    background: linear-gradient(145deg, rgba(239, 68, 68, 0.92), rgba(185, 28, 28, 0.95));
    backdrop-filter: blur(16px);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 20px 50px rgba(239, 68, 68, 0.3);
    padding: 1rem;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .warning-banner.fullscreen {
    position: fixed;
  }

  .warning-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  /* Countdown Ring */
  .countdown-section {
    flex-shrink: 0;
  }

  .countdown-ring {
    position: relative;
    width: 48px;
    height: 48px;
  }

  .countdown-svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .countdown-bg {
    fill: none;
    stroke: rgba(255, 255, 255, 0.2);
    stroke-width: 3;
  }

  .countdown-progress {
    fill: none;
    stroke: white;
    stroke-width: 3;
    stroke-linecap: round;
    transition: stroke-dasharray 0.3s ease;
  }

  .countdown-number {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.125rem;
    font-weight: 700;
  }

  /* Warning Info */
  .warning-info {
    flex: 1;
    min-width: 120px;
  }

  .warning-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .warning-icon {
    font-size: 1.25rem;
  }

  .warning-title {
    font-size: 1rem;
    font-weight: 600;
  }

  .warning-subtitle {
    font-size: 0.8rem;
    opacity: 0.9;
    margin: 0.25rem 0 0;
  }

  /* Quick Actions */
  .quick-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .quick-action-btn {
    padding: 0.375rem 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 50px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .quick-action-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
  }

  .skip-now {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
  }

  .skip-now:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .protection-label {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    font-size: 0.75rem;
    text-align: center;
    opacity: 0.9;
  }

  /* ==========================================
     PROTECTION OVERLAY
     ========================================== */
  .protection-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2147483645;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .protection-overlay.fullscreen {
    position: fixed;
  }

  .protection-content {
    text-align: center;
    color: white;
  }

  .protection-icon {
    font-size: 4rem;
    display: block;
    margin-bottom: 1rem;
    filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.5));
  }

  .protection-text {
    font-size: 1.25rem;
    font-weight: 500;
    margin: 0 0 0.5rem;
    opacity: 0.9;
  }

  .protection-category {
    font-size: 0.875rem;
    opacity: 0.7;
    margin: 0;
  }

  /* Responsive */
  @media (max-width: 480px) {
    .warning-banner {
      min-width: auto;
      width: calc(100% - 32px);
      left: 16px;
      transform: none;
    }

    .warning-content {
      flex-direction: column;
      align-items: flex-start;
    }

    .quick-actions {
      width: 100%;
      justify-content: flex-start;
    }
  }
</style>
