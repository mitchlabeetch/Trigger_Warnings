<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { ProtectionType } from '@shared/types/Profile.types';

  export let protectionType: ProtectionType = 'none';
  export let categoryName: string = '';
  export let warningDescription: string = '';

  let visible = false;
  let fadeIn = false;

  $: showBlackout = protectionType === 'blackout' || protectionType === 'both';

  onMount(() => {
    // Slight delay for smooth transition
    setTimeout(() => {
      visible = true;
      setTimeout(() => {
        fadeIn = true;
      }, 50);
    }, 100);
  });

  function handleClick(event: MouseEvent) {
    // Prevent clicks from passing through to video player
    event.stopPropagation();
  }
</script>

{#if showBlackout}
  <div
    class="tw-protection-overlay"
    class:visible={visible}
    class:fade-in={fadeIn}
    on:click={handleClick}
    role="presentation"
  >
    <div class="tw-protection-content">
      <div class="tw-protection-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <circle cx="12" cy="12" r="1" fill="currentColor"/>
        </svg>
      </div>

      <div class="tw-protection-message">
        <h3>Protected Content</h3>
        {#if categoryName}
          <p class="tw-protection-category">{categoryName}</p>
        {/if}
        {#if warningDescription}
          <p class="tw-protection-description">{warningDescription}</p>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .tw-protection-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #000000;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
    pointer-events: all;
  }

  .tw-protection-overlay.visible {
    opacity: 1;
  }

  .tw-protection-overlay.fade-in {
    opacity: 1;
  }

  .tw-protection-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 32px;
    text-align: center;
    max-width: 500px;
  }

  .tw-protection-icon {
    color: rgba(255, 255, 255, 0.9);
    animation: tw-pulse 2s ease-in-out infinite;
  }

  @keyframes tw-pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(0.95);
    }
  }

  .tw-protection-message {
    color: rgba(255, 255, 255, 0.95);
  }

  .tw-protection-message h3 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 12px;
    letter-spacing: -0.02em;
  }

  .tw-protection-category {
    font-size: 16px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 8px;
  }

  .tw-protection-description {
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.7);
    max-width: 400px;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .tw-protection-content {
      padding: 24px;
      gap: 16px;
    }

    .tw-protection-icon svg {
      width: 40px;
      height: 40px;
    }

    .tw-protection-message h3 {
      font-size: 20px;
    }

    .tw-protection-category {
      font-size: 14px;
    }

    .tw-protection-description {
      font-size: 13px;
    }
  }
</style>
