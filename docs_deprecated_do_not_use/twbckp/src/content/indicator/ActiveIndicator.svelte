<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { ActiveWarning } from '@shared/types/Warning.types';

  export let onQuickAdd: () => void;
  export let activeWarnings: ActiveWarning[] = [];

  let visible = false;
  let isExpanded = false;
  let currentTime = '--:--';
  let intervalId: number | null = null;

  // Fade in after a short delay
  onMount(() => {
    setTimeout(() => {
      visible = true;
    }, 500);

    // Update timestamp every second
    updateTimestamp();
    intervalId = window.setInterval(updateTimestamp, 1000);
  });

  onDestroy(() => {
    if (intervalId !== null) {
      clearInterval(intervalId);
    }
  });

  function updateTimestamp() {
    const video = document.querySelector('video');
    if (video && !isNaN(video.currentTime)) {
      const time = Math.floor(video.currentTime);
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
      currentTime = `${minutes}:${String(seconds).padStart(2, '0')}`;
    }
  }

  function handleQuickAdd() {
    onQuickAdd();
  }

  function toggleExpanded() {
    isExpanded = !isExpanded;
  }

  $: hasActiveWarnings = activeWarnings.length > 0;
</script>

{#if visible}
  <div
    class="tw-indicator"
    class:expanded={isExpanded}
    class:has-warnings={hasActiveWarnings}
    role="complementary"
    aria-label="Trigger Warnings Extension Indicator"
    on:mouseenter={() => isExpanded = true}
    on:mouseleave={() => isExpanded = false}
    on:focusin={() => isExpanded = true}
    on:focusout={() => isExpanded = false}
  >
    <div class="tw-indicator-content">
      <!-- Status icon/badge -->
      <div class="tw-indicator-badge">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          {#if hasActiveWarnings}
            <circle cx="12" cy="12" r="3" fill="currentColor"/>
          {:else}
            <path d="M12 8v4M12 16h.01"/>
          {/if}
        </svg>
      </div>

      <!-- Text label -->
      <div class="tw-indicator-label">
        TW Active
      </div>

      <!-- Timestamp -->
      <div class="tw-indicator-time">
        {currentTime}
      </div>

      {#if isExpanded}
        <!-- Expanded content -->
        <div class="tw-indicator-expanded">
          <!-- Active warnings list -->
          {#if hasActiveWarnings}
            <div class="tw-indicator-warnings">
              <div class="tw-warnings-header">Active Triggers ({activeWarnings.length})</div>
              {#each activeWarnings as warning}
                <div class="tw-warning-item">
                  <span class="tw-warning-icon">⚠️</span>
                  <span class="tw-warning-text">{warning.categoryKey}</span>
                </div>
              {/each}
            </div>
          {/if}

          <!-- Quick add button -->
          <button
            class="tw-indicator-add-btn"
            on:click={handleQuickAdd}
            title="Add trigger warning at current timestamp"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span class="tw-indicator-add-text">Add Trigger</span>
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .tw-indicator {
    position: fixed;
    bottom: 80px;
    left: 16px;
    z-index: 999998;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    animation: tw-indicator-fade-in 0.5s ease-out;
    transition: all 0.3s ease;
  }

  @keyframes tw-indicator-fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .tw-indicator-content {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 12px;
    background: linear-gradient(135deg, rgba(109, 40, 217, 0.95) 0%, rgba(138, 43, 226, 0.95) 100%);
    border-radius: 20px;
    box-shadow: 0 4px 16px rgba(109, 40, 217, 0.4);
    backdrop-filter: blur(10px);
    color: white;
    transition: all 0.3s ease;
  }

  .tw-indicator:hover .tw-indicator-content {
    background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(168, 85, 247, 1) 100%);
    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
  }

  .tw-indicator.has-warnings .tw-indicator-content {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%);
  }

  .tw-indicator.has-warnings:hover .tw-indicator-content {
    background: linear-gradient(135deg, rgba(239, 68, 68, 1) 0%, rgba(220, 38, 38, 1) 100%);
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
  }

  .tw-indicator-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  .tw-indicator-badge svg {
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
  }

  .tw-indicator-label {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.3px;
    white-space: nowrap;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  .tw-indicator-time {
    font-size: 12px;
    font-weight: 500;
    font-family: 'Courier New', monospace;
    background: rgba(0, 0, 0, 0.2);
    padding: 2px 8px;
    border-radius: 8px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    letter-spacing: 0.5px;
  }

  .tw-indicator-expanded {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    animation: tw-indicator-slide-in 0.3s ease-out;
  }

  .tw-indicator-warnings {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .tw-warnings-header {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.9;
    padding-bottom: 4px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .tw-warning-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    padding: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    animation: tw-warning-fade-in 0.3s ease-out;
  }

  @keyframes tw-warning-fade-in {
    from {
      opacity: 0;
      transform: translateX(-5px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .tw-warning-icon {
    font-size: 14px;
    flex-shrink: 0;
  }

  .tw-warning-text {
    flex: 1;
    text-transform: capitalize;
  }

  .tw-indicator-add-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    color: white;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    animation: tw-indicator-slide-in 0.3s ease-out;
  }

  @keyframes tw-indicator-slide-in {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .tw-indicator-add-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .tw-indicator-add-btn:active {
    transform: translateY(0);
  }

  .tw-indicator-add-text {
    font-size: 12px;
    font-weight: 600;
  }

  /* Fullscreen mode adjustments */
  :global(body:fullscreen) .tw-indicator,
  :global(body:-webkit-full-screen) .tw-indicator,
  :global(body:-moz-full-screen) .tw-indicator {
    bottom: 100px;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .tw-indicator {
      left: 10px;
      bottom: 70px;
    }

    .tw-indicator-content {
      padding: 6px 10px;
    }

    .tw-indicator-label {
      font-size: 12px;
    }

    .tw-indicator-add-btn {
      padding: 5px 8px;
      font-size: 11px;
    }
  }
</style>
