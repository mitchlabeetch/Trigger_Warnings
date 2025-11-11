<script lang="ts">
  import browser from 'webextension-polyfill';
  import { TRIGGER_CATEGORIES, CATEGORY_KEYS } from '@shared/constants/categories';
  import type { TriggerCategory } from '@shared/types/Warning.types';
  import { detectPlatformFromUrl, type StreamingPlatform } from '@shared/utils/platform-detector';
  import { onMount, onDestroy } from 'svelte';

  export let onClose: () => void;
  export let videoId: string | null;
  export let currentTime: number;

  let detectedPlatform: StreamingPlatform | null = null;
  let timestampUpdateInterval: number | null = null;

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

    // Start live timestamp updates for better UX
    timestampUpdateInterval = window.setInterval(() => {
      updateCurrentTime();
    }, 500); // Update twice per second for smooth live display
  });

  onDestroy(() => {
    if (timestampUpdateInterval) {
      clearInterval(timestampUpdateInterval);
    }
  });

  // Multi-step wizard state
  let currentStep = 1;
  const totalSteps = 4;

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

  function resetStartTime() {
    startTime = Math.max(0, Math.floor(currentTime - 5));
  }

  function resetEndTime() {
    endTime = Math.floor(currentTime + 5);
  }

  function resetBothTimes() {
    resetStartTime();
    resetEndTime();
  }

  // Multi-step navigation
  function goToNextStep() {
    const validationError = validateCurrentStep();
    if (validationError) {
      error = validationError;
      return;
    }
    error = '';
    currentStep++;
  }

  function goToPreviousStep() {
    error = '';
    currentStep--;
  }

  function goToStep(step: number) {
    if (step < currentStep) {
      // Allow going back without validation
      currentStep = step;
      error = '';
    } else if (step > currentStep) {
      // Validate all steps between current and target
      for (let i = currentStep; i < step; i++) {
        const tempStep = currentStep;
        currentStep = i;
        const validationError = validateCurrentStep();
        if (validationError) {
          currentStep = tempStep;
          error = validationError;
          return;
        }
      }
      currentStep = step;
      error = '';
    }
  }

  function validateCurrentStep(): string | null {
    switch (currentStep) {
      case 1: // Category selection
        if (!selectedCategory) {
          return 'Please select a trigger category';
        }
        return null;

      case 2: // Time range
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
        return null;

      case 3: // Description & confidence
        if (description.trim().length > MAX_DESCRIPTION_LENGTH) {
          return `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`;
        }
        if (confidence < 0 || confidence > 100) {
          return 'Confidence must be between 0 and 100';
        }
        return null;

      case 4: // Review
        // Final validation before submission
        return validateForm();

      default:
        return null;
    }
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
    <!-- Progress Steps -->
    <div class="wizard-progress">
      {#each Array(totalSteps) as _, i}
        <button
          class="progress-step"
          class:active={currentStep === i + 1}
          class:completed={currentStep > i + 1}
          on:click={() => goToStep(i + 1)}
          type="button"
        >
          <span class="step-number">{i + 1}</span>
          <span class="step-label">
            {#if i === 0}Category
            {:else if i === 1}Time
            {:else if i === 2}Details
            {:else}Review{/if}
          </span>
        </button>
      {/each}
    </div>

    <form on:submit|preventDefault={handleSubmit}>
      <div class="wizard-content">
        <!-- Step 1: Category Selection -->
        {#if currentStep === 1}
          <div class="wizard-step">
            <h3 class="step-title">Select Trigger Category</h3>
            <p class="step-description">Choose the category that best describes the trigger warning</p>

            <div class="category-grid">
              {#each CATEGORY_KEYS as key}
                <button
                  type="button"
                  class="category-option"
                  class:selected={selectedCategory === key}
                  on:click={() => selectedCategory = key}
                >
                  <span class="category-icon-large">{TRIGGER_CATEGORIES[key].icon}</span>
                  <span class="category-name">{TRIGGER_CATEGORIES[key].name}</span>
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Step 2: Time Range -->
        {#if currentStep === 2}
          <div class="wizard-step">
            <h3 class="step-title">Set Time Range</h3>
            <p class="step-description">Specify when the trigger appears in the video</p>

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
                <button type="button" class="btn-capture" on:click={captureStartTime} title="Capture current video time as start">
                  📍 Set Start
                </button>
                <button type="button" class="btn-capture" on:click={captureEndTime} title="Capture current video time as end">
                  📍 Set End
                </button>
              </div>

              <div class="reset-buttons">
                <button type="button" class="btn-reset" on:click={resetStartTime} title="Reset start time to default">
                  ↺ Reset Start
                </button>
                <button type="button" class="btn-reset" on:click={resetEndTime} title="Reset end time to default">
                  ↺ Reset End
                </button>
                <button type="button" class="btn-reset-all" on:click={resetBothTimes} title="Reset both times to default">
                  ⟲ Reset Both
                </button>
              </div>

              <div class="player-hint">
                Use controls to find exact start/end times, or reset to defaults
              </div>
            </div>

            <!-- Time Range Inputs -->
            <div class="form-row">
              <div class="form-group">
                <label for="start-time">Start Time (seconds)</label>
                <input
                  type="number"
                  id="start-time"
                  bind:value={startTime}
                  min="0"
                />
                <span class="time-display">{formatTime(startTime)}</span>
              </div>

              <div class="form-group">
                <label for="end-time">End Time (seconds)</label>
                <input
                  type="number"
                  id="end-time"
                  bind:value={endTime}
                  min={startTime + 1}
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
          </div>
        {/if}

        <!-- Step 3: Description & Confidence -->
        {#if currentStep === 3}
          <div class="wizard-step">
            <h3 class="step-title">Add Details (Optional)</h3>
            <p class="step-description">Provide additional context and confidence level</p>

            <!-- Description -->
            <div class="form-group">
              <div class="label-with-count">
                <label for="description">Description</label>
                <span class="char-count" class:warning={descriptionLength > MAX_DESCRIPTION_LENGTH * 0.9} class:error={!descriptionValid}>
                  {descriptionLength}/{MAX_DESCRIPTION_LENGTH}
                </span>
              </div>
              <textarea
                id="description"
                bind:value={description}
                placeholder="Brief description of the content..."
                rows="4"
                maxlength={MAX_DESCRIPTION_LENGTH + 50}
              ></textarea>
              {#if !descriptionValid}
                <span class="validation-error">Description is too long</span>
              {/if}
            </div>

            <!-- Confidence -->
            <div class="form-group">
              <label for="confidence">
                Confidence: <strong>{confidence}%</strong>
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
          </div>
        {/if}

        <!-- Step 4: Review & Submit -->
        {#if currentStep === 4}
          <div class="wizard-step">
            <h3 class="step-title">Review & Submit</h3>
            <p class="step-description">Please review your submission</p>

            <div class="review-card">
              <div class="review-item">
                <span class="review-label">Category:</span>
                <span class="review-value">
                  {#if selectedCategory}
                    {TRIGGER_CATEGORIES[selectedCategory].icon} {TRIGGER_CATEGORIES[selectedCategory].name}
                  {/if}
                </span>
              </div>

              <div class="review-item">
                <span class="review-label">Time Range:</span>
                <span class="review-value">
                  {formatTime(startTime)} - {formatTime(endTime)} ({warningDuration}s)
                </span>
              </div>

              {#if description.trim()}
                <div class="review-item">
                  <span class="review-label">Description:</span>
                  <span class="review-value">{description.trim()}</span>
                </div>
              {/if}

              <div class="review-item">
                <span class="review-label">Confidence:</span>
                <span class="review-value">{confidence}%</span>
              </div>
            </div>

            <p class="form-note">
              ⓘ Submitted warnings will be reviewed by the community before appearing to others.
            </p>
          </div>
        {/if}
      </div>

      {#if error}
        <div class="error-message">{error}</div>
      {/if}

      <!-- Wizard Navigation -->
      <div class="wizard-nav">
        {#if currentStep > 1}
          <button type="button" class="btn-nav btn-back" on:click={goToPreviousStep} disabled={submitting}>
            ← Back
          </button>
        {:else}
          <button type="button" class="btn-nav btn-cancel" on:click={onClose} disabled={submitting}>
            Cancel
          </button>
        {/if}

        {#if currentStep < totalSteps}
          <button type="button" class="btn-nav btn-next" on:click={goToNextStep} disabled={submitting}>
            Next →
          </button>
        {:else}
          <button type="submit" class="btn-nav btn-submit" disabled={submitting}>
            {submitting ? 'Submitting...' : '✓ Submit Warning'}
          </button>
        {/if}
      </div>
    </form>
  {/if}
</div>

<style>
  .submit-warning {
    padding: 16px;
    max-height: 580px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .submit-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    flex-shrink: 0;
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
    padding: 10px 12px;
    background: linear-gradient(135deg, #fee 0%, #fdd 100%);
    border: 2px solid #f8b4b4;
    border-radius: 8px;
    color: #c00;
    font-size: 13px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 0;
  }

  .error-message::before {
    content: '⚠️';
    font-size: 16px;
    flex-shrink: 0;
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
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 14px;
  }

  .player-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .player-title {
    font-size: 13px;
    font-weight: 600;
    color: #495057;
  }

  .btn-refresh {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 5px;
    padding: 3px 7px;
    cursor: pointer;
    font-size: 13px;
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
    padding: 8px;
    border-radius: 6px;
    text-align: center;
    font-size: 13px;
    color: #495057;
    margin-bottom: 8px;
    border: 1px solid #dee2e6;
  }

  .player-timestamp strong {
    color: #667eea;
    font-size: 15px;
  }

  .player-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 6px;
    margin-bottom: 8px;
  }

  .btn-player {
    padding: 7px 10px;
    background: white;
    border: 1.5px solid #667eea;
    border-radius: 6px;
    color: #667eea;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
  }

  .btn-player:hover:not(:disabled) {
    background: #667eea;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
  }

  .btn-player:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .capture-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin-bottom: 8px;
  }

  .btn-capture {
    padding: 7px 10px;
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    border: none;
    border-radius: 6px;
    color: white;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-capture:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
  }

  /* Reset buttons */
  .reset-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 6px;
    margin-bottom: 10px;
  }

  .btn-reset,
  .btn-reset-all {
    padding: 6px 8px;
    background: white;
    border: 1.5px solid #dc3545;
    border-radius: 6px;
    color: #dc3545;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-reset:hover,
  .btn-reset-all:hover {
    background: #dc3545;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(220, 53, 69, 0.3);
  }

  .btn-reset-all {
    grid-column: 1 / -1;
    border-color: #fd7e14;
    color: #fd7e14;
  }

  .btn-reset-all:hover {
    background: #fd7e14;
    color: white;
    box-shadow: 0 2px 6px rgba(253, 126, 20, 0.3);
  }

  .player-hint {
    font-size: 10px;
    color: #6c757d;
    text-align: center;
    font-style: italic;
  }

  /* Wizard Progress Steps */
  .wizard-progress {
    display: flex;
    justify-content: space-between;
    padding: 12px 16px;
    background: #f8f9fa;
    border-bottom: 2px solid #dee2e6;
    gap: 6px;
    flex-shrink: 0;
  }

  .progress-step {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px 4px;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .progress-step:hover {
    background: rgba(102, 126, 234, 0.1);
  }

  .progress-step.active {
    background: rgba(102, 126, 234, 0.15);
  }

  .progress-step.completed .step-number {
    background: #28a745;
    color: white;
  }

  .step-number {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #dee2e6;
    color: #6c757d;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.2s;
  }

  .progress-step.active .step-number {
    background: #667eea;
    color: white;
    transform: scale(1.1);
  }

  .step-label {
    font-size: 11px;
    color: #6c757d;
    font-weight: 500;
  }

  .progress-step.active .step-label {
    color: #667eea;
    font-weight: 600;
  }

  /* Wizard Content */
  .wizard-content {
    padding: 16px;
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }

  .wizard-step {
    animation: slideIn 0.3s ease;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .step-title {
    font-size: 17px;
    font-weight: 600;
    color: #212529;
    margin: 0 0 6px 0;
  }

  .step-description {
    font-size: 12px;
    color: #6c757d;
    margin: 0 0 14px 0;
  }

  /* Category Grid (Step 1) */
  .category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(105px, 1fr));
    gap: 8px;
    max-height: 300px;
    overflow-y: auto;
    padding: 2px;
  }

  .category-option {
    background: white;
    border: 2px solid #dee2e6;
    border-radius: 8px;
    padding: 10px 6px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    text-align: center;
  }

  .category-option:hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 3px 10px rgba(102, 126, 234, 0.15);
  }

  .category-option.selected {
    border-color: #667eea;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    box-shadow: 0 3px 10px rgba(102, 126, 234, 0.2);
  }

  .category-icon-large {
    font-size: 26px;
  }

  .category-name {
    font-size: 10px;
    font-weight: 600;
    color: #495057;
    line-height: 1.2;
  }

  .category-option.selected .category-name {
    color: #667eea;
  }

  /* Review Card (Step 4) */
  .review-card {
    background: #f8f9fa;
    border: 2px solid #dee2e6;
    border-radius: 10px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .review-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-bottom: 10px;
    border-bottom: 1px solid #dee2e6;
  }

  .review-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .review-label {
    font-size: 11px;
    font-weight: 600;
    color: #6c757d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .review-value {
    font-size: 13px;
    color: #212529;
    font-weight: 500;
  }

  /* Wizard Navigation */
  .wizard-nav {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    background: #f8f9fa;
    border-top: 2px solid #dee2e6;
    flex-shrink: 0;
  }

  .btn-nav {
    flex: 1;
    padding: 9px 14px;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }

  .btn-back,
  .btn-cancel {
    background: white;
    color: #495057;
    border: 2px solid #dee2e6;
  }

  .btn-back:hover:not(:disabled),
  .btn-cancel:hover:not(:disabled) {
    background: #f8f9fa;
    border-color: #adb5bd;
  }

  .btn-next {
    background: #667eea;
    color: white;
  }

  .btn-next:hover:not(:disabled) {
    background: #5568d3;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .btn-submit {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
  }

  .btn-submit:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
  }

  .btn-nav:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
