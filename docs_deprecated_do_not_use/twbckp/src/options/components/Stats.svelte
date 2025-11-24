<script lang="ts">
  import { onMount } from 'svelte';
  import { SupabaseClient } from '@core/api/SupabaseClient';
  import { TRIGGER_CATEGORIES } from '@shared/constants/categories';

  interface Statistics {
    total: number;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
  }

  let stats: Statistics | null = null;
  let loading = true;
  let error = false;

  onMount(async () => {
    await loadStats();
  });

  async function loadStats() {
    loading = true;
    error = false;
    try {
      await SupabaseClient.initialize();
      stats = await SupabaseClient.getStatistics();
    } catch (err) {
      console.error('Failed to load statistics:', err);
      error = true;
    } finally {
      loading = false;
    }
  }

  function getCategoryName(key: string): string {
    return TRIGGER_CATEGORIES[key]?.name || key;
  }

  function getCategoryIcon(key: string): string {
    return TRIGGER_CATEGORIES[key]?.icon || '📝';
  }

  $: totalApproved = stats?.byStatus?.['approved'] || 0;
  $: totalPending = stats?.byStatus?.['pending'] || 0;
  $: totalRejected = stats?.byStatus?.['rejected'] || 0;

  $: categoryStats = stats?.byCategory
    ? Object.entries(stats.byCategory)
        .map(([key, count]) => ({
          key,
          name: getCategoryName(key),
          icon: getCategoryIcon(key),
          count,
        }))
        .sort((a, b) => b.count - a.count)
    : [];
</script>

<section class="stats-container">
  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading statistics...</p>
    </div>
  {:else if error}
    <div class="error-box">
      <h3>⚠️ Failed to Load Statistics</h3>
      <p>Unable to fetch analytics data. Please try again later.</p>
      <button class="retry-btn" on:click={loadStats}>Retry</button>
    </div>
  {:else if stats}
    <!-- Overview Cards -->
    <div class="overview-cards">
      <div class="stat-card total">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-value">{stats.total.toLocaleString()}</div>
          <div class="stat-label">Total Warnings</div>
        </div>
      </div>

      <div class="stat-card approved">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-value">{totalApproved.toLocaleString()}</div>
          <div class="stat-label">Approved</div>
        </div>
      </div>

      <div class="stat-card pending">
        <div class="stat-icon">⏳</div>
        <div class="stat-content">
          <div class="stat-value">{totalPending.toLocaleString()}</div>
          <div class="stat-label">Pending Review</div>
        </div>
      </div>

      <div class="stat-card rejected">
        <div class="stat-icon">❌</div>
        <div class="stat-content">
          <div class="stat-value">{totalRejected.toLocaleString()}</div>
          <div class="stat-label">Rejected</div>
        </div>
      </div>
    </div>

    <!-- Category Breakdown -->
    <div class="section-header">
      <h3>Warnings by Category</h3>
      <p class="section-hint">Distribution of approved warnings across trigger categories</p>
    </div>

    {#if categoryStats.length > 0}
      <div class="category-chart">
        {#each categoryStats as category (category.key)}
          {@const percentage = ((category.count / totalApproved) * 100).toFixed(1)}
          <div class="category-bar">
            <div class="category-info">
              <span class="category-icon">{category.icon}</span>
              <span class="category-name">{category.name}</span>
            </div>
            <div class="bar-container">
              <div
                class="bar-fill"
                style="width: {percentage}%"
              ></div>
            </div>
            <div class="category-stats">
              <span class="count">{category.count}</span>
              <span class="percentage">({percentage}%)</span>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="empty-state">
        <p>No category data available yet.</p>
      </div>
    {/if}

    <!-- Info Box -->
    <div class="info-box">
      <h4>📈 About These Statistics</h4>
      <ul>
        <li>Statistics are updated in real-time from the community database</li>
        <li>Only approved warnings are counted in category breakdowns</li>
        <li>The moderation queue size shows warnings awaiting review</li>
        <li>You can help improve accuracy by voting on warnings you encounter</li>
      </ul>
    </div>
  {/if}
</section>

<style>
  .stats-container {
    width: 100%;
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

  .error-box {
    text-align: center;
    padding: 40px 20px;
    background: #fff5f5;
    border: 2px solid #feb2b2;
    border-radius: 12px;
  }

  .error-box h3 {
    color: #c53030;
    margin: 0 0 12px 0;
    font-size: 20px;
  }

  .error-box p {
    color: #742a2a;
    margin: 0 0 20px 0;
  }

  .retry-btn {
    padding: 10px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .retry-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .overview-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
  }

  .stat-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  }

  .stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  .stat-card.total {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .stat-card.approved {
    background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
    color: white;
  }

  .stat-card.pending {
    background: linear-gradient(135deg, #ff9800 0%, #ff6b00 100%);
    color: white;
  }

  .stat-card.rejected {
    background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
    color: white;
  }

  .stat-icon {
    font-size: 32px;
    flex-shrink: 0;
  }

  .stat-content {
    flex: 1;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 13px;
    opacity: 0.9;
  }

  .section-header {
    margin-bottom: 24px;
  }

  .section-header h3 {
    font-size: 20px;
    font-weight: 700;
    color: #333;
    margin: 0 0 4px 0;
  }

  .section-hint {
    font-size: 14px;
    color: #666;
    margin: 0;
  }

  .category-chart {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 32px;
  }

  .category-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  }

  .category-info {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 180px;
    flex-shrink: 0;
  }

  .category-icon {
    font-size: 20px;
  }

  .category-name {
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }

  .bar-container {
    flex: 1;
    height: 24px;
    background: #f0f0f0;
    border-radius: 12px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    transition: width 0.5s ease;
  }

  .category-stats {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 100px;
    justify-content: flex-end;
    flex-shrink: 0;
  }

  .count {
    font-size: 16px;
    font-weight: 700;
    color: #333;
  }

  .percentage {
    font-size: 13px;
    color: #666;
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    background: white;
    border-radius: 12px;
    color: #666;
  }

  .info-box {
    background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%);
    border-radius: 12px;
    padding: 24px;
    margin-top: 32px;
  }

  .info-box h4 {
    font-size: 16px;
    font-weight: 700;
    color: #006064;
    margin: 0 0 12px 0;
  }

  .info-box ul {
    margin: 0;
    padding-left: 20px;
    color: #00838f;
  }

  .info-box li {
    margin-bottom: 8px;
    font-size: 14px;
    line-height: 1.5;
  }

  .info-box li:last-child {
    margin-bottom: 0;
  }
</style>
