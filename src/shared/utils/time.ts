/**
 * Time formatting utilities
 */

/**
 * Format seconds into MM:SS or HH:MM:SS
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format a countdown (e.g., "in 5 seconds")
 */
export function formatCountdown(seconds: number): string {
  if (seconds < 1) {
    return 'now';
  }
  if (seconds < 60) {
    return `in ${Math.ceil(seconds)}s`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `in ${minutes}m`;
}

/**
 * Format a duration range (e.g., "2:30 - 3:45")
 */
export function formatTimeRange(startSeconds: number, endSeconds: number): string {
  return `${formatTime(startSeconds)} - ${formatTime(endSeconds)}`;
}
