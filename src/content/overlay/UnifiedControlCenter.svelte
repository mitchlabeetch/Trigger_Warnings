<script lang="ts">
  import { onMount } from 'svelte';

  let isDragging = false;
  let wasDragged = false;
  let isExpanded = false;
  let isVertical = false;
  let isHovered = false;

  export let nextTriggerText: string = 'Next Trigger: [Category] in [Time]';
  export let upcomingText: string = 'Upcoming';
  export let reportText: string = 'Report';
  export let settingsText: string = 'Settings';

  let dragOffset = { x: 0, y: 0 };
  let initialDragState = { startOffsetX: 0, startOffsetY: 0, startMouseX: 0, startMouseY: 0 };

  let unifiedControlCenter: HTMLElement;

  onMount(() => {
    const savedOffset = localStorage.getItem('unified-control-center-offset');
    if (savedOffset) {
      try {
        dragOffset = JSON.parse(savedOffset);
      } catch (e) {
        console.error('Failed to parse saved offset for unified control center:', e);
        localStorage.removeItem('unified-control-center-offset');
      }
    }
  });

  function handleMouseDown(event: MouseEvent) {
    isDragging = true;
    wasDragged = false;
    initialDragState = {
      startOffsetX: dragOffset.x,
      startOffsetY: dragOffset.y,
      startMouseX: event.clientX,
      startMouseY: event.clientY,
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isDragging) return;
    wasDragged = true;

    const dx = event.clientX - initialDragState.startMouseX;
    const dy = event.clientY - initialDragState.startMouseY;

    dragOffset = {
      x: initialDragState.startOffsetX + dx,
      y: initialDragState.startOffsetY + dy,
    };
  }

  function handleMouseUp() {
    isDragging = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    localStorage.setItem('unified-control-center-offset', JSON.stringify(dragOffset));

    if (unifiedControlCenter) {
      const rect = unifiedControlCenter.getBoundingClientRect();
      const screenThird = window.innerWidth / 3;
      isVertical = rect.left < screenThird || rect.right > screenThird * 2;
    }
  }

  function toggleExpand() {
    if (!wasDragged) {
      isExpanded = !isExpanded;
    }
  }
</script>

<div
  bind:this={unifiedControlCenter}
  class="unified-control-center"
  style="transform: translate(-50%, 0) translate({dragOffset.x}px, {dragOffset.y}px);"
  on:mousedown={handleMouseDown}
  on:click={toggleExpand}
  on:mouseenter={() => isHovered = true}
  on:mouseleave={() => isHovered = false}
>
  <div class="glass-pill" class:expanded={isExpanded} class:vertical={isVertical} class:hovered={isHovered}>
    {#if !isExpanded}
      <div class="drag-handle"></div>
      <span class="trigger-text">{nextTriggerText}</span>
    {:else}
      <div class="dashboard-panel">
        <div class="tabs">
          <button>{upcomingText}</button>
          <button>{reportText}</button>
          <button>{settingsText}</button>
        </div>
        <div class="tab-content">
          <!-- Content for tabs goes here -->
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  :root {
    --pill-size-collapsed: 40px;
    --pill-width-hovered: 250px;
    --panel-width-expanded: 500px;
    --panel-height-expanded: 300px;
    --panel-width-vertical: 300px;
    --panel-height-vertical: 500px;
  }

  .unified-control-center {
    position: fixed;
    bottom: var(--tw-dock-bottom-offset, 20px);
    left: 50%;
    z-index: 2147483647;
    cursor: grab;
    user-select: none;
  }

  .glass-pill {
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
    border-radius: 9999px;
    border: 1px solid var(--tw-accent-color, transparent);
    color: white;
    padding: 8px 16px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    white-space: nowrap;
    overflow: hidden;
  }

  .glass-pill:not(.expanded) {
    width: var(--pill-size-collapsed);
    height: var(--pill-size-collapsed);
    padding: 8px;
    justify-content: center;
  }

  .glass-pill.hovered:not(.expanded) {
    width: var(--pill-width-hovered);
  }

  .trigger-text {
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .glass-pill.hovered .trigger-text {
    opacity: 1;
  }

  .glass-pill.expanded {
    width: var(--panel-width-expanded);
    height: var(--panel-height-expanded);
    border-radius: 20px;
    flex-direction: column;
    align-items: stretch;
    padding: 16px;
  }

  .glass-pill.expanded.vertical {
    width: var(--panel-width-vertical);
    height: var(--panel-height-vertical);
  }

  .drag-handle {
    width: 20px;
    height: 20px;
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>');
    background-repeat: no-repeat;
    background-position: center;
    cursor: grab;
    margin-right: 8px;
    flex-shrink: 0;
  }

  .dashboard-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .tabs {
    display: flex;
    justify-content: space-around;
    margin-bottom: 16px;
  }

  .tabs button {
    background: none;
    border: none;
    color: white;
    font-size: 16px;
    cursor: pointer;
    transition: color 0.3s ease;
  }

  .tabs button:hover {
    color: var(--tw-accent-color, #ffffff);
  }
</style>
