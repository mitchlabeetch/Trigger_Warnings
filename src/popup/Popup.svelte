<script lang="ts">
  import { onMount } from 'svelte';
  import browser from 'webextension-polyfill';
  import type { Profile } from '@shared/types/Profile.types';

  let activeProfile: Profile | null = null;
  let allProfiles: Profile[] = [];
  let loading = true;

  onMount(async () => {
    await loadData();
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
        <button class="btn btn-primary" on:click={openOptions}>
          <span>⚙️</span>
          Settings & Customization
        </button>
      </section>

      <!-- Info -->
      <footer class="popup-footer">
        <p class="popup-info">
          Extension is active and monitoring for trigger warnings on supported platforms.
        </p>
      </footer>
    </div>
  {:else}
    <div class="popup-error">Failed to load profile data</div>
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
