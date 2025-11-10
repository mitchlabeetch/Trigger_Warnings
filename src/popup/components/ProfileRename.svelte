<script lang="ts">
  import type { Profile } from '@shared/types/Profile.types';
  import browser from 'webextension-polyfill';

  export let onClose: () => void;
  export let onSuccess: () => void;
  export let profile: Profile;
  export let allProfiles: Profile[];

  let profileName = profile.name;
  let error = '';
  let isSubmitting = false;

  async function handleRename() {
    // Validation
    if (!profileName.trim()) {
      error = 'Profile name is required';
      return;
    }

    if (profileName.trim().length > 50) {
      error = 'Profile name must be 50 characters or less';
      return;
    }

    if (profileName.trim() === profile.name) {
      onClose();
      return;
    }

    if (allProfiles.some(p => p.id !== profile.id && p.name.toLowerCase() === profileName.trim().toLowerCase())) {
      error = 'A profile with this name already exists';
      return;
    }

    isSubmitting = true;
    error = '';

    try {
      const response = await browser.runtime.sendMessage({
        type: 'UPDATE_PROFILE',
        profileId: profile.id,
        updates: {
          name: profileName.trim(),
        },
      });

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        error = response.error || 'Failed to rename profile';
      }
    } catch (err) {
      error = 'Failed to rename profile';
      console.error('Profile rename error:', err);
    } finally {
      isSubmitting = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !isSubmitting) {
      handleRename();
    }
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div class="profile-rename" on:keydown={handleKeydown}>
  <div class="profile-rename-header">
    <h2>Rename Profile</h2>
    <button class="close-btn" on:click={onClose} aria-label="Close">×</button>
  </div>

  <form on:submit|preventDefault={handleRename}>
    <div class="form-group">
      <label for="profile-name">
        New Profile Name
        <span class="required">*</span>
      </label>
      <!-- svelte-ignore a11y-autofocus -->
      <input
        id="profile-name"
        type="text"
        bind:value={profileName}
        placeholder="Enter new name"
        maxlength="50"
        autofocus
        disabled={isSubmitting}
      />
      <div class="form-hint">
        Current name: <strong>{profile.name}</strong>
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
          Renaming...
        {:else}
          Rename
        {/if}
      </button>
    </div>
  </form>
</div>

<style>
  .profile-rename {
    background: white;
    border-radius: 12px;
    padding: 0;
    width: 100%;
    max-width: 450px;
  }

  .profile-rename-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #e5e7eb;
  }

  .profile-rename-header h2 {
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

  .form-group input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .form-group input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-group input:disabled {
    background: #f9fafb;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .form-hint {
    margin-top: 6px;
    font-size: 12px;
    color: #6b7280;
  }

  .form-hint strong {
    color: #111827;
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
