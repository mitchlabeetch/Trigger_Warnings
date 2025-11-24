<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Toast from './Toast.svelte';
  import { toast, type ToastInstance } from '../utils/toast';

  let toasts: ToastInstance[] = [];
  let unsubscribe: (() => void) | null = null;

  onMount(() => {
    unsubscribe = toast.subscribe((newToasts) => {
      toasts = newToasts;
    });
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  function removeToast(id: string) {
    toast.remove(id);
  }
</script>

<div class="toast-container">
  {#each toasts as toastItem (toastItem.id)}
    <Toast
      message={toastItem.message}
      type={toastItem.type}
      duration={toastItem.duration}
      onClose={() => removeToast(toastItem.id)}
    />
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    flex-direction: column-reverse;
    gap: 12px;
    z-index: 10000;
    pointer-events: none;
  }

  .toast-container :global(.toast) {
    pointer-events: auto;
  }
</style>
