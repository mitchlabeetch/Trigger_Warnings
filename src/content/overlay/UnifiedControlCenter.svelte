<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { StorageAdapter } from '../../core/storage/StorageAdapter';

  let isHovered = false;
  let isExpanded = false;
  let isDragging = false;
  let isVertical = false;
  let top = 20; // position in pixels
  let left = 0; // position in pixels, initialized on mount
  let xOffset = 0;
  let yOffset = 0;

  onMount(async () => {
    const savedPosition = await StorageAdapter.get('unifiedControlCenterPosition');
    if (savedPosition) {
      top = savedPosition.top;
      left = savedPosition.left;
    } else {
      // Default to top-center if no position is saved
      left = window.innerWidth / 2;
    }
    checkPosition();
  });

  function onMouseEnter() {
    isHovered = true;
  }

  function onMouseLeave() {
    isHovered = false;
  }

  function onClick() {
    isExpanded = !isExpanded;
  }

  function onDragStart(event: MouseEvent) {
    isDragging = true;
    xOffset = event.clientX - left;
    yOffset = event.clientY - top;
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', onDragEnd);
  }

  function onDrag(event: MouseEvent) {
    if (!isDragging) return;
    left = event.clientX - xOffset;
    top = event.clientY - yOffset;
  }

  function onDragEnd() {
    isDragging = false;
    window.removeEventListener('mousemove', onDrag);
    window.removeaddEventListener('mouseup', onDragEnd);
    StorageAdapter.set('unifiedControlCenterPosition', { top, left });
    checkPosition();
  }

  function checkPosition() {
    const screenWidth = window.innerWidth;
    isVertical = left < screenWidth * 0.25 || left > screenWidth * 0.75;
  }

</script>

<div
  class="unified-control-center"
  class:hover={isHovered}
  class:expanded={isExpanded}
  class:vertical={isVertical}
  style="top: {top}px; left: {left}px; transform: translateX(-50%);"
  on:mouseenter={onMouseEnter}
  on:mouseleave={onMouseLeave}
  on:click={onClick}
>
  <div class="drag-handle" on:mousedown={onDragStart}>
    <!-- You can put a drag icon here -->
  </div>

  <div class="pill-content">
    {#if isHovered && !isExpanded}
      <!-- TODO: Replace with dynamic data from a store -->
      <span>Next Trigger: Violence in 1:24</span>
    {:else if !isExpanded}
      <div class="pill-icon"></div>
    {/if}
  </div>

  {#if isExpanded}
    <div class="dashboard">
      <div class="tabs">
        <button class="tab-button active">Upcoming</button>
        <button class="tab-button">Report</button>
        <button class="tab-button">Settings</button>
      </div>
      <div class="tab-content">
        <!-- Content for Upcoming -->
      </div>
    </div>
  {/if}
</div>

<style>
  .unified-control-center {
    position: fixed;
    z-index: 99999999;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px) !important;
    -webkit-backdrop-filter: blur(10px) !important;
    border: 1px solid var(--tw-accent-color, rgba(255, 255, 255, 0.2));
    border-radius: 999px;
    color: white;
    box-shadow: 0 0 10px 0 var(--tw-accent-color, transparent);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .unified-control-center.hover:not(.expanded) {
    width: 300px;
  }

  .unified-control-center.expanded {
    width: 500px;
    height: 300px;
    border-radius: 20px;
    flex-direction: column;
    align-items: stretch;
    padding: 10px;
  }

  .unified-control-center.expanded.vertical {
    width: 300px;
    height: 500px;
  }

  .drag-handle {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 10px;
    cursor: grab;
    border-top: 2px dotted rgba(255, 255, 255, 0.5);
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .pill-content {
    overflow: hidden;
    white-space: nowrap;
    text-align: center;
  }

  .pill-icon {
    width: 24px;
    height: 24px;
    background: white;
    border-radius: 50%;
  }

  .dashboard {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .tabs {
    display: flex;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .tab-button {
    background: none;
    border: none;
    color: white;
    padding: 10px 15px;
    cursor: pointer;
    opacity: 0.7;
  }

  .tab-button.active, .tab-button:hover {
    opacity: 1;
    border-bottom: 2px solid white;
  }

  .tab-content {
    padding: 15px;
    flex-grow: 1;
  }
</style>
