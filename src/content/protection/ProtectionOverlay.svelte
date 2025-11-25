<script lang="ts">
  import type { ProtectionType } from '@shared/types/Profile.types';

  export let protectionType: ProtectionType = 'none';
  export let categoryName: string = '';
  export let warningDescription: string = '';
  export let isSafe: boolean = false;

  let isPeeking = false;

  $: showBlackout = protectionType === 'blackout' || protectionType === 'both';

  function handlePeekStart() {
    isPeeking = true;
  }

  function handlePeekEnd() {
    isPeeking = false;
  }

  function handleClick(event: MouseEvent) {
    event.stopPropagation();
  }
</script>

{#if showBlackout}
  <div
    class="tw-protection-overlay"
    class:safe={isSafe}
    class:peeking={isPeeking}
    on:click={handleClick}
    role="presentation"
  >
    <div class="tw-content">
      <div class="tw-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <circle cx="12" cy="12" r="1" fill="currentColor"/>
        </svg>
      </div>

      <div class="tw-message">
        <h3>Protected Content</h3>
        {#if categoryName}
          <p class="tw-category">{categoryName}</p>
        {/if}
        {#if warningDescription}
          <p class="tw-description">{warningDescription}</p>
        {/if}
      </div>

      <button
        class="tw-peek-button"
        on:mousedown={handlePeekStart}
        on:mouseup={handlePeekEnd}
        on:mouseleave={handlePeekEnd}
        on:touchstart={handlePeekStart}
        on:touchend={handlePeekEnd}
      >
        Hold to Peek
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
    background-color: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    pointer-events: all;

    /* Curtain Transition */
    mask-image: radial-gradient(circle at center, black 0%, transparent 100%);
    mask-size: 200% 200%;
    mask-position: center;
    animation: dissolve-in 0.5s ease-out forwards;
  }

  .tw-protection-overlay.safe {
    animation: dissolve-out 0.8s ease-in forwards;
  }

  .tw-protection-overlay.peeking {
    background-color: rgba(0, 0, 0, 0.1);
    transition: background-color 0.2s ease-out;
  }

  @keyframes dissolve-in {
    from { mask-size: 200% 200%; }
    to { mask-size: 0% 0%; }
  }

  @keyframes dissolve-out {
    from { mask-size: 0% 0%; }
    to { mask-size: 200% 200%; }
  }

  .tw-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 32px;
    text-align: center;
    max-width: 500px;
    opacity: 1;
    transition: opacity 0.3s 0.2s ease-in-out;
  }

  .tw-protection-overlay.safe .tw-content {
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  }

  .tw-protection-overlay.peeking .tw-content {
    opacity: 0;
  }

  .tw-icon {
    color: rgba(255, 255, 255, 0.9);
  }

  .tw-message h3 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .tw-category {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.8);
  }

  .tw-description {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
  }

  .tw-peek-button {
    margin-top: 24px;
    padding: 12px 24px;
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .tw-peek-button:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  @media (max-width: 768px) {
    .tw-content {
      padding: 24px;
      gap: 16px;
    }

    .tw-icon svg {
      width: 40px;
      height: 40px;
    }

    .tw-message h3 {
      font-size: 20px;
    }

    .tw-category {
      font-size: 14px;
    }

    .tw-description {
      font-size: 13px;
    }
  }
</style>
