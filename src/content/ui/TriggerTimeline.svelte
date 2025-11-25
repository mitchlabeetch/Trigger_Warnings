
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { IStreamingProvider } from '@shared/types/Provider.types';
  import type { Warning } from '@shared/types/Warning.types';

  export let provider: IStreamingProvider;
  export let warnings: Warning[] = [];

  let canvas: HTMLCanvasElement;
  let tooltip: HTMLElement;
  let isTooltipVisible = false;
  let tooltipContent = '';
  let tooltipLeft = '0px';
  let tooltipTop = '0px';

  let progressBar: HTMLElement | null = null;

  onMount(() => {
    progressBar = provider.getProgressBarElement();
    if (progressBar) {
      progressBar.appendChild(canvas);
      window.addEventListener('resize', draw);
      draw();
    }
  });

  onDestroy(() => {
    if (progressBar && canvas.parentNode === progressBar) {
      progressBar.removeChild(canvas);
    }
    window.removeEventListener('resize', draw);
  });

  $: if (warnings.length > 0 && canvas) {
    draw();
  }

  function draw() {
    if (!canvas || !progressBar) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = progressBar.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const duration = provider.getVideoElement()?.duration || 1;

    warnings.forEach(warning => {
      const startX = (warning.startTime / duration) * canvas.width;
      const endX = (warning.endTime / duration) * canvas.width;

      ctx.fillStyle = getCategoryColor(warning.categoryKey);
      ctx.fillRect(startX, 0, endX - startX, canvas.height);
    });
  }

  function handleMouseMove(event: MouseEvent) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const duration = provider.getVideoElement()?.duration || 1;
    const time = (x / canvas.width) * duration;

    const warning = warnings.find(w => time >= w.startTime && time <= w.endTime);

    if (warning) {
      isTooltipVisible = true;
      tooltipContent = warning.categoryKey;
      tooltipLeft = `${event.clientX}px`;
      tooltipTop = `${event.clientY - 30}px`;
    } else {
      isTooltipVisible = false;
    }
  }

  function handleMouseLeave() {
    isTooltipVisible = false;
  }

  function getCategoryColor(category: string): string {
    // Basic color mapping - this can be expanded
    const colors: { [key: string]: string } = {
      violence: '#ff4d4d',
      gore: '#b30000',
      'sexual-assault': '#ff8533',
      'self-harm': '#ffc266',
      // Add more categories and colors
    };
    return colors[category] || '#cccccc';
  }
</script>

<canvas bind:this={canvas} on:mousemove={handleMouseMove} on:mouseleave={handleMouseLeave}></canvas>

{#if isTooltipVisible}
  <div class="tw-timeline-tooltip" style="left: {tooltipLeft}; top: {tooltipTop};">
    {tooltipContent}
  </div>
{/if}

<style>
  canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: all;
    opacity: 0.7;
  }

  .tw-timeline-tooltip {
    position: fixed;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    font-size: 12px;
    z-index: 9999999;
    pointer-events: none;
    transform: translateX(-50%);
  }
</style>
