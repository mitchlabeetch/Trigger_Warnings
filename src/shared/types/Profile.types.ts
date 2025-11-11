/**
 * User profile types for multi-profile support
 */

import type { TriggerCategory, WarningAction } from './Warning.types';

export type BannerPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export type Theme = 'light' | 'dark' | 'system';

export type ProtectionType = 'none' | 'blackout' | 'mute' | 'both';

export interface DisplaySettings {
  position: BannerPosition;
  fontSize: number; // px
  backgroundColor: string;
  transparency: number; // 0-100
  duration: number; // seconds
  spoilerFreeMode: boolean;
}

export interface Profile {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Warning preferences
  enabledCategories: TriggerCategory[];
  categoryActions: Record<TriggerCategory, WarningAction>;

  // Display settings
  display: DisplaySettings;

  // Advanced settings
  leadTime: number; // seconds before warning to show alert
  soundEnabled: boolean;
  autoHideTime: number; // seconds
  theme: Theme;

  // Protection settings (what happens DURING the trigger)
  defaultProtection: ProtectionType;
  categoryProtections: Partial<Record<TriggerCategory, ProtectionType>>; // Per-category overrides
}

export interface ProfileCreateInput {
  name: string;
  isDefault?: boolean;
  copyFrom?: string; // Profile ID to copy settings from
}

export interface ProfileUpdateInput {
  name?: string;
  enabledCategories?: TriggerCategory[];
  categoryActions?: Partial<Record<TriggerCategory, WarningAction>>;
  display?: Partial<DisplaySettings>;
  leadTime?: number;
  soundEnabled?: boolean;
  autoHideTime?: number;
  theme?: Theme;
  defaultProtection?: ProtectionType;
  categoryProtections?: Partial<Record<TriggerCategory, ProtectionType>>;
}
