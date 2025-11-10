<script lang="ts">
  import { onMount } from 'svelte';

  export let message: string;
  export let type: 'success' | 'error' | 'info' | 'warning' = 'info';
  export let duration: number = 3000;
  export let onClose: () => void;

  let visible = false;

  onMount(() => {
    // Trigger animation
    setTimeout(() => {
      visible = true;
    }, 10);

    // Auto-close after duration
    const timeout = setTimeout(() => {
      closeToast();
    }, duration);

    return () => clearTimeout(timeout);
  });

  function closeToast() {
    visible = false;
    setTimeout(() => {
      onClose();
    }, 300); // Wait for fade-out animation
  }

  function getIcon() {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
  class="toast toast-{type}"
  class:visible
  role="status"
  aria-live="polite"
  on:click={closeToast}
>
  <div class="toast-icon">{getIcon()}</div>
  <div class="toast-message">{message}</div>
  <button class="toast-close" on:click|stopPropagation={closeToast} aria-label="Close">×</button>
</div>

<style>
  .toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    min-width: 300px;
    max-width: 400px;
    padding: 14px 16px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    z-index: 10000;
    transform: translateY(100px);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .toast.visible {
    transform: translateY(0);
    opacity: 1;
  }

  .toast-success {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
  }

  .toast-error {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
  }

  .toast-warning {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
  }

  .toast-info {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
  }

  .toast-icon {
    font-size: 20px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
  }

  .toast-message {
    flex: 1;
    font-size: 14px;
    line-height: 1.4;
  }

  .toast-close {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.8;
    transition: opacity 0.2s;
  }

  .toast-close:hover {
    opacity: 1;
  }
</style>
