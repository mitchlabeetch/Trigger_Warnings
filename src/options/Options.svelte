<script lang="ts">
  import { onMount } from 'svelte';
  import browser from 'webextension-polyfill';
  import type { Profile } from '@shared/types/Profile.types';
  import { TRIGGER_CATEGORIES, CATEGORY_KEYS } from '@shared/constants/categories';

  let activeProfile: Profile | null = null;
  let allProfiles: Profile[] = [];
  let loading = true;
  let saving = false;

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      loading = true;

      const activeResponse = await browser.runtime.sendMessage({
        type: 'GET_ACTIVE_PROFILE',
      });

      if (activeResponse.success) {
        activeProfile = activeResponse.data;
      }

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

  async function toggleCategory(categoryKey: string) {
    if (!activeProfile) return;

    const isEnabled = activeProfile.enabledCategories.includes(categoryKey as any);
    const newCategories = isEnabled
      ? activeProfile.enabledCategories.filter((k) => k !== categoryKey)
      : [...activeProfile.enabledCategories, categoryKey as any];

    await updateProfile({
      enabledCategories: newCategories,
    });
  }

  async function updateProfile(updates: any) {
    if (!activeProfile) return;

    try {
      saving = true;

      const response = await browser.runtime.sendMessage({
        type: 'UPDATE_PROFILE',
        profileId: activeProfile.id,
        updates,
      });

      if (response.success) {
        activeProfile = response.data;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      saving = false;
    }
  }

  async function switchProfile(profileId: string) {
    try {
      await browser.runtime.sendMessage({
        type: 'SET_ACTIVE_PROFILE',
        profileId,
      });

      await loadData();
    } catch (error) {
      console.error('Error switching profile:', error);
    }
  }

  function isCategoryEnabled(categoryKey: string): boolean {
    return activeProfile?.enabledCategories.includes(categoryKey as any) ?? false;
  }
</script>

<div class="options">
  <header class="options-header">
    <div class="container">
      <div class="header-content">
        <h1 class="header-title">
          <span class="header-icon">⚠️</span>
          Trigger Warnings Settings
        </h1>
        {#if saving}
          <span class="saving-indicator">Saving...</span>
        {/if}
      </div>
    </div>
  </header>

  <div class="container">
    {#if loading}
      <div class="loading">Loading settings...</div>
    {:else if activeProfile}
      <div class="options-content">
        <!-- Profile Selector -->
        <section class="section">
          <h2 class="section-title">Active Profile</h2>
          <div class="profile-selector">
            {#each allProfiles as profile}
              <button
                class="profile-btn"
                class:active={profile.id === activeProfile.id}
                on:click={() => switchProfile(profile.id)}
              >
                <div class="profile-btn-name">{profile.name}</div>
                <div class="profile-btn-stats">
                  {profile.enabledCategories.length} categories
                </div>
              </button>
            {/each}
          </div>
        </section>

        <!-- Categories -->
        <section class="section">
          <h2 class="section-title">Trigger Warning Categories</h2>
          <p class="section-description">
            Select which trigger warnings you want to see. Click on any category to enable or disable it.
          </p>

          <div class="categories-grid">
            {#each CATEGORY_KEYS as categoryKey}
              {@const category = TRIGGER_CATEGORIES[categoryKey]}
              {@const enabled = isCategoryEnabled(categoryKey)}
              <button
                class="category-card"
                class:enabled
                on:click={() => toggleCategory(categoryKey)}
              >
                <div class="category-icon">{category.icon}</div>
                <div class="category-info">
                  <div class="category-name">{category.name}</div>
                  <div class="category-severity severity-{category.severity}">
                    {category.severity}
                  </div>
                </div>
                <div class="category-toggle">
                  {#if enabled}
                    ✓
                  {/if}
                </div>
              </button>
            {/each}
          </div>
        </section>

        <!-- Info -->
        <section class="section">
          <div class="info-box">
            <h3>How It Works</h3>
            <ul>
              <li>Enable the categories you want to be warned about</li>
              <li>Warnings will appear when watching content on supported platforms</li>
              <li>You can vote on warning accuracy to improve the community database</li>
              <li>Create multiple profiles for different viewing situations</li>
            </ul>
          </div>
        </section>
      </div>
    {:else}
      <div class="error">Failed to load settings</div>
    {/if}
  </div>
</div>

<style>
  .options {
    min-height: 100vh;
    background: #f8f9fa;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }

  .options-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 40px 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-title {
    margin: 0;
    font-size: 32px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .header-icon {
    font-size: 40px;
  }

  .saving-indicator {
    font-size: 14px;
    opacity: 0.9;
  }

  .options-content {
    padding: 40px 0;
  }

  .section {
    margin-bottom: 48px;
  }

  .section-title {
    font-size: 24px;
    font-weight: 600;
    color: #212529;
    margin: 0 0 12px 0;
  }

  .section-description {
    color: #6c757d;
    margin: 0 0 24px 0;
  }

  .profile-selector {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .profile-btn {
    padding: 16px 24px;
    border: 2px solid #dee2e6;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .profile-btn:hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  }

  .profile-btn.active {
    border-color: #667eea;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  }

  .profile-btn-name {
    font-weight: 600;
    color: #212529;
    margin-bottom: 4px;
  }

  .profile-btn-stats {
    font-size: 12px;
    color: #6c757d;
  }

  .categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .category-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border: 2px solid #dee2e6;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .category-card:hover {
    border-color: #adb5bd;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .category-card.enabled {
    border-color: #667eea;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  }

  .category-icon {
    font-size: 32px;
    flex-shrink: 0;
  }

  .category-info {
    flex: 1;
  }

  .category-name {
    font-weight: 600;
    color: #212529;
    margin-bottom: 4px;
  }

  .category-severity {
    font-size: 11px;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.5px;
    padding: 2px 8px;
    border-radius: 4px;
    display: inline-block;
  }

  .severity-high {
    background: #fee;
    color: #c00;
  }

  .severity-medium {
    background: #ffeaa7;
    color: #d63031;
  }

  .severity-low {
    background: #dfe6e9;
    color: #2d3436;
  }

  .category-toggle {
    width: 24px;
    height: 24px;
    border: 2px solid #dee2e6;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: #667eea;
    flex-shrink: 0;
  }

  .category-card.enabled .category-toggle {
    border-color: #667eea;
    background: #667eea;
    color: white;
  }

  .info-box {
    background: white;
    border: 2px solid #dee2e6;
    border-radius: 12px;
    padding: 24px;
  }

  .info-box h3 {
    margin: 0 0 16px 0;
    color: #212529;
  }

  .info-box ul {
    margin: 0;
    padding-left: 20px;
    color: #6c757d;
    line-height: 1.8;
  }

  .loading,
  .error {
    padding: 60px 20px;
    text-align: center;
    color: #6c757d;
  }

  .error {
    color: #dc3545;
  }
</style>
