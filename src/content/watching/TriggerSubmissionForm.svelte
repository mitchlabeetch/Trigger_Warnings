<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { TRIGGER_CATEGORIES, CATEGORY_KEYS } from '@shared/constants/categories';
  import type { TriggerCategory } from '@shared/types/Warning.types';

  export let currentTime: number = 0;
  export let duration: number = 0;

  const dispatch = createEventDispatcher();

  // Form State
  let category: TriggerCategory | '' = '';
  let startTimeStr = formatTime(currentTime);
  let endTimeStr = formatTime(currentTime + 5); // Default 5s duration
  let description = '';
  let error = '';
  let isSubmitting = false;

  // Search/Filter for categories
  let searchTerm = '';
  let showCategoryDropdown = false;

  $: filteredCategories = CATEGORY_KEYS.filter((key) => {
    const info = TRIGGER_CATEGORIES[key];
    return (
      info.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      info.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }).sort((a, b) => TRIGGER_CATEGORIES[a].name.localeCompare(TRIGGER_CATEGORIES[b].name));

  $: selectedCategoryInfo = category ? TRIGGER_CATEGORIES[category] : null;

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function parseTime(timeStr: string): number | null {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      const m = parseInt(parts[0], 10);
      const s = parseInt(parts[1], 10);
      if (!isNaN(m) && !isNaN(s)) {
        return m * 60 + s;
      }
    } else if (parts.length === 1) {
      const s = parseInt(parts[0], 10);
      if (!isNaN(s)) return s;
    }
    return null;
  }

  function handleSubmit() {
    error = '';
    const start = parseTime(startTimeStr);
    const end = parseTime(endTimeStr);

    if (!category) {
      error = 'Please select a category';
      return;
    }

    if (start === null || end === null) {
      error = 'Invalid time format (use MM:SS)';
      return;
    }

    if (start < 0 || end < 0) {
      error = 'Time cannot be negative';
      return;
    }

    if (end <= start) {
      error = 'End time must be after start time';
      return;
    }

    // Optional: Check if time is within video duration if duration is known
    if (duration > 0 && start > duration) {
       error = 'Start time exceeds video duration';
       return;
    }

    isSubmitting = true;

    dispatch('submit', {
      categoryKey: category,
      startTime: start,
      endTime: end,
      description: description.trim(),
    });
  }

  function handleCancel() {
    dispatch('cancel');
  }

  function selectCategory(key: TriggerCategory) {
    category = key;
    searchTerm = '';
    showCategoryDropdown = false;
  }

  // Close dropdown when clicking outside
  function handleOutsideClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (showCategoryDropdown && !target.closest('.category-select-container')) {
      showCategoryDropdown = false;
    }
  }

  onMount(() => {
    window.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  });
</script>

