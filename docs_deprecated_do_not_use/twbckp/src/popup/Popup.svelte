<script lang="ts">
  import { onMount } from 'svelte';
  import browser from 'webextension-polyfill';
  import type { Profile } from '@shared/types/Profile.types';
  import SubmitWarning from './components/SubmitWarning.svelte';
  import ProfileCreate from './components/ProfileCreate.svelte';
  import ProfileRename from './components/ProfileRename.svelte';
  import ProfileDelete from './components/ProfileDelete.svelte';

  let activeProfile: Profile | null = null;
  let allProfiles: Profile[] = [];
  let loading = true;
  let showSubmitForm = false;
  let showCreateProfile = false;
  let showRenameProfile = false;
  let showDeleteProfile = false;
  let profileToEdit: Profile | null = null;
  let currentVideoId: string | null = null;
  let currentTime = 0;

  onMount(async () => {
    await loadData();
    await checkCurrentVideo();
  });

  async function loadData() {
    try {
      loading = true;

      // Get active profile
      const activeResponse = await browser.runtime.sendMessage({
        type: 'GET_ACTIVE_PROFILE',
      });

      if (activeResponse.success) {
        activeProfile = activeResponse.data;
      }

      // Get all profiles
      const profilesResponse = await browser.runtime.sendMessage({
        type: 'GET_ALL_PROFILES',
      });

      if (profilesResponse.success) {
        allProfiles = profilesResponse.data;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      loading = false;
    }
  }

  async function checkCurrentVideo() {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.url) {
        // Try to extract video ID from various streaming platforms
        const url = tabs[0].url;

        // Netflix: /watch/12345
        const netflixMatch = url.match(/netflix\.com\/watch\/(\d+)/);
        if (netflixMatch) {
          currentVideoId = netflixMatch[1];
          return;
        }

        // Prime Video: /detail/<id> or /gp/video/detail/<id>
        const primeMatch = url.match(/\/detail\/([^/]+)/);
        if (primeMatch && url.includes('primevideo')) {
          currentVideoId = primeMatch[1];
          return;
        }

        // YouTube: ?v=<id>
        const youtubeMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
        if (youtubeMatch) {
          currentVideoId = youtubeMatch[1];
          return;
        }

        // Hulu: /watch/<id>
        const huluMatch = url.match(/hulu\.com\/watch\/([^/]+)/);
        if (huluMatch) {
          currentVideoId = huluMatch[1];
          return;
        }

        // Disney+: /video/<id>
        const disneyMatch = url.match(/disneyplus\.com\/video\/([^/]+)/);
        if (disneyMatch) {
          currentVideoId = disneyMatch[1];
          return;
        }

        // Max: /video/watch/<id>
        const maxMatch = url.match(/max\.com\/video\/watch\/([^/]+)/);
        if (maxMatch) {
          currentVideoId = maxMatch[1];
          return;
        }

        // Peacock: /watch/<id>
        const peacockMatch = url.match(/peacocktv\.com\/watch\/([^/]+)/);
        if (peacockMatch) {
          currentVideoId = peacockMatch[1];
          return;
        }
      }
    } catch (error) {
      console.error('Error checking current video:', error);
    }
  }

  async function switchProfile(profileId: string) {
    try {
      const response = await browser.runtime.sendMessage({
        type: 'SET_ACTIVE_PROFILE',
        profileId,
      });

      if (response.success) {
        await loadData();
      }
    } catch (error) {
      console.error('Error switching profile:', error);
    }
  }

  function openOptions() {
    browser.runtime.openOptionsPage();
  }

  async function openSubmitForm() {
    // Try to get quick-add context first (if user clicked quick-add button)
    try {
      const response = await browser.runtime.sendMessage({
        type: 'GET_QUICK_ADD_CONTEXT',
      });

      if (response.success && response.data) {
        currentTime = response.data.timestamp || 0;
        currentVideoId = response.data.videoId || currentVideoId;
        console.log('[TW Popup] Using quick-add context:', currentTime, currentVideoId);
        showSubmitForm = true;
        return;
      }
    } catch (error) {
      console.warn('[TW Popup] No quick-add context available:', error);
    }

    // If no quick-add context, try to get current timestamp from active tab
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        const response = await browser.tabs.sendMessage(tabs[0].id, {
          type: 'GET_CURRENT_TIMESTAMP',
        });

        if (response.success && response.timestamp !== undefined) {
          currentTime = response.timestamp;
          console.log('[TW Popup] Got current timestamp from tab:', currentTime);
        }
      }
    } catch (error) {
      console.warn('[TW Popup] Could not get current timestamp from tab:', error);
      // Not a critical error, user can still submit with default timestamp
    }

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

  function openRenameProfile(profile: Profile) {
    profileToEdit = profile;
    showRenameProfile = true;
  }

  function closeRenameProfile() {
    showRenameProfile = false;
    profileToEdit = null;
  }

  function openDeleteProfile(profile: Profile) {
    profileToEdit = profile;
    showDeleteProfile = true;
  }

  function closeDeleteProfile() {
    showDeleteProfile = false;
    profileToEdit = null;
  }

  // Keyboard handler for modals (ESC to close)
  function handleModalKeydown(event: KeyboardEvent, closeHandler: () => void) {
    if (event.key === 'Escape') {
      closeHandler();
    }
  }

  async function handleProfileChange() {
    await loadData();
  }
