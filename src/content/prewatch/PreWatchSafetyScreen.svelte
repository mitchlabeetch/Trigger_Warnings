<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { fade, fly, slide } from 'svelte/transition';
  import { quintOut, backOut } from 'svelte/easing';
  import type {
    MediaTriggerData,
    PreWatchCase,
    TriggerSeverity,
  } from '@shared/types/MediaContent.types';
  import type { TriggerCategory } from '@shared/types/Warning.types';
  import { TRIGGER_CATEGORIES } from '@shared/constants/categories';

  // Props
  export let triggerData: MediaTriggerData;
  export let preWatchCase: PreWatchCase;
  export let userCategories: TriggerCategory[] = [];
  export let profileName: string = 'Default';
  export let minDuration: number = 10; // seconds
  export let onComplete: () => void = () => {};
  export let onSkip: () => void = () => {};
  export let onOpenSettings: () => void = () => {};

  // Player bounds awareness (for embed vs fullscreen)
  export let playerBounds: DOMRect | null = null;
  export let isFullscreen: boolean = false;

  const dispatch = createEventDispatcher();

  // State
  let isVisible = true;
  let progress = 0;
  let isProgressStarted = false;
  let currentTriggerIndex = 0;
  let loadedTriggers: TriggerCategory[] = [];
  let interval: ReturnType<typeof setInterval> | null = null;
  let triggerLoadInterval: ReturnType<typeof setInterval> | null = null;

  // UI 9: Loading State
  let isLoadingData = true;

  // Computed
  $: relevantTriggers = getRelevantTriggers();
  $: hasMultipleTriggers = relevantTriggers.length > 1;
  $: statusMessage = getStatusMessage();
  $: protectionLevel = getProtectionLevel();

  function getRelevantTriggers(): Array<{
    category: TriggerCategory;
    severity: TriggerSeverity;
    count: number;
  }> {
    if (!triggerData.overallTriggers) return [];

    const result: Array<{ category: TriggerCategory; severity: TriggerSeverity; count: number }> =
      [];

    for (const category of triggerData.triggeredCategories) {
      // Filter by user preferences if set
      if (userCategories.length > 0 && !userCategories.includes(category)) {
        continue;
      }

      const severityKey = `${category}_severity` as keyof typeof triggerData.overallTriggers;
      const severity = (triggerData.overallTriggers[severityKey] as TriggerSeverity) || 0;
      const count = triggerData.timestampCountByCategory[category] || 0;

      if (severity > 0) {
        result.push({ category, severity, count });
      }
    }

    // Sort by severity (highest first)
    return result.sort((a, b) => b.severity - a.severity);
  }

  function getStatusMessage(): string {
    switch (preWatchCase) {
      case 'no-data':
        return "This content is not covered by our database yet. Please proceed carefully or check online for viewer's feedback if unsure!";
      case 'no-triggers':
        return 'This content is present in our database, but no triggers have been referenced. Remain careful: this does not mean that no triggering content exists!';
      case 'overall-only':
        return "The following content has been flagged with potential triggering content. We do not have precise timestamps for this media yet, so you won't be warned while watching: please proceed with caution!";
      case 'timestamps':
        return 'We have data on when triggering content appears and will warn you according to your preferences. We cannot guarantee all triggers have been flagged: please proceed carefully!';
      default:
        return '';
    }
  }

  function getProtectionLevel(): 'full' | 'partial' | 'none' {
    if (preWatchCase === 'timestamps') return 'full';
    if (preWatchCase === 'overall-only') return 'partial';
    return 'none';
  }

  function getSeverityLabel(severity: TriggerSeverity): string {
    switch (severity) {
      case 1:
        return 'Mild';
      case 2:
        return 'Moderate';
      case 3:
        return 'Severe';
      default:
        return '';
    }
  }

  function getSeverityColor(severity: TriggerSeverity): string {
    switch (severity) {
      case 1:
        return '#fbbf24'; // Yellow
      case 2:
        return '#f97316'; // Orange
      case 3:
        return '#ef4444'; // Red
      default:
        return '#6b7280';
    }
  }

  function getCategoryInfo(category: TriggerCategory) {
    return TRIGGER_CATEGORIES[category] || { name: category, icon: '⚠️', description: '' };
  }

  function startProgressAnimation() {
    if (isProgressStarted) return;
    isProgressStarted = true;

    const totalMs = minDuration * 1000;
    const stepMs = 50;
    const stepProgress = stepMs / totalMs;

    interval = setInterval(() => {
      progress += stepProgress;
      if (progress >= 1) {
        progress = 1;
        if (interval) clearInterval(interval);
        handleComplete();
      }
    }, stepMs);
  }

  function loadTriggersSequentially() {
    if (relevantTriggers.length === 0) {
      // No triggers to load, start progress immediately
      isLoadingData = false;
      startProgressAnimation();
      return;
    }

    // Load triggers one by one with animation delay
    triggerLoadInterval = setInterval(() => {
      if (currentTriggerIndex < relevantTriggers.length) {
        loadedTriggers = [...loadedTriggers, relevantTriggers[currentTriggerIndex].category];
        currentTriggerIndex++;
      } else {
        // All triggers loaded, start progress bar
        if (triggerLoadInterval) clearInterval(triggerLoadInterval);
        isLoadingData = false;
        startProgressAnimation();
      }
    }, 800); // 800ms per trigger for readable animation
  }

  function handleComplete() {
    dispatch('complete');
    onComplete();
    dismissScreen();
  }

  function handleSkip() {
    dispatch('skip');
    onSkip();
    dismissScreen();
  }

  function handleOpenSettings() {
    dispatch('openSettings');
    onOpenSettings();
  }

  function dismissScreen() {
    isVisible = false;
    // Allow transition to complete before final cleanup
    setTimeout(() => {
      dispatch('dismissed');
    }, 500);
  }

  onMount(() => {
    // Start loading triggers after initial fade-in
    setTimeout(() => {
      loadTriggersSequentially();
    }, 500);
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
    if (triggerLoadInterval) clearInterval(triggerLoadInterval);
  });
