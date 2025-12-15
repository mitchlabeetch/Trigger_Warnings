<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { ProtectionType } from '@shared/types/Profile.types';

  export let protectionType: ProtectionType = 'none';
  export let categoryName: string = '';
  export let warningDescription: string = '';

  let visible = false;
  let fadeIn = false;
  let isPeeking = false;

  $: showBlackout = protectionType === 'blackout' || protectionType === 'both';

  // UI 1: Peek Mode logic
  $: overlayOpacity = isPeeking ? 0.1 : 1;

  onMount(() => {
    // Slight delay for smooth transition
    setTimeout(() => {
      visible = true;
      setTimeout(() => {
        fadeIn = true;
      }, 50);
    }, 100);

    // UI 7: Keyboard shortcuts
    window.addEventListener('keydown', handleKeydown, true);
    window.addEventListener('keyup', handleKeyup, true);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown, true);
    window.removeEventListener('keyup', handleKeyup, true);
  });

  // Bug 2: Pass common media keys to underlying player, handle peek with keys
  function handleKeydown(event: KeyboardEvent) {
    // UI 1: Hold 'P' to peek
    if (event.key.toLowerCase() === 'p' && !event.repeat) {
      isPeeking = true;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (!visible) return;

    // Allowed keys (media controls) - let them propagate
    const allowedKeys = [' ', 'k', 'j', 'l', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'm', 'f'];

    if (allowedKeys.includes(event.key)) {
      // If we are focused on the overlay, we might need to manually trigger video controls
      // But typically propagation is enough if we don't stop it.
      // The issue is if the overlay captures focus.
      return;
    }
  }

  function handleKeyup(event: KeyboardEvent) {
    if (event.key.toLowerCase() === 'p') {
      isPeeking = false;
    }
  }

  function handleClick(event: MouseEvent) {
    // Prevent clicks from passing through to video player unless peeking?
    // Usually we want to block clicks to prevent accidental spoilers.
    event.stopPropagation();
  }

  function handlePeekStart() {
    isPeeking = true;
  }

  function handlePeekEnd() {
    isPeeking = false;
  }
</script>

{#if showBlackout}
  <!-- UI 6: Accessibility roles -->
  <div
    class="tw-protection-overlay"
    class:visible={visible}
    class:fade-in={fadeIn}
    style="opacity: {visible && fadeIn ? overlayOpacity : 0};"
    on:click={handleClick}
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="tw-protection-title"
    aria-describedby="tw-protection-desc"
  >
    <div class="tw-protection-content">
      <div class="tw-protection-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <circle cx="12" cy="12" r="1" fill="currentColor"/>
        </svg>
      </div>

      <div class="tw-protection-message">
        <h3 id="tw-protection-title">Protected Content</h3>
        {#if categoryName}
          <p id="tw-protection-desc" class="tw-protection-category">{categoryName}</p>
        {/if}
        {#if warningDescription}
          <p class="tw-protection-description">{warningDescription}</p>
        {/if}
      </div>

      <!-- UI 1: Peek Button -->
      <button
        class="tw-peek-btn"
        on:mousedown={handlePeekStart}
        on:mouseup={handlePeekEnd}
        on:mouseleave={handlePeekEnd}
        on:touchstart={handlePeekStart}
        on:touchend={handlePeekEnd}
        aria-label="Hold to peek at content"
      >
        <span>👁️ Hold to Peek</span>
        <span class="tw-shortcut-hint">(or hold P)</span>
      </button>
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
    /* UI 2: Blur Effect + Semi-transparent black */
    background-color: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
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

  .tw-peek-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.9);
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tw-peek-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .tw-peek-btn:active {
    transform: scale(0.98);
  }

  .tw-shortcut-hint {
    opacity: 0.5;
    font-size: 12px;
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