<div class="submission-overlay" transition:fade={{ duration: 200 }}>
  <div
    class="submission-card"
    transition:scale={{ duration: 300, start: 0.95 }}
    role="dialog"
    aria-labelledby="form-title"
  >
    <h2 id="form-title">Add Trigger Warning</h2>

    <div class="form-group category-select-container">
      <label for="category-search">Category</label>
      <!-- Custom Select Trigger -->
      <div
        class="custom-select"
        class:active={showCategoryDropdown}
        on:click|stopPropagation={() => showCategoryDropdown = !showCategoryDropdown}
        role="button"
        tabindex="0"
      >
        {#if selectedCategoryInfo}
          <span class="selected-value">
            <span class="cat-icon">{selectedCategoryInfo.icon}</span>
            {selectedCategoryInfo.name}
          </span>
        {:else}
          <span class="placeholder">Select a category...</span>
        {/if}
        <span class="arrow">▼</span>
      </div>

      <!-- Dropdown -->
      {#if showCategoryDropdown}
        <div class="dropdown-menu" transition:fade={{ duration: 100 }}>
          <input
            id="category-search"
            type="text"
            class="search-input"
            placeholder="Search categories..."
            bind:value={searchTerm}
            on:click|stopPropagation
            autoFocus
          />
          <div class="options-list">
            {#each filteredCategories as key}
              <button
                class="option-item"
                class:selected={category === key}
                on:click|stopPropagation={() => selectCategory(key)}
              >
                <span class="cat-icon">{TRIGGER_CATEGORIES[key].icon}</span>
                <span class="cat-name">{TRIGGER_CATEGORIES[key].name}</span>
              </button>
            {:else}
              <div class="no-results">No categories found</div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <div class="time-row">
      <div class="form-group">
        <label for="start-time">Start Time (MM:SS)</label>
        <input
          id="start-time"
          type="text"
          bind:value={startTimeStr}
          placeholder="0:00"
        />
      </div>
      <div class="form-group">
        <label for="end-time">End Time (MM:SS)</label>
        <input
          id="end-time"
          type="text"
          bind:value={endTimeStr}
          placeholder="0:00"
        />
      </div>
    </div>

    <div class="form-group">
      <label for="description">Description (Optional)</label>
      <textarea
        id="description"
        bind:value={description}
        placeholder="Describe the trigger briefly..."
        rows="3"
      ></textarea>
    </div>

    {#if error}
      <div class="error-message" transition:fade>{error}</div>
    {/if}

    <div class="actions">
      <button class="btn-cancel" on:click={handleCancel} disabled={isSubmitting}>
        Cancel
      </button>
      <button class="btn-submit" on:click={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Trigger'}
      </button>
    </div>
  </div>
</div>

<style>
  .submission-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 2147483647; /* Max safe integer */
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .submission-card {
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 24px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    color: white;
  }

  h2 {
    margin: 0 0 20px 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: white;
  }

  .form-group {
    margin-bottom: 16px;
    position: relative;
  }

  label {
    display: block;
    font-size: 0.875rem;
    color: #94a3b8;
    margin-bottom: 6px;
  }

  input, textarea {
    width: 100%;
    background: #334155;
    border: 1px solid #475569;
    border-radius: 8px;
    padding: 10px 12px;
    color: white;
    font-size: 0.9rem;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }

  input:focus, textarea:focus {
    outline: none;
    border-color: #8b5cf6;
  }

  .time-row {
    display: flex;
    gap: 16px;
  }

  .time-row .form-group {
    flex: 1;
  }

  /* Custom Select */
  .custom-select {
    background: #334155;
    border: 1px solid #475569;
    border-radius: 8px;
    padding: 10px 12px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    user-select: none;
  }

  .custom-select:hover {
    border-color: #64748b;
  }

  .custom-select.active {
    border-color: #8b5cf6;
  }

  .placeholder {
    color: #94a3b8;
  }

  .selected-value {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    margin-top: 4px;
    background: #334155;
    border: 1px solid #475569;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    z-index: 10;
    overflow: hidden;
  }

  .search-input {
    width: 100%;
    border: none;
    border-bottom: 1px solid #475569;
    border-radius: 0;
    background: transparent;
    padding: 12px;
  }

  .search-input:focus {
    border-color: #8b5cf6;
  }

  .options-list {
    max-height: 200px;
    overflow-y: auto;
  }

  .option-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 12px;
    background: transparent;
    border: none;
    color: white;
    text-align: left;
    cursor: pointer;
    transition: background 0.1s;
  }

  .option-item:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .option-item.selected {
    background: rgba(139, 92, 246, 0.2);
    color: #c4b5fd;
  }

  .arrow {
    font-size: 0.7rem;
    color: #94a3b8;
  }

  .error-message {
    color: #ef4444;
    font-size: 0.875rem;
    margin-bottom: 16px;
    padding: 8px 12px;
    background: rgba(239, 68, 68, 0.1);
    border-radius: 6px;
  }

  .actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  button {
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .btn-cancel {
    background: transparent;
    border: 1px solid #475569;
    color: #cbd5e1;
  }

  .btn-cancel:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
  }

  .btn-submit {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    border: none;
    color: white;
    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
  }

  .btn-submit:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(124, 58, 237, 0.4);
  }

  .btn-submit:disabled {
    opacity: 0.7;
    transform: none;
    cursor: not-allowed;
  }

  /* Scrollbar for options */
  .options-list::-webkit-scrollbar {
    width: 6px;
  }

  .options-list::-webkit-scrollbar-track {
    background: rgba(0,0,0,0.1);
  }

  .options-list::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.2);
    border-radius: 3px;
  }
</style>
