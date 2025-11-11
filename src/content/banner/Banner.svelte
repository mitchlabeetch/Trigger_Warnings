<script lang="ts">
  import type { ActiveWarning } from '@shared/types/Warning.types';
  import type { BannerPosition } from '@shared/types/Profile.types';
  import { TRIGGER_CATEGORIES } from '@shared/constants/categories';
  import { formatCountdown, formatTimeRange } from '@shared/utils/time';
  import { onMount, onDestroy } from 'svelte';

  export let warnings: ActiveWarning[] = [];
  export let onIgnoreThisTime: (warningId: string) => void;
  export let onIgnoreForVideo: (categoryKey: string) => void;
  export let onVote: (warningId: string, voteType: 'up' | 'down') => void;

  // Profile settings
  export let position: BannerPosition = 'top-right';
  export let fontSize: number = 16;
  export let transparency: number = 85;
  export let spoilerFreeMode: boolean = false;

  let visible = false;
  let currentWarning: ActiveWarning | null = null;
  let updateInterval: number | null = null;

  // Thank you message state
  let showThankYou = false;
  let thankYouMessage = '';
  let thankYouTimeout: number | null = null;
  let votedWarnings = new Set<string>(); // Track which warnings have been voted on

  $: {
    if (warnings.length > 0) {
      currentWarning = warnings[0];
      visible = true;
    } else {
      visible = false;
      currentWarning = null;
    }
  }

  onMount(() => {
    // Update countdown every second
    updateInterval = window.setInterval(() => {
      // Force reactivity by creating new array
      warnings = [...warnings];
    }, 1000);
  });

  onDestroy(() => {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    if (thankYouTimeout) {
      clearTimeout(thankYouTimeout);
    }
  });

  function getCategoryInfo(warning: ActiveWarning) {
    return TRIGGER_CATEGORIES[warning.categoryKey];
  }

  function handleIgnoreThisTime() {
    if (currentWarning) {
      onIgnoreThisTime(currentWarning.id);
    }
  }

  function handleIgnoreForVideo() {
    if (currentWarning) {
      onIgnoreForVideo(currentWarning.categoryKey);
    }
  }

  function handleVote(voteType: 'up' | 'down') {
    if (currentWarning) {
      onVote(currentWarning.id, voteType);

      // Mark this warning as voted
      votedWarnings.add(currentWarning.id);
      votedWarnings = votedWarnings; // Trigger reactivity

      // Show thank you message
      thankYouMessage = voteType === 'up'
        ? '✓ Thank you! Your confirmation helps keep our community safe.'
        : '✓ Thank you! Your feedback helps improve accuracy.';
      showThankYou = true;

      // Auto-hide thank you message after 3 seconds
      if (thankYouTimeout) clearTimeout(thankYouTimeout);
      thankYouTimeout = window.setTimeout(() => {
        showThankYou = false;
      }, 3000);
    }
  }

  // Check if current warning has been voted on
  $: hasVoted = currentWarning ? votedWarnings.has(currentWarning.id) : false;

  // Get position styles
  function getPositionStyles(pos: BannerPosition): string {
    switch (pos) {
      case 'top-left':
        return 'top: 16px; left: 20px; right: auto;';
      case 'top-right':
        return 'top: 16px; right: 20px; left: auto;';
      case 'top-center':
        return 'top: 16px; left: 50%; transform: translateX(-50%);';
      case 'bottom-left':
        return 'bottom: 20px; left: 20px; right: auto; top: auto;';
      case 'bottom-right':
        return 'bottom: 20px; right: 20px; left: auto; top: auto;';
      case 'bottom-center':
        return 'bottom: 20px; left: 50%; transform: translateX(-50%); top: auto;';
      default:
        return 'top: 16px; right: 20px; left: auto;';
    }
  }

  // Calculate opacity from transparency percentage
  $: bannerOpacity = transparency / 100;

  // Calculate base font size multiplier
  $: fontMultiplier = fontSize / 16; // 16px is base
</script>

