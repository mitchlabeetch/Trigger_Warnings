<script lang="ts">
  import type { Warning } from '@shared/types/Warning.types';
  import { TRIGGER_CATEGORIES } from '@shared/constants/categories';
  import { formatTimeRange } from '@shared/utils/time';

  export let warning: Warning;
  export let onApprove: (id: string) => void;
  export let onReject: (id: string) => void;

  let isProcessing = false;

  function getCategoryInfo() {
    return TRIGGER_CATEGORIES[warning.categoryKey];
  }

  async function handleApprove() {
    if (isProcessing) return;
    isProcessing = true;
    try {
      await onApprove(warning.id);
    } finally {
      isProcessing = false;
    }
  }

  async function handleReject() {
    if (isProcessing) return;
    isProcessing = true;
    try {
      await onReject(warning.id);
    } finally {
      isProcessing = false;
    }
  }

  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }
</script>

<div class="warning-card">
  <div class="warning-header">
    <div class="category-badge">
      <span class="category-icon">{getCategoryInfo().icon}</span>
      <span class="category-name">{getCategoryInfo().name}</span>
    </div>
    <div class="warning-meta">
      <span class="video-id" title="Video ID: {warning.videoId}">
        {warning.videoId.substring(0, 12)}...
      </span>
      <span class="timestamp">{formatDate(warning.createdAt)}</span>
    </div>
  </div>

  <div class="warning-body">
    <div class="time-range">
      <span class="label">Time:</span>
      <span class="value">{formatTimeRange(warning.startTime, warning.endTime)}</span>
      <span class="duration">
        ({Math.round(warning.endTime - warning.startTime)}s)
      </span>
    </div>

    {#if warning.description}
      <div class="description">
        <span class="label">Description:</span>
        <p>{warning.description}</p>
      </div>
    {/if}

    <div class="stats">
      <div class="stat">
        <span class="stat-label">Score:</span>
        <span class="stat-value" class:positive={warning.score > 0} class:negative={warning.score < 0}>
          {warning.score > 0 ? '+' : ''}{warning.score}
        </span>
      </div>
      <div class="stat">
        <span class="stat-label">Confidence:</span>
        <span class="stat-value">{warning.confidenceLevel}%</span>
      </div>
    </div>
  </div>

  <div class="warning-actions">
    <button
      class="btn btn-approve"
      disabled={isProcessing}
      on:click={handleApprove}
    >
      {isProcessing ? 'Processing...' : '✓ Approve'}
    </button>
    <button
      class="btn btn-reject"
      disabled={isProcessing}
      on:click={handleReject}
    >
      {isProcessing ? 'Processing...' : '✕ Reject'}
    </button>
  </div>
</div>

<style>
  .warning-card {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    padding: 20px;
    transition: all 0.2s ease;
  }

  .warning-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .warning-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
  }

  .category-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 20px;
    font-weight: 600;
    font-size: 14px;
  }

  .category-icon {
    font-size: 18px;
  }

  .warning-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    font-size: 12px;
    color: #666;
  }

  .video-id {
    font-family: monospace;
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .warning-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .time-range,
  .description {
    display: flex;
    gap: 8px;
  }

  .time-range {
    align-items: center;
  }

  .description {
    flex-direction: column;
  }

  .label {
    font-weight: 600;
    color: #333;
    font-size: 14px;
  }

  .value {
    color: #555;
    font-size: 14px;
  }

  .duration {
    color: #999;
    font-size: 13px;
  }

  .description p {
    margin: 4px 0 0 0;
    color: #555;
    font-size: 14px;
    line-height: 1.5;
  }

  .stats {
    display: flex;
    gap: 24px;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .stat-label {
    font-size: 13px;
    color: #666;
  }

  .stat-value {
    font-weight: 600;
    font-size: 14px;
    color: #333;
  }

  .stat-value.positive {
    color: #4caf50;
  }

  .stat-value.negative {
    color: #f44336;
  }

  .warning-actions {
    display: flex;
    gap: 12px;
  }

  .btn {
    flex: 1;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-approve {
    background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
    color: white;
  }

  .btn-approve:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  }

  .btn-reject {
    background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
    color: white;
  }

  .btn-reject:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
  }
</style>
