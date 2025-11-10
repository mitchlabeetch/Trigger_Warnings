<script lang="ts">
  import type { Profile } from '@shared/types/Profile.types';
  import browser from 'webextension-polyfill';

  export let onClose: () => void;
  export let onSuccess: () => void;
  export let profile: Profile;

  let error = '';
  let isSubmitting = false;
  let confirmText = '';

  async function handleDelete() {
    if (confirmText !== profile.name) {
      error = 'Please type the profile name to confirm';
      return;
    }

    isSubmitting = true;
    error = '';

    try {
      const response = await browser.runtime.sendMessage({
        type: 'DELETE_PROFILE',
        profileId: profile.id,
      });

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        error = response.error || 'Failed to delete profile';
      }
    } catch (err) {
      error = 'Failed to delete profile';
      console.error('Profile deletion error:', err);
    } finally {
      isSubmitting = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div class="profile-delete" on:keydown={handleKeydown}>
  <div class="profile-delete-header">
    <h2>Delete Profile</h2>
    <button class="close-btn" on:click={onClose} aria-label="Close">×</button>
  </div>

  <div class="profile-delete-content">
    <div class="warning-icon">⚠️</div>

    <div class="warning-text">
      <h3>Are you sure you want to delete this profile?</h3>
      <p>
        This will permanently delete the profile <strong>"{profile.name}"</strong> and all its settings.
      </p>
      <p>
        This action cannot be undone.
      </p>
    </div>

    <form on:submit|preventDefault={handleDelete}>
      <div class="form-group">
        <label for="confirm-text">
          Type <strong>{profile.name}</strong> to confirm
        </label>
        <!-- svelte-ignore a11y-autofocus -->
        <input
          id="confirm-text"
          type="text"
          bind:value={confirmText}
          placeholder={profile.name}
          autofocus
          disabled={isSubmitting}
        />
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
          class="btn btn-danger"
          disabled={isSubmitting || confirmText !== profile.name}
        >
          {#if isSubmitting}
            Deleting...
          {:else}
            Delete Profile
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .profile-delete {
    background: white;
    border-radius: 12px;
    padding: 0;
    width: 100%;
    max-width: 500px;
  }

  .profile-delete-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #e5e7eb;
  }

  .profile-delete-header h2 {
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

  .profile-delete-content {
    padding: 24px;
  }

  .warning-icon {
    font-size: 48px;
    text-align: center;
    margin-bottom: 16px;
  }

  .warning-text {
    text-align: center;
    margin-bottom: 24px;
  }

  .warning-text h3 {
    margin: 0 0 12px 0;
    font-size: 18px;
    font-weight: 600;
    color: #111827;
  }

  .warning-text p {
    margin: 8px 0;
    color: #6b7280;
    line-height: 1.5;
  }

  .warning-text strong {
    color: #111827;
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

  .form-group label strong {
    color: #dc2626;
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
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  .form-group input:disabled {
    background: #f9fafb;
    cursor: not-allowed;
    opacity: 0.6;
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

  .btn-danger {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  }
</style>