{#if visible && currentWarning}
  <div
    class="tw-banner"
    class:tw-banner-active={currentWarning.isActive}
    class:tw-banner-upcoming={!currentWarning.isActive}
    style="{getPositionStyles(position)} opacity: {bannerOpacity}; font-size: {fontSize}px;"
  >
    <div class="tw-banner-content">
      <!-- Icon -->
      <div class="tw-banner-icon">
        {getCategoryInfo(currentWarning).icon}
      </div>

      <!-- Message -->
      <div class="tw-banner-message">
        <div class="tw-banner-title">
          {#if currentWarning.isActive}
            <span class="tw-banner-status">⚠️ Active</span>
          {:else}
            <span class="tw-banner-status">⏰ {formatCountdown(currentWarning.timeUntilStart)}</span>
          {/if}
          <strong>{getCategoryInfo(currentWarning).name}</strong>
        </div>
        {#if !spoilerFreeMode}
          <div class="tw-banner-time">
            {formatTimeRange(currentWarning.startTime, currentWarning.endTime)}
          </div>
        {:else}
          <div class="tw-banner-time">
            Duration: {currentWarning.endTime - currentWarning.startTime}s
          </div>
        {/if}
      </div>

      <!-- Actions -->
      <div class="tw-banner-actions">
        <!-- Helper Mode buttons (for active warnings) -->
        {#if currentWarning.isActive && !hasVoted}
          <button
            class="tw-banner-btn tw-banner-btn-confirm"
            title="Confirm this warning is accurate"
            on:click={() => handleVote('up')}
          >
            <span class="tw-banner-btn-text">Confirm</span>
            <span class="tw-banner-btn-icon-inline">✓</span>
          </button>
          <button
            class="tw-banner-btn tw-banner-btn-refute"
            title="This warning is wrong"
            on:click={() => handleVote('down')}
          >
            <span class="tw-banner-btn-text">Wrong</span>
            <span class="tw-banner-btn-icon-inline">✕</span>
          </button>
          <div class="tw-banner-divider"></div>
        {/if}

        <!-- Ignore buttons -->
        <button
          class="tw-banner-btn tw-banner-btn-secondary"
          title="Hide this specific warning"
          on:click={handleIgnoreThisTime}
        >
          Ignore
        </button>
        <button
          class="tw-banner-btn tw-banner-btn-secondary"
          title="Hide all {getCategoryInfo(currentWarning).name} warnings for this video"
          on:click={handleIgnoreForVideo}
        >
          Ignore All
        </button>
      </div>

      <!-- Close button -->
      <button
        class="tw-banner-close"
        title="Dismiss"
        on:click={handleIgnoreThisTime}
      >
        ×
      </button>
    </div>
  </div>
{/if}

<!-- Thank you message overlay -->
{#if showThankYou}
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div
    class="tw-thank-you"
    role="status"
    aria-live="polite"
    style="{getPositionStyles(position)}"
    on:click={() => showThankYou = false}
  >
    <div class="tw-thank-you-content">
      {thankYouMessage}
    </div>
  </div>
{/if}

<style>
  .tw-banner {
    position: fixed;
    /* Position is set via inline style from profile settings */
    max-width: 500px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    animation: tw-slide-in 0.3s ease-out;
    transition: opacity 0.2s ease;
  }

  @keyframes tw-slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .tw-banner-upcoming {
    background: linear-gradient(135deg, #ff9800 0%, #ff6b00 100%);
  }

  .tw-banner-active {
    background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  }

  .tw-banner-content {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    position: relative;
  }

  .tw-banner-icon {
    font-size: 32px;
    flex-shrink: 0;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }

  .tw-banner-message {
    flex: 1;
    color: white;
  }

  .tw-banner-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tw-banner-status {
    font-size: 12px;
    font-weight: normal;
    padding: 2px 8px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    backdrop-filter: blur(10px);
  }

  .tw-banner-time {
    font-size: 13px;
    opacity: 0.9;
  }

  .tw-banner-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-shrink: 0;
  }

  .tw-banner-divider {
    width: 1px;
    height: 24px;
    background: rgba(255, 255, 255, 0.3);
  }

  .tw-banner-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .tw-banner-btn-icon {
    background: rgba(255, 255, 255, 0.2);
    padding: 6px 10px;
    font-size: 16px;
  }

  .tw-banner-btn-icon:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }

  .tw-banner-btn-secondary {
    background: rgba(255, 255, 255, 0.9);
    color: #333;
  }

  .tw-banner-btn-secondary:hover {
    background: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  /* Helper Mode buttons */
  .tw-banner-btn-confirm {
    background: rgba(76, 175, 80, 0.9);
    color: white;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .tw-banner-btn-confirm:hover {
    background: rgb(76, 175, 80);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
  }

  .tw-banner-btn-refute {
    background: rgba(244, 67, 54, 0.9);
    color: white;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .tw-banner-btn-refute:hover {
    background: rgb(244, 67, 54);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(244, 67, 54, 0.4);
  }

  .tw-banner-btn-text {
    font-size: 0.9em;
  }

  .tw-banner-btn-icon-inline {
    font-size: 1.1em;
    font-weight: bold;
  }

  .tw-banner-close {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    border: none;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border-radius: 50%;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .tw-banner-close:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .tw-banner {
      left: 10px;
      right: 10px;
      top: 10px;
      max-width: none;
    }

    .tw-banner-content {
      flex-wrap: wrap;
      padding: 12px 16px;
    }

    .tw-banner-actions {
      width: 100%;
      justify-content: flex-end;
      margin-top: 8px;
    }
  }

  /* Fullscreen mode adjustments */
  :global(body:fullscreen) .tw-banner,
  :global(body:-webkit-full-screen) .tw-banner,
  :global(body:-moz-full-screen) .tw-banner {
    top: 16px !important;
  }

  /* Center-positioned banners maintain centering */
  :global(body:fullscreen) .tw-banner[style*="translateX"],
  :global(body:-webkit-full-screen) .tw-banner[style*="translateX"],
  :global(body:-moz-full-screen) .tw-banner[style*="translateX"] {
    left: 50% !important;
  }

  /* Thank you message */
  .tw-thank-you {
    position: fixed;
    /* Position is set via inline style to match banner position */
    max-width: 500px;
    z-index: 1000000; /* Above banner */
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    animation: tw-thank-you-slide-in 0.3s ease-out;
    cursor: pointer;
  }

  @keyframes tw-thank-you-slide-in {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .tw-thank-you-content {
    padding: 16px 20px;
    background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    color: white;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    line-height: 1.5;
  }

  /* Voted state styling */
  .tw-banner-btn-confirm:disabled,
  .tw-banner-btn-refute:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .tw-thank-you {
      left: 10px;
      right: 10px;
      max-width: none;
    }
  }
</style>
