<script lang="ts">
  import { onMount } from 'svelte';
  import type { Warning } from '@shared/types/Warning.types';
  import { SupabaseClient } from '@core/api/SupabaseClient';
  import WarningReview from './components/WarningReview.svelte';
  import ToastContainer from '@shared/components/ToastContainer.svelte';
  import { toast } from '@shared/utils/toast';

  let warnings: Warning[] = [];
  let isLoading = true;
  let currentPage = 0;
  const PAGE_SIZE = 20;

  // Filters
  let filterCategory: string = 'all';
  let filterMinScore: number = -10;
  let sortBy: 'newest' | 'oldest' | 'score' = 'newest';

  onMount(async () => {
    await SupabaseClient.initialize();
    await loadWarnings();
  });

  async function loadWarnings() {
    isLoading = true;
    try {
      const offset = currentPage * PAGE_SIZE;
      const allWarnings = await SupabaseClient.getPendingWarnings(100, 0);

      // Apply filters
      let filtered = allWarnings;

      if (filterCategory !== 'all') {
        filtered = filtered.filter((w) => w.categoryKey === filterCategory);
      }

      filtered = filtered.filter((w) => w.score >= filterMinScore);

      // Apply sorting
      if (sortBy === 'newest') {
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      } else if (sortBy === 'oldest') {
        filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      } else if (sortBy === 'score') {
        filtered.sort((a, b) => b.score - a.score);
      }

      warnings = filtered.slice(offset, offset + PAGE_SIZE);
    } catch (error) {
      console.error('Failed to load warnings:', error);
      toast.error('Failed to load pending warnings');
    } finally {
      isLoading = false;
    }
  }

  async function handleApprove(id: string) {
    const success = await SupabaseClient.approveWarning(id);
    if (success) {
      toast.success('Warning approved!');
      warnings = warnings.filter((w) => w.id !== id);
    } else {
      toast.error('Failed to approve warning');
    }
  }

  async function handleReject(id: string) {
    const success = await SupabaseClient.rejectWarning(id);
    if (success) {
      toast.success('Warning rejected');
      warnings = warnings.filter((w) => w.id !== id);
    } else {
      toast.error('Failed to reject warning');
    }
  }

  function nextPage() {
    currentPage++;
    loadWarnings();
  }

  function prevPage() {
    if (currentPage > 0) {
      currentPage--;
      loadWarnings();
    }
  }

  // Reload when filters change
  $: {
    filterCategory;
    filterMinScore;
    sortBy;
    currentPage = 0;
    loadWarnings();
  }
</script>

<div class="moderation-page">
  <header class="header">
    <h1>🛡️ Moderation Dashboard</h1>
    <p class="subtitle">Review and approve pending trigger warnings</p>
  </header>

  <div class="filters">
    <div class="filter-group">
      <label for="category-filter">Category:</label>
      <select id="category-filter" bind:value={filterCategory}>
        <option value="all">All Categories</option>
        <option value="violence">Violence</option>
        <option value="sexual_content">Sexual Content</option>
        <option value="substance_abuse">Substance Abuse</option>
        <option value="mental_health">Mental Health</option>
        <option value="gore">Gore</option>
        <option value="abuse">Abuse</option>
        <option value="death">Death</option>
        <option value="discrimination">Discrimination</option>
        <option value="animals">Animals</option>
        <option value="medical">Medical</option>
      </select>
    </div>

    <div class="filter-group">
      <label for="score-filter">Min Score:</label>
      <input
        id="score-filter"
        type="number"
        bind:value={filterMinScore}
        min="-10"
        max="100"
      />
    </div>

    <div class="filter-group">
      <label for="sort-filter">Sort By:</label>
      <select id="sort-filter" bind:value={sortBy}>
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="score">Highest Score</option>
      </select>
    </div>
  </div>

  <div class="content">
    {#if isLoading}
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading pending warnings...</p>
      </div>
    {:else if warnings.length === 0}
      <div class="empty-state">
        <div class="empty-icon">✨</div>
        <h2>No Pending Warnings</h2>
        <p>Great job! The moderation queue is empty.</p>
      </div>
    {:else}
      <div class="warnings-grid">
        {#each warnings as warning (warning.id)}
          <WarningReview
            {warning}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        {/each}
      </div>

      <div class="pagination">
        <button
          class="btn-page"
          disabled={currentPage === 0}
          on:click={prevPage}
        >
          ← Previous
        </button>
        <span class="page-info">Page {currentPage + 1}</span>
        <button
          class="btn-page"
          disabled={warnings.length < PAGE_SIZE}
          on:click={nextPage}
        >
          Next →
        </button>
      </div>
    {/if}
  </div>
</div>

<ToastContainer />

<style>
  .moderation-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    padding: 40px 20px;
  }

  .header {
    text-align: center;
    margin-bottom: 40px;
  }

  .header h1 {
    font-size: 36px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 8px 0;
  }

  .subtitle {
    color: #666;
    font-size: 16px;
    margin: 0;
  }

  .filters {
    max-width: 1200px;
    margin: 0 auto 32px;
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .filter-group label {
    font-size: 13px;
    font-weight: 600;
    color: #666;
  }

  .filter-group select,
  .filter-group input {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    background: white;
    cursor: pointer;
  }

  .filter-group select:focus,
  .filter-group input:focus {
    outline: none;
    border-color: #667eea;
  }

  .content {
    max-width: 1200px;
    margin: 0 auto;
  }

  .loading {
    text-align: center;
    padding: 60px 20px;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .empty-state {
    text-align: center;
    padding: 80px 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }

  .empty-state h2 {
    font-size: 24px;
    color: #333;
    margin: 0 0 8px 0;
  }

  .empty-state p {
    color: #666;
    font-size: 16px;
    margin: 0;
  }

  .warnings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
  }

  @media (max-width: 768px) {
    .warnings-grid {
      grid-template-columns: 1fr;
    }
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    padding: 20px;
  }

  .btn-page {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-page:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .btn-page:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .page-info {
    font-weight: 600;
    color: #333;
  }
</style>
