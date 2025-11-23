/**
 * Storage types for browser extension storage
 */

import type { Profile } from './Profile.types';
import type { Warning } from './Warning.types';
// import type { UserSensitivityProfile } from '../../content/personalization/UserSensitivityProfile'; // Removed to avoid circular dependency
import type { UserSensitivityProfile } from './UserSensitivityProfile.types';

export interface StorageSchema {
  // Active profile
  activeProfileId: string;

  // All user profiles
  profiles: Profile[];

  // User ID for anonymous submissions
  userId: string;

  // Cached warnings (keyed by videoId)
  warningsCache: Record<string, Warning[]>;

  // Cache expiration times
  cacheExpiration: Record<string, number>;

  // User votes (to prevent duplicate voting)
  userVotes: Record<string, 'up' | 'down'>; // triggerId -> vote type

  // Ignored warnings
  ignoredTriggersThisSession: Record<string, string[]>; // videoId -> triggerId[]
  ignoredTriggersForVideo: Record<string, string[]>; // videoId -> categoryKey[]

  // First run flag
  isFirstRun: boolean;

  // Last sync timestamp
  lastSync: number;

  // Quick add context (for trigger submission with auto-filled timestamp)
  quickAddContext: {
    videoId: string;
    timestamp: number;
    savedAt: number;
  };

  // Note: Dynamic keys like `sensitivity_profile_${string}` are handled via casting in usage
  // as strict TypeScript interfaces do not support template literal keys mixed with static keys.
}

export type StorageKey = keyof StorageSchema;

export interface StorageChange<T = unknown> {
  oldValue?: T;
  newValue?: T;
}

export type StorageChangeCallback<T = unknown> = (
  change: StorageChange<T>,
  key: StorageKey
) => void;
