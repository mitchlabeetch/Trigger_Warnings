/**
 * Storage types for browser extension storage
 */
import type { Profile } from './Profile.types';
import type { Warning } from './Warning.types';
export interface StorageSchema {
    activeProfileId: string;
    profiles: Profile[];
    userId: string;
    warningsCache: Record<string, Warning[]>;
    cacheExpiration: Record<string, number>;
    userVotes: Record<string, 'up' | 'down'>;
    ignoredTriggersThisSession: Record<string, string[]>;
    ignoredTriggersForVideo: Record<string, string[]>;
    isFirstRun: boolean;
    lastSync: number;
}
export type StorageKey = keyof StorageSchema;
export interface StorageChange<T = unknown> {
    oldValue?: T;
    newValue?: T;
}
export type StorageChangeCallback<T = unknown> = (change: StorageChange<T>, key: StorageKey) => void;
//# sourceMappingURL=Storage.types.d.ts.map