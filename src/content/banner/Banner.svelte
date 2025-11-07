<script lang="ts">
  import type { ActiveWarning } from '@shared/types/Warning.types';
  import { TRIGGER_CATEGORIES } from '@shared/constants/categories';
  import { formatCountdown, formatTimeRange } from '@shared/utils/time';
  import { onMount, onDestroy } from 'svelte';

  export let warnings: ActiveWarning[] = [];
  export let onIgnoreThisTime: (warningId: string) => void;
  export let onIgnoreForVideo: (categoryKey: string) => void;
  export let onVote: (warningId: string, voteType: 'up' | 'down') => void;

  let visible = false;
  let currentWarning: ActiveWarning | null = null;
  let updateInterval: number | null = null;

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
    }
  }
</script>

{#if visible && currentWarning}
  <div
    class="tw-banner"
    class:tw-banner-active={currentWarning.isActive}
    class:tw-banner-upcoming={!currentWarning.isActive}
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
        <div class="tw-banner-time">
          {formatTimeRange(currentWarning.startTime, currentWarning.endTime)}
        </div>
      </div>

      <!-- Actions -->
      <div class="tw-banner-actions">
        <!-- Vote buttons (for active warnings) -->
        {#if currentWarning.isActive}
          <button
            class="tw-banner-btn tw-banner-btn-icon"
            title="Accurate warning"
            on:click={() => handleVote('up')}
          >
            👍
          </button>
          <button
            class="tw-banner-btn tw-banner-btn-icon"
            title="Inaccurate warning"
            on:click={() => handleVote('down')}
          >
            👎
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

<style>
  .tw-banner {
    position: fixed;
    top: 20px;
    right: 20px;
    max-width: 500px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    animation: tw-slide-in 0.3s ease-out;
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
    top: 60px;
  }
</style>
