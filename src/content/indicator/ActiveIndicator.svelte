<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let onQuickAdd: () => void;

  let visible = false;
  let isExpanded = false;

  // Fade in after a short delay
  onMount(() => {
    setTimeout(() => {
      visible = true;
    }, 500);
  });

  function handleQuickAdd() {
    onQuickAdd();
  }

  function toggleExpanded() {
    isExpanded = !isExpanded;
  }
</script>

{#if visible}
  <div
    class="tw-indicator"
    class:expanded={isExpanded}
    on:mouseenter={() => isExpanded = true}
    on:mouseleave={() => isExpanded = false}
  >
    <div class="tw-indicator-content">
      <!-- Status icon/badge -->
      <div class="tw-indicator-badge">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M12 8v4M12 16h.01"/>
        </svg>
      </div>

      <!-- Text label -->
      <div class="tw-indicator-label">
        TW Active
      </div>

      {#if isExpanded}
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
    gap: 8px;
    padding: 8px 12px;
    background: rgba(59, 130, 246, 0.95);
    border-radius: 20px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(10px);
    color: white;
    transition: all 0.3s ease;
  }

  .tw-indicator:hover .tw-indicator-content {
    background: rgba(59, 130, 246, 1);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
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
