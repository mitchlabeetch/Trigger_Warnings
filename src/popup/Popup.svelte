<script lang="ts">
  import { onMount } from 'svelte';
  import browser from 'webextension-polyfill';
  import type { Profile } from '@shared/types/Profile.types';
  import SubmitWarning from './components/SubmitWarning.svelte';
  import ProfileCreate from './components/ProfileCreate.svelte';
  import ProfileRename from './components/ProfileRename.svelte';
  import ProfileDelete from './components/ProfileDelete.svelte';

  // Init with explicit null/false to ensure UI renders immediately
  let activeProfile: Profile | null = null;
  let allProfiles: Profile[] = [];
  let loading = false;
  let error: string | null = null;
  let debugLog = 'Svelte Init...';

  // Modal states
  let showSubmitForm = false;
  let showCreateProfile = false;
  let showRenameProfile = false;
  let showDeleteProfile = false;

  let profileToEdit: Profile | null = null;
  let currentVideoId: string | null = null;
  let currentTime = 0;

  function log(msg: string) {
    console.log(`[Popup] ${msg}`);
    // debugLog += `\n${msg}`;
  }

  onMount(async () => {
    log('onMount');

    // Failsafe: verify Svelte is reactive
    setTimeout(() => {
      if (!activeProfile && !error) {
        log('Failsafe: No profile loaded after 1s');
      }
    }, 1000);

    initData();
    checkCurrentVideo();
  });

  async function initData() {
    loading = true;
    try {
      // Use direct chrome API for reliability
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ type: 'GET_ACTIVE_PROFILE' }, (response) => {
          if (chrome.runtime.lastError) {
            error = chrome.runtime.lastError.message || 'Runtime Error';
            loading = false;
            return;
          }
          if (response && response.success) {
            activeProfile = response.data;
            log(`Loaded: ${activeProfile?.name}`);
          } else {
            error = 'Failed to load profile';
          }
          loading = false;
        });

        // Fetch all profiles in background
        chrome.runtime.sendMessage({ type: 'GET_ALL_PROFILES' }, (res) => {
          if (res && res.success) allProfiles = res.data;
        });
      } else {
        // Fallback
        error = 'Chrome API not available';
        loading = false;
      }
    } catch (e) {
      error = String(e);
      loading = false;
    }
  }

  async function checkCurrentVideo() {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          const url = tabs[0].url;
          if (url.includes('youtube.com/watch')) {
            const match = url.match(new RegExp('v=([^&]+)'));
            if (match) currentVideoId = match[1];
          } else if (url.includes('netflix.com/watch')) {
            const match = url.match(new RegExp('watch/(\d+)'));
            if (match) currentVideoId = match[1];
          }
        }
      });
    }
  }

  // Actions
  function switchProfile(id: string) {
    loading = true;
    chrome.runtime.sendMessage({ type: 'SET_ACTIVE_PROFILE', profileId: id }, (res) => {
      if (res && res.success) initData();
      else loading = false;
    });
  }

  function openOptions() {
    if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
    else window.open('options.html');
  }

  // Modal Handlers
  function openSubmitForm() {
    showSubmitForm = true;
  }
  function closeSubmitForm() {
    showSubmitForm = false;
  }

  function openCreateProfile() {
    showCreateProfile = true;
  }
  function closeCreateProfile() {
    showCreateProfile = false;
  }

  function openRenameProfile(p: Profile) {
    profileToEdit = p;
    showRenameProfile = true;
  }
  function closeRenameProfile() {
    showRenameProfile = false;
    profileToEdit = null;
  }

  function openDeleteProfile(p: Profile) {
    profileToEdit = p;
    showDeleteProfile = true;
  }
  function closeDeleteProfile() {
    showDeleteProfile = false;
    profileToEdit = null;
  }

  function handleProfileChange() {
    initData();
  }

  function handleKeydown(e: KeyboardEvent, cb: () => void) {
    if (e.key === 'Escape') cb();
  }
</script>