</script>

{#if isVisible}
  <div
    class="prewatch-screen"
    class:fullscreen={isFullscreen}
    transition:fade={{ duration: 500 }}
    role="dialog"
    aria-modal="true"
    aria-labelledby="prewatch-title"
  >
    <!-- Header with logo -->
    <header class="header" in:fly={{ y: -30, duration: 600, delay: 200, easing: backOut }}>
      <div class="logo">
        <span class="logo-icon">🛡️</span>
        <h1 id="prewatch-title" class="logo-text">Trigger Warnings</h1>
      </div>

      <!-- Protection level indicator -->
      <div
        class="protection-badge"
        class:full={protectionLevel === 'full'}
        class:partial={protectionLevel === 'partial'}
      >
        {#if protectionLevel === 'full'}
          <span class="badge-icon">✓</span>
          <span>Protected</span>
        {:else if protectionLevel === 'partial'}
          <span class="badge-icon">◐</span>
          <span>Limited Data</span>
        {:else}
          <span class="badge-icon">○</span>
          <span>Not Covered</span>
        {/if}
      </div>
    </header>

    <!-- Main content area -->
    <main class="main-content">
      <!-- Status message -->
      <p class="status-message" in:fly={{ y: 20, duration: 500, delay: 400 }}>
        {statusMessage}
      </p>

      <!-- Trigger list (for overall-only and timestamps cases) -->
      {#if preWatchCase === 'overall-only' || preWatchCase === 'timestamps'}
        <div class="trigger-list" in:fade={{ duration: 300, delay: 600 }}>
          {#each loadedTriggers as category, i}
            {@const trigger = relevantTriggers.find((t) => t.category === category)}
            {@const info = getCategoryInfo(category)}
            {#if trigger}
              <div
                class="trigger-item"
                in:fly={{ x: -30, duration: 400, delay: i * 100, easing: quintOut }}
                style="--severity-color: {getSeverityColor(trigger.severity)}"
              >
                <span class="trigger-icon">{info.icon}</span>
                <div class="trigger-details">
                  <span class="trigger-name">{info.name}</span>
                  <span
                    class="trigger-severity"
                    style="color: {getSeverityColor(trigger.severity)}"
                  >
                    {getSeverityLabel(trigger.severity)}
                  </span>
                </div>
                {#if preWatchCase === 'timestamps' && trigger.count > 0}
                  <span class="trigger-count"
                    >{trigger.count} occurrence{trigger.count > 1 ? 's' : ''}</span
                  >
                {/if}
              </div>
            {/if}
          {/each}

          <!-- Loading indicator for remaining triggers or initial data fetch -->
          {#if isLoadingData || currentTriggerIndex < relevantTriggers.length}
            <div class="loading-trigger" in:fade>
              <div class="loading-spinner"></div>
              <span>
                {#if currentTriggerIndex < relevantTriggers.length && relevantTriggers.length > 0}
                   Loading triggers...
                {:else}
                   Analyzing content...
                {/if}
              </span>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Media info (if available) -->
      {#if triggerData.media}
        <div class="media-info" in:fade={{ delay: 800 }}>
          <span class="media-title">{triggerData.media.name}</span>
          {#if triggerData.media.year}
            <span class="media-year">({triggerData.media.year})</span>
          {/if}
        </div>
      {/if}
    </main>

    <!-- Footer with controls -->
    <footer class="footer">
      <!-- Progress bar -->
      <div class="progress-container" in:fade={{ delay: 1000 }}>
        <div class="progress-bar">
          <div class="progress-fill" style="width: {progress * 100}%"></div>
        </div>
        <span class="progress-text">
          {#if !isProgressStarted}
            Loading...
          {:else if progress < 1}
            Starting in {Math.ceil((1 - progress) * minDuration)}s
          {:else}
            Starting...
          {/if}
        </span>
      </div>

      <!-- Skip button -->
      <button class="skip-button" on:click={handleSkip} in:fly={{ y: 20, delay: 1200 }}>
        <span class="play-icon">▶</span>
        <span>Play Now</span>
      </button>

      <!-- Secondary actions -->
      <div class="secondary-actions" in:fade={{ delay: 1400 }}>
        <!-- Current profile -->
        <div class="profile-info">
          <span class="profile-label">Profile:</span>
          <span class="profile-name">{profileName}</span>
        </div>

        <!-- Settings link -->
        <button class="settings-link" on:click={handleOpenSettings}> ⚙️ Settings </button>
      </div>

      <!-- Contribution CTA -->
      <div class="contribution-cta" in:slide={{ delay: 1600 }}>
        <p>
          {#if preWatchCase === 'no-data'}
            🙏 Help us by contributing trigger data for this content!
          {:else if preWatchCase === 'no-triggers'}
            Know of any triggers? Enable Helper Mode to contribute!
          {:else}
            Found something we missed? Enable Helper Mode to help others!
          {/if}
        </p>
        <p class="development-notice">
          Thank you for using Trigger Warnings. The app is still in development and may be missing
          triggers.
        </p>
      </div>
    </footer>
  </div>
{/if}

<style>
  /* Container centers us, so we just need to be the dialog box */
  .prewatch-screen {
    position: relative !important;
    width: 90% !important;
    max-width: 600px !important;
    max-height: 90% !important;
    z-index: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    color: white;
    pointer-events: auto !important;
    box-sizing: border-box !important;

    /* Glassmorphic card styling */
    background: linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.98) 100%);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    padding: 2rem;
    gap: 1.5rem;
    overflow-y: auto;
  }

  .prewatch-screen.fullscreen {
    max-width: 700px;
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .logo-icon {
    font-size: 2rem;
    filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.5));
  }

  .logo-text {
    font-size: 1.5rem;
    font-weight: 700;
    background: linear-gradient(90deg, #60a5fa, #a78bfa);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
  }

  .protection-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 50px;
    background: rgba(107, 114, 128, 0.3);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .protection-badge.full {
    background: rgba(34, 197, 94, 0.3);
    color: #86efac;
  }

  .protection-badge.partial {
    background: rgba(251, 191, 36, 0.3);
    color: #fde047;
  }

  .badge-icon {
    font-size: 1rem;
  }

  /* Main content */
  .main-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .status-message {
    font-size: 1rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.85);
    margin: 0;
    text-align: center;
  }

  /* Trigger list */
  .trigger-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .trigger-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.875rem 1rem;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    border-left: 3px solid var(--severity-color, #6b7280);
    transition:
      transform 0.2s,
      background 0.2s;
  }

  .trigger-item:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: translateX(4px);
  }

  .trigger-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .trigger-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .trigger-name {
    font-weight: 600;
    font-size: 0.95rem;
  }

  .trigger-severity {
    font-size: 0.8rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .trigger-count {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.1);
    padding: 0.25rem 0.625rem;
    border-radius: 50px;
    white-space: nowrap;
  }

  .loading-trigger {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.875rem;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-top-color: rgba(255, 255, 255, 0.7);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Media info */
  .media-info {
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.875rem;
  }

  .media-title {
    font-style: italic;
  }

  .media-year {
    margin-left: 0.25rem;
  }

  /* Footer */
  .footer {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    align-items: center;
  }

  /* Progress bar */
  .progress-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
  }

  .progress-bar {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    border-radius: 3px;
    transition: width 0.05s linear;
  }

  .progress-text {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
  }

  /* Skip button */
  .skip-button {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 2rem;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border: none;
    border-radius: 50px;
    color: white;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      transform 0.2s,
      box-shadow 0.2s;
  }

  .skip-button:hover {
    transform: scale(1.05);
    box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.4);
  }

  .skip-button:active {
    transform: scale(0.98);
  }

  .play-icon {
    font-size: 0.875rem;
  }

  /* Secondary actions */
  .secondary-actions {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .profile-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .profile-name {
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
  }

  .settings-link {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.8rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    transition:
      color 0.2s,
      background 0.2s;
  }

  .settings-link:hover {
    color: rgba(255, 255, 255, 0.9);
    background: rgba(255, 255, 255, 0.1);
  }

  /* Contribution CTA */
  .contribution-cta {
    text-align: center;
    padding: 1rem;
    background: rgba(59, 130, 246, 0.1);
    border-radius: 12px;
    border: 1px solid rgba(59, 130, 246, 0.2);
    width: 100%;
  }

  .contribution-cta p {
    margin: 0;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .contribution-cta p + p {
    margin-top: 0.5rem;
  }

  .development-notice {
    font-size: 0.75rem !important;
    color: rgba(255, 255, 255, 0.5) !important;
    font-style: italic;
  }

  /* Responsive adjustments */
  @media (max-width: 480px) {
    .prewatch-screen {
      padding: 1.5rem;
      gap: 1.25rem;
    }

    .logo-text {
      font-size: 1.25rem;
    }

    .trigger-item {
      padding: 0.75rem;
    }

    .skip-button {
      padding: 0.75rem 1.5rem;
      font-size: 0.9rem;
    }
  }
</style>
