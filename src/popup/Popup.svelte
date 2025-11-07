<script lang="ts">
  import { onMount } from 'svelte';
  import browser from 'webextension-polyfill';
  import type { Profile } from '@shared/types/Profile.types';
  import SubmitWarning from './components/SubmitWarning.svelte';

  let activeProfile: Profile | null = null;
  let allProfiles: Profile[] = [];
  let loading = true;
  let showSubmitForm = false;
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

  function openSubmitForm() {
    showSubmitForm = true;
  }

  function closeSubmitForm() {
    showSubmitForm = false;
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
        <h2 class="section-title">Active Profile</h2>
        <div class="profile-card active">
          <div class="profile-info">
            <span class="profile-name">{activeProfile.name}</span>
            <span class="profile-stats">
              {activeProfile.enabledCategories.length} categories enabled
            </span>
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
    <div class="modal-overlay" on:click={closeSubmitForm}>
      <div class="modal-content" on:click|stopPropagation>
        <SubmitWarning
          onClose={closeSubmitForm}
          videoId={currentVideoId}
          currentTime={currentTime}
        />
      </div>
    </div>
  {/if}
</div>

<style>
  .popup {
    width: 320px;
    min-height: 400px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background: #f8f9fa;
  }

  .popup-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
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
    padding: 16px;
  }

  .popup-section {
    margin-bottom: 20px;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #495057;
    margin: 0 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .profile-card {
    background: white;
    border: 2px solid transparent;
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
    text-align: left;
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
    padding: 12px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
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