<div class="popup">
  <header class="popup-header">
    <div class="popup-logo">
      <span class="popup-icon">⚠️</span>
      <h1 class="popup-title">Trigger Warnings</h1>
    </div>
  </header>

  {#if error}
    <div class="popup-error">
      <span class="error-icon">⚠️</span>
      <p class="error-message">Something went wrong</p>
      <p class="error-details">{error}</p>
      <button class="btn btn-secondary" on:click={initData}>Try Again</button>
    </div>
  {:else if loading && !activeProfile}
    <div class="popup-skeleton">
      <div class="skeleton-section">
        <div class="skeleton-label"></div>
        <div class="skeleton-card">
          <div class="skeleton-text skeleton-name"></div>
          <div class="skeleton-text skeleton-stats"></div>
        </div>
      </div>
      <div class="skeleton-section">
        <div class="skeleton-button"></div>
        <div class="skeleton-button"></div>
      </div>
    </div>
  {:else if activeProfile}
    <div class="popup-content">
      <!-- Active Profile -->
      <section class="popup-section">
        <div class="section-header">
          <h2 class="section-title">Active Profile</h2>
          <button class="btn-icon" on:click={openCreateProfile} title="Create new profile">
            ➕
          </button>
        </div>
        <div class="profile-card active">
          <div class="profile-info">
            <span class="profile-name">{activeProfile.name}</span>
            <span class="profile-stats">
              {activeProfile.enabledCategories.length} categories enabled
            </span>
          </div>
          <div class="profile-actions">
            <button
              class="btn-icon-small"
              on:click={() => activeProfile && openRenameProfile(activeProfile)}
              title="Rename">✏️</button
            >
            {#if allProfiles.length > 1}
              <button
                class="btn-icon-small"
                on:click={() => activeProfile && openDeleteProfile(activeProfile)}
                title="Delete">🗑️</button
              >
            {/if}
          </div>
        </div>
      </section>

      <!-- Switch Profile -->
      {#if allProfiles.length > 1}
        <section class="popup-section">
          <h2 class="section-title">Switch Profile</h2>
          <div class="profile-list">
            {#each allProfiles as profile}
              {#if profile.id !== activeProfile.id}
                <button class="profile-card" on:click={() => switchProfile(profile.id)}>
                  <div class="profile-info">
                    <span class="profile-name">{profile.name}</span>
                    <span class="profile-stats">
                      {profile.enabledCategories.length} categories
                    </span>
                  </div>
                </button>
              {/if}
            {/each}
          </div>
        </section>
      {/if}

      <!-- Actions -->
      <section class="popup-section">
        {#if currentVideoId}
          <button class="btn btn-secondary" on:click={openSubmitForm}>
            <span>➕</span> Submit Warning
          </button>
        {/if}
        <button class="btn btn-primary" on:click={openOptions}>
          <span>⚙️</span> Settings & Customization
        </button>
      </section>

      <footer class="popup-footer">
        <p class="popup-info">
          Monitoring {currentVideoId ? 'current video' : 'supported platforms'}.
        </p>
      </footer>
    </div>
  {:else}
    <div class="popup-error">
      No profile loaded.
      <button class="btn btn-secondary" on:click={initData}>Retry</button>
    </div>
  {/if}

  <!-- Modals -->
  {#if showSubmitForm}
    <div
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      on:click={closeSubmitForm}
      on:keydown={(e) => handleKeydown(e, closeSubmitForm)}
    >
      <div class="modal-content" on:click|stopPropagation role="document" tabindex="-1">
        <SubmitWarning onClose={closeSubmitForm} videoId={currentVideoId} {currentTime} />
      </div>
    </div>
  {/if}

  {#if showCreateProfile}
    <div
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      on:click={closeCreateProfile}
      on:keydown={(e) => handleKeydown(e, closeCreateProfile)}
    >
      <div class="modal-content" on:click|stopPropagation role="document" tabindex="-1">
        <ProfileCreate
          onClose={closeCreateProfile}
          onSuccess={handleProfileChange}
          profiles={allProfiles}
        />
      </div>
    </div>
  {/if}

  {#if showRenameProfile && profileToEdit}
    <div
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      on:click={closeRenameProfile}
      on:keydown={(e) => handleKeydown(e, closeRenameProfile)}
    >
      <div class="modal-content" on:click|stopPropagation role="document" tabindex="-1">
        <ProfileRename
          onClose={closeRenameProfile}
          onSuccess={handleProfileChange}
          profile={profileToEdit}
          {allProfiles}
        />
      </div>
    </div>
  {/if}

  {#if showDeleteProfile && profileToEdit}
    <div
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      on:click={closeDeleteProfile}
      on:keydown={(e) => handleKeydown(e, closeDeleteProfile)}
    >
      <div class="modal-content" on:click|stopPropagation role="document" tabindex="-1">
        <ProfileDelete
          onClose={closeDeleteProfile}
          onSuccess={handleProfileChange}
          profile={profileToEdit}
        />
      </div>
    </div>
  {/if}
</div>

<style>
  /* CSS Variables for theming */
  :root {
    --popup-bg: #f8f9fa;
    --card-bg: white;
    --card-active-bg: #f0f4ff;
    --text-primary: #222;
    --text-secondary: #666;
    --text-muted: #888;
    --border-color: #eee;
    --skeleton-bg: #e0e0e0;
    --skeleton-highlight: #d8d8d8;
    --modal-bg: white;
  }

  /* Dark mode override */
  @media (prefers-color-scheme: dark) {
    :root {
      --popup-bg: #1a1a2e;
      --card-bg: #16213e;
      --card-active-bg: #1f3460;
      --text-primary: #eaeaea;
      --text-secondary: #a0a0a0;
      --text-muted: #707070;
      --border-color: #2a2a3e;
      --skeleton-bg: #2a2a3e;
      --skeleton-highlight: #333355;
      --modal-bg: #16213e;
    }
  }

  .popup {
    width: 320px;
    max-height: 600px;
    overflow-y: auto;
    font-family: system-ui, sans-serif;
    background: var(--popup-bg);
  }
  .popup-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 16px;
    color: white;
  }
  .popup-logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .popup-icon {
    font-size: 32px;
  }
  .popup-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }
  .popup-content {
    padding: 10px;
  }
  .popup-section {
    margin-bottom: 12px;
  }
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    margin: 0;
  }

  .profile-card {
    background: var(--card-bg);
    border: 2px solid transparent;
    border-radius: 8px;
    padding: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .profile-card.active {
    border-color: #667eea;
    background: var(--card-active-bg);
    cursor: default;
  }
  .profile-info {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  .profile-name {
    font-weight: 600;
    color: var(--text-primary);
  }
  .profile-stats {
    font-size: 12px;
    color: var(--text-secondary);
  }
  .profile-actions {
    display: flex;
    gap: 4px;
  }
  .profile-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .btn {
    width: 100%;
    padding: 8px;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  .btn-secondary {
    background: var(--card-bg);
    color: #667eea;
    border: 1px solid #667eea;
  }

  .btn-icon,
  .btn-icon-small {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .btn-icon {
    width: 24px;
    height: 24px;
    font-size: 14px;
  }
  .btn-icon-small {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .popup-footer {
    border-top: 1px solid var(--border-color);
    padding-top: 12px;
    margin-top: 12px;
    text-align: center;
    font-size: 11px;
    color: var(--text-muted);
  }
  .popup-error {
    padding: 24px;
    text-align: center;
  }
  .error-icon {
    font-size: 32px;
    display: block;
    margin-bottom: 12px;
  }
  .error-message {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 4px 0;
  }
  .error-details {
    font-size: 12px;
    color: var(--text-muted);
    margin: 0 0 16px 0;
  }

  /* Skeleton loading */
  .popup-skeleton {
    padding: 16px;
  }
  .skeleton-section {
    margin-bottom: 16px;
  }
  .skeleton-label {
    height: 12px;
    width: 100px;
    background: var(--skeleton-bg);
    border-radius: 4px;
    margin-bottom: 12px;
    animation: shimmer 1.5s infinite;
  }
  .skeleton-card {
    background: var(--skeleton-bg);
    border-radius: 8px;
    padding: 12px;
    animation: shimmer 1.5s infinite;
  }
  .skeleton-text {
    background: var(--skeleton-highlight);
    border-radius: 4px;
    animation: shimmer 1.5s infinite;
  }
  .skeleton-name {
    height: 16px;
    width: 120px;
    margin-bottom: 8px;
  }
  .skeleton-stats {
    height: 12px;
    width: 80px;
  }
  .skeleton-button {
    height: 38px;
    background: var(--skeleton-bg);
    border-radius: 6px;
    margin-bottom: 8px;
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }
  .modal-content {
    background: var(--modal-bg);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    width: 90%;
    max-width: 280px;
    overflow: hidden;
  }
</style>
