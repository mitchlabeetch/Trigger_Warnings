<script lang="ts">
  import browser from 'webextension-polyfill';
  import { TRIGGER_CATEGORIES, CATEGORY_KEYS } from '@shared/constants/categories';
  import type { TriggerCategory } from '@shared/types/Warning.types';
  import { detectPlatformFromUrl, type StreamingPlatform } from '@shared/utils/platform-detector';
  import { onMount } from 'svelte';

  export let onClose: () => void;
  export let videoId: string | null;
  export let currentTime: number;

  let detectedPlatform: StreamingPlatform | null = null;

  onMount(async () => {
    // Detect platform from current tab URL
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.url) {
        const detection = detectPlatformFromUrl(tabs[0].url);
        detectedPlatform = detection.platform;
        console.log('[TW SubmitWarning] Detected platform:', detectedPlatform);
      }
    } catch (error) {
      console.error('[TW SubmitWarning] Failed to detect platform:', error);
    }
  });

  let selectedCategory: TriggerCategory | null = null;
  let startTime = Math.max(0, Math.floor(currentTime - 5));
  let endTime = Math.floor(currentTime + 5);
  let description = '';
  let confidence = 75;
  let submitting = false;
  let error = '';
  let success = false;

  // Video player controls
  let currentVideoTime = currentTime;
  let isPlaying = false;
  let loadingPlayer = false;

  const MAX_DESCRIPTION_LENGTH = 500;
  const MIN_WARNING_DURATION = 1; // seconds
  const MAX_WARNING_DURATION = 600; // 10 minutes

  async function controlVideo(action: 'play' | 'pause' | 'seek', seekTime?: number) {
    try {
      loadingPlayer = true;
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]?.id) {
        throw new Error('No active tab found');
      }

      const response = await browser.tabs.sendMessage(tabs[0].id, {
        type: 'CONTROL_VIDEO',
        action,
        seekTime,
      });

      if (response.success) {
        currentVideoTime = response.timestamp;
        isPlaying = !response.paused;
      }
    } catch (error) {
      console.error('Failed to control video:', error);
    } finally {
      loadingPlayer = false;
    }
  }

  async function updateCurrentTime() {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        const response = await browser.tabs.sendMessage(tabs[0].id, {
          type: 'GET_CURRENT_TIMESTAMP',
        });

        if (response.success) {
          currentVideoTime = response.timestamp;
        }
      }
    } catch (error) {
      // Silent fail
    }
  }

  function handlePlayPause() {
    controlVideo(isPlaying ? 'pause' : 'play');
  }

  function handleRewind(seconds: number) {
    const newTime = Math.max(0, currentVideoTime - seconds);
    controlVideo('seek', newTime);
  }

  function captureStartTime() {
    startTime = Math.floor(currentVideoTime);
  }

  function captureEndTime() {
    endTime = Math.floor(currentVideoTime);
  }

  function validateForm(): string | null {
    // Check category
    if (!selectedCategory) {
      return 'Please select a trigger category';
    }

    // Check video ID
    if (!videoId) {
      return 'Cannot submit - no video detected. Please refresh the page.';
    }

    // Check time range validity
    if (startTime < 0) {
      return 'Start time cannot be negative';
    }

    if (endTime <= startTime) {
      return 'End time must be after start time';
    }

    const duration = endTime - startTime;
    if (duration < MIN_WARNING_DURATION) {
      return `Warning must be at least ${MIN_WARNING_DURATION} second(s) long`;
    }

    if (duration > MAX_WARNING_DURATION) {
      return `Warning cannot be longer than ${Math.floor(MAX_WARNING_DURATION / 60)} minutes`;
    }

    // Check description length
    if (description.trim().length > MAX_DESCRIPTION_LENGTH) {
      return `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`;
    }

    // Check confidence
    if (confidence < 0 || confidence > 100) {
      return 'Confidence must be between 0 and 100';
    }

    return null;
  }

  function sanitizeDescription(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .substring(0, MAX_DESCRIPTION_LENGTH); // Enforce max length
  }

  async function handleSubmit() {
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      error = validationError;
      return;
    }

    try {
      submitting = true;
      error = '';

      const sanitizedDescription = sanitizeDescription(description);

      // Ensure we have a platform
      if (!detectedPlatform) {
        error = 'Could not detect streaming platform. Please try again from the video page.';
        submitting = false;
        return;
      }

      const response = await browser.runtime.sendMessage({
        type: 'SUBMIT_WARNING',
        submission: {
          videoId,
          platform: detectedPlatform,
          categoryKey: selectedCategory,
          startTime,
          endTime,
          description: sanitizedDescription || undefined,
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

  // Real-time character count
  $: descriptionLength = description.trim().length;
  $: descriptionValid = descriptionLength <= MAX_DESCRIPTION_LENGTH;

  // Real-time duration calculation
  $: warningDuration = endTime - startTime;
  $: durationValid = warningDuration >= MIN_WARNING_DURATION && warningDuration <= MAX_WARNING_DURATION;
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
      <!-- Video Player Controls -->
      <div class="player-controls">
        <div class="player-header">
          <span class="player-title">🎬 Video Controls</span>
          <button type="button" class="btn-refresh" on:click={updateCurrentTime} disabled={loadingPlayer}>
            🔄
          </button>
        </div>

        <div class="player-timestamp">
          Current Time: <strong>{formatTime(currentVideoTime)}</strong> ({Math.floor(currentVideoTime)}s)
        </div>

        <div class="player-buttons">
          <button type="button" class="btn-player" on:click={handlePlayPause} disabled={loadingPlayer}>
            {isPlaying ? '⏸️' : '▶️'}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button type="button" class="btn-player" on:click={() => handleRewind(5)} disabled={loadingPlayer}>
            ⏪ -5s
          </button>
          <button type="button" class="btn-player" on:click={() => handleRewind(10)} disabled={loadingPlayer}>
            ⏪ -10s
          </button>
        </div>

        <div class="capture-buttons">
          <button type="button" class="btn-capture" on:click={captureStartTime}>
            📍 Set Start Time
          </button>
          <button type="button" class="btn-capture" on:click={captureEndTime}>
            📍 Set End Time
          </button>
        </div>

        <div class="player-hint">
          Use controls to find exact start/end times for the trigger
        </div>
      </div>

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

      <!-- Duration feedback -->
      <div class="duration-feedback" class:valid={durationValid} class:invalid={!durationValid}>
        Duration: {warningDuration} seconds
        {#if !durationValid}
          {#if warningDuration < MIN_WARNING_DURATION}
            (too short - minimum {MIN_WARNING_DURATION}s)
          {:else}
            (too long - maximum {MAX_WARNING_DURATION}s)
          {/if}
        {/if}
      </div>

      <!-- Description -->
      <div class="form-group">
        <div class="label-with-count">
          <label for="description">Description (optional)</label>
          <span class="char-count" class:warning={descriptionLength > MAX_DESCRIPTION_LENGTH * 0.9} class:error={!descriptionValid}>
            {descriptionLength}/{MAX_DESCRIPTION_LENGTH}
          </span>
        </div>
        <textarea
          id="description"
          bind:value={description}
          placeholder="Brief description of the content..."
          rows="3"
          maxlength={MAX_DESCRIPTION_LENGTH + 50}
        ></textarea>
        {#if !descriptionValid}
          <span class="validation-error">Description is too long</span>
        {/if}
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

  /* Validation feedback styles */
  .label-with-count {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .char-count {
    font-size: 12px;
    color: #6c757d;
    font-weight: normal;
  }

  .char-count.warning {
    color: #ff9800;
  }

  .char-count.error {
    color: #dc2626;
    font-weight: 600;
  }

  .duration-feedback {
    font-size: 12px;
    padding: 6px 10px;
    border-radius: 4px;
    margin-top: -8px;
  }

  .duration-feedback.valid {
    color: #28a745;
    background: #d4edda;
  }

  .duration-feedback.invalid {
    color: #dc2626;
    background: #fee;
  }

  .validation-error {
    font-size: 12px;
    color: #dc2626;
    margin-top: 4px;
  }

  /* Video Player Controls */
  .player-controls {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border: 2px solid #dee2e6;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
  }

  .player-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .player-title {
    font-size: 14px;
    font-weight: 600;
    color: #495057;
  }

  .btn-refresh {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  .btn-refresh:hover:not(:disabled) {
    background: #f8f9fa;
    border-color: #667eea;
    transform: rotate(180deg);
  }

  .btn-refresh:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .player-timestamp {
    background: white;
    padding: 10px;
    border-radius: 8px;
    text-align: center;
    font-size: 14px;
    color: #495057;
    margin-bottom: 12px;
    border: 1px solid #dee2e6;
  }

  .player-timestamp strong {
    color: #667eea;
    font-size: 16px;
  }

  .player-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    margin-bottom: 12px;
  }

  .btn-player {
    padding: 8px 12px;
    background: white;
    border: 2px solid #667eea;
    border-radius: 8px;
    color: #667eea;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .btn-player:hover:not(:disabled) {
    background: #667eea;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  }

  .btn-player:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .capture-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 12px;
  }

  .btn-capture {
    padding: 8px 12px;
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-capture:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
  }

  .player-hint {
    font-size: 11px;
    color: #6c757d;
    text-align: center;
    font-style: italic;
  }
</style>
