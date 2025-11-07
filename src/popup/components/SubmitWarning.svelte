<script lang="ts">
  import browser from 'webextension-polyfill';
  import { TRIGGER_CATEGORIES, CATEGORY_KEYS } from '@shared/constants/categories';
  import type { TriggerCategory } from '@shared/types/Warning.types';

  export let onClose: () => void;
  export let videoId: string | null;
  export let currentTime: number;

  let selectedCategory: TriggerCategory | null = null;
  let startTime = Math.max(0, Math.floor(currentTime - 5));
  let endTime = Math.floor(currentTime + 5);
  let description = '';
  let confidence = 75;
  let submitting = false;
  let error = '';
  let success = false;

  async function handleSubmit() {
    if (!selectedCategory || !videoId) {
      error = 'Please select a category and ensure you are watching a video';
      return;
    }

    if (startTime >= endTime) {
      error = 'End time must be after start time';
      return;
    }

    try {
      submitting = true;
      error = '';

      const response = await browser.runtime.sendMessage({
        type: 'SUBMIT_WARNING',
        submission: {
          videoId,
          categoryKey: selectedCategory,
          startTime,
          endTime,
          description: description.trim() || undefined,
          confidence,
        },
      });

      if (response.success) {
        success = true;
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        error = response.error || 'Failed to submit warning';
      }
    } catch (err) {
      error = 'Error submitting warning: ' + (err instanceof Error ? err.message : String(err));
    } finally {
      submitting = false;
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }
</script>

<div class="submit-warning">
  <div class="submit-header">
    <h2>Submit Trigger Warning</h2>
    <button class="close-btn" on:click={onClose}>×</button>
  </div>

  {#if success}
    <div class="success-message">
      ✅ Warning submitted successfully!
      <p>Thank you for contributing to the community.</p>
    </div>
  {:else}
    <form on:submit|preventDefault={handleSubmit}>
      <!-- Category Selection -->
      <div class="form-group">
        <label for="category">Trigger Category *</label>
        <select id="category" bind:value={selectedCategory} required>
          <option value={null}>Select a category...</option>
          {#each CATEGORY_KEYS as key}
            <option value={key}>
              {TRIGGER_CATEGORIES[key].icon} {TRIGGER_CATEGORIES[key].name}
            </option>
          {/each}
        </select>
      </div>

      <!-- Time Range -->
      <div class="form-row">
        <div class="form-group">
          <label for="start-time">Start Time (seconds) *</label>
          <input
            type="number"
            id="start-time"
            bind:value={startTime}
            min="0"
            required
          />
          <span class="time-display">{formatTime(startTime)}</span>
        </div>

        <div class="form-group">
          <label for="end-time">End Time (seconds) *</label>
          <input
            type="number"
            id="end-time"
            bind:value={endTime}
            min={startTime + 1}
            required
          />
          <span class="time-display">{formatTime(endTime)}</span>
        </div>
      </div>

      <!-- Description -->
      <div class="form-group">
        <label for="description">Description (optional)</label>
        <textarea
          id="description"
          bind:value={description}
          placeholder="Brief description of the content..."
          rows="3"
        ></textarea>
      </div>

      <!-- Confidence -->
      <div class="form-group">
        <label for="confidence">
          Confidence: {confidence}%
        </label>
        <input
          type="range"
          id="confidence"
          bind:value={confidence}
          min="0"
          max="100"
          step="5"
        />
        <div class="confidence-labels">
          <span>Not sure</span>
          <span>Very confident</span>
        </div>
      </div>

      {#if error}
        <div class="error-message">{error}</div>
      {/if}

      <!-- Actions -->
      <div class="form-actions">
        <button type="button" class="btn-secondary" on:click={onClose} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" class="btn-primary" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Warning'}
        </button>
      </div>

      <p class="form-note">
        * Submitted warnings will be reviewed by the community before appearing to others.
      </p>
    </form>
  {/if}
</div>

<style>
  .submit-warning {
    padding: 20px;
    max-height: 600px;
    overflow-y: auto;
  }

  .submit-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .submit-header h2 {
    margin: 0;
    font-size: 20px;
    color: #212529;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: #f8f9fa;
    border-radius: 50%;
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .close-btn:hover {
    background: #e9ecef;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  label {
    font-size: 14px;
    font-weight: 600;
    color: #495057;
  }

  select,
  input,
  textarea {
    padding: 8px 12px;
    border: 2px solid #dee2e6;
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
    transition: border-color 0.2s;
  }

  select:focus,
  input:focus,
  textarea:focus {
    outline: none;
    border-color: #667eea;
  }

  textarea {
    resize: vertical;
  }

  input[type="range"] {
    padding: 0;
    cursor: pointer;
  }

  .time-display {
    font-size: 12px;
    color: #6c757d;
  }

  .confidence-labels {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #6c757d;
  }

  .form-actions {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }

  .btn-primary,
  .btn-secondary {
    flex: 1;
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: #f8f9fa;
    color: #495057;
    border: 2px solid #dee2e6;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #e9ecef;
  }

  .btn-secondary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .form-note {
    margin: 0;
    font-size: 12px;
    color: #6c757d;
    text-align: center;
  }

  .error-message {
    padding: 12px;
    background: #fee;
    border: 2px solid #fcc;
    border-radius: 6px;
    color: #c00;
    font-size: 14px;
  }

  .success-message {
    padding: 40px 20px;
    text-align: center;
    color: #28a745;
  }

  .success-message p {
    margin: 8px 0 0 0;
    color: #6c757d;
    font-size: 14px;
  }
</style>
