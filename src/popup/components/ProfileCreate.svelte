<script lang="ts">
  import type { Profile } from '@shared/types/Profile.types';
  import browser from 'webextension-polyfill';

  export let onClose: () => void;
  export let onSuccess: () => void;
  export let profiles: Profile[];

  let profileName = '';
  let copyFromId = '';
  let error = '';
  let isSubmitting = false;

  async function handleCreate() {
    // Validation
    if (!profileName.trim()) {
      error = 'Profile name is required';
      return;
    }

    if (profileName.trim().length > 50) {
      error = 'Profile name must be 50 characters or less';
      return;
    }

    if (profiles.some(p => p.name.toLowerCase() === profileName.trim().toLowerCase())) {
      error = 'A profile with this name already exists';
      return;
    }

    isSubmitting = true;
    error = '';

    try {
      const response = await browser.runtime.sendMessage({
        type: 'CREATE_PROFILE',
        profile: {
          name: profileName.trim(),
          copyFrom: copyFromId || undefined,
        },
      });

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        error = response.error || 'Failed to create profile';
      }
    } catch (err) {
      error = 'Failed to create profile';
      console.error('Profile creation error:', err);
    } finally {
      isSubmitting = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !isSubmitting) {
      handleCreate();
    }
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div class="profile-create" on:keydown={handleKeydown}>
  <div class="profile-create-header">
    <h2>Create New Profile</h2>
    <button class="close-btn" on:click={onClose} aria-label="Close">×</button>
  </div>

  <form on:submit|preventDefault={handleCreate}>
    <div class="form-group">
      <label for="profile-name">
        Profile Name
        <span class="required">*</span>
      </label>
      <!-- svelte-ignore a11y-autofocus -->
      <input
        id="profile-name"
        type="text"
        bind:value={profileName}
        placeholder="e.g., Work Safe, Family Mode"
        maxlength="50"
        autofocus
        disabled={isSubmitting}
      />
      <div class="form-hint">
        Choose a descriptive name for your profile
      </div>
    </div>

    <div class="form-group">
      <label for="copy-from">
        Copy Settings From (Optional)
      </label>
      <select id="copy-from" bind:value={copyFromId} disabled={isSubmitting}>
        <option value="">Start from default settings</option>
        {#each profiles as profile}
          <option value={profile.id}>{profile.name}</option>
        {/each}
      </select>
      <div class="form-hint">
        Copy enabled categories and preferences from an existing profile
      </div>
    </div>

    {#if error}
      <div class="error-message">
        {error}
      </div>
    {/if}

    <div class="form-actions">
      <button
        type="button"
        class="btn btn-secondary"
        on:click={onClose}
        disabled={isSubmitting}
      >
        Cancel
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        disabled={isSubmitting || !profileName.trim()}
      >
        {#if isSubmitting}
          Creating...
        {:else}
          Create Profile
        {/if}
      </button>
    </div>
  </form>
</div>

<style>
  .profile-create {
    background: white;
    border-radius: 12px;
    padding: 0;
    width: 100%;
    max-width: 500px;
  }

  .profile-create-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #e5e7eb;
  }

  .profile-create-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #111827;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 28px;
    color: #6b7280;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: background-color 0.2s;
  }

  .close-btn:hover {
    background: #f3f4f6;
    color: #111827;
  }

  form {
    padding: 24px;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
    font-size: 14px;
  }

  .required {
    color: #ef4444;
  }

  .form-group input,
  .form-group select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-group input:disabled,
  .form-group select:disabled {
    background: #f9fafb;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .form-hint {
    margin-top: 6px;
    font-size: 12px;
    color: #6b7280;
  }

  .error-message {
    padding: 12px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    color: #dc2626;
    font-size: 14px;
    margin-bottom: 20px;
  }

  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 24px;
  }

  .btn {
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    font-family: inherit;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #e5e7eb;
  }

  .btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }
</style>