</script>

<div class="popup">
  <header class="popup-header">
    <div class="popup-logo">
      <span class="popup-icon">⚠️</span>
      <h1 class="popup-title">Trigger Warnings</h1>
    </div>
  </header>

  {#if loading}
    <div class="popup-loading">Loading...</div>
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
            <button class="btn-icon-small" on:click={() => openRenameProfile(activeProfile)} title="Rename profile">
              ✏️
            </button>
            {#if allProfiles.length > 1}
              <button class="btn-icon-small" on:click={() => openDeleteProfile(activeProfile)} title="Delete profile">
                🗑️
              </button>
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
                <button
                  class="profile-card"
                  on:click={() => switchProfile(profile.id)}
                >
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
            <span>➕</span>
            Submit Warning
          </button>
        {/if}
        <button class="btn btn-primary" on:click={openOptions}>
          <span>⚙️</span>
          Settings & Customization
        </button>
      </section>

      <!-- Info -->
      <footer class="popup-footer">
        <p class="popup-info">
          Extension is active and monitoring for trigger warnings on {currentVideoId ? 'this video' : 'supported platforms'}.
        </p>
      </footer>
    </div>
  {:else}
    <div class="popup-error">Failed to load profile data</div>
  {/if}

  <!-- Submit Warning Modal -->
  {#if showSubmitForm}
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Submit Warning"
      on:click={closeSubmitForm}
      on:keydown={(e) => handleModalKeydown(e, closeSubmitForm)}
    >
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <div class="modal-content" role="document" on:click|stopPropagation>
        <SubmitWarning
          onClose={closeSubmitForm}
          videoId={currentVideoId}
          currentTime={currentTime}
        />
      </div>
    </div>
  {/if}

  <!-- Create Profile Modal -->
  {#if showCreateProfile}
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Create Profile"
      on:click={closeCreateProfile}
      on:keydown={(e) => handleModalKeydown(e, closeCreateProfile)}
    >
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <div class="modal-content" role="document" on:click|stopPropagation>
        <ProfileCreate
          onClose={closeCreateProfile}
          onSuccess={handleProfileChange}
          profiles={allProfiles}
        />
      </div>
    </div>
  {/if}

  <!-- Rename Profile Modal -->
  {#if showRenameProfile && profileToEdit}
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Rename Profile"
      on:click={closeRenameProfile}
      on:keydown={(e) => handleModalKeydown(e, closeRenameProfile)}
    >
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <div class="modal-content" role="document" on:click|stopPropagation>
        <ProfileRename
          onClose={closeRenameProfile}
          onSuccess={handleProfileChange}
          profile={profileToEdit}
          allProfiles={allProfiles}
        />
      </div>
    </div>
  {/if}

  <!-- Delete Profile Modal -->
  {#if showDeleteProfile && profileToEdit}
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Delete Profile"
      on:click={closeDeleteProfile}
      on:keydown={(e) => handleModalKeydown(e, closeDeleteProfile)}
    >
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <div class="modal-content" role="document" on:click|stopPropagation>
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
  .popup {
    width: 320px;
    max-height: 600px;
    overflow-y: auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background: #f8f9fa;
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

  .popup-section:last-of-type {
    margin-bottom: 6px;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #495057;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .btn-icon {
    background: white;
    border: 2px solid #667eea;
    border-radius: 6px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
    padding: 0;
  }

  .btn-icon:hover {
    background: #667eea;
    transform: scale(1.1);
  }

  .btn-icon-small {
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
    padding: 0;
  }

  .btn-icon-small:hover {
    background: #f3f4f6;
    border-color: #667eea;
    transform: scale(1.05);
  }

  .profile-card {
    background: white;
    border: 2px solid transparent;
    border-radius: 8px;
    padding: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
    text-align: left;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .profile-card:not(.active):hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  }

  .profile-card.active {
    border-color: #667eea;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    cursor: default;
  }

  .profile-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  .profile-actions {
    display: flex;
    gap: 6px;
  }

  .profile-name {
    font-weight: 600;
    color: #212529;
  }

  .profile-stats {
    font-size: 12px;
    color: #6c757d;
  }

  .profile-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .btn {
    width: 100%;
    padding: 8px 12px;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .btn-secondary {
    background: white;
    color: #667eea;
    border: 2px solid #667eea;
  }

  .btn-secondary:hover {
    background: #f8f9ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  }

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
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow: auto;
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .popup-footer {
    border-top: 1px solid #dee2e6;
    padding-top: 16px;
  }

  .popup-info {
    margin: 0;
    font-size: 12px;
    color: #6c757d;
    text-align: center;
    line-height: 1.5;
  }

  .popup-loading,
  .popup-error {
    padding: 40px 20px;
    text-align: center;
    color: #6c757d;
  }

  .popup-error {
    color: #dc3545;
  }
</style>
