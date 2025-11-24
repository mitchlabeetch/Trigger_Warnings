/**
 * Default settings and configurations
 */

import type { Profile } from '../types/Profile.types';
import type { WarningAction } from '../types/Warning.types';
import { CATEGORY_KEYS } from './categories';

export const DEFAULT_LEAD_TIME = 10; // seconds
export const DEFAULT_AUTO_HIDE_TIME = 5; // seconds
export const DEFAULT_FONT_SIZE = 16; // px
export const DEFAULT_TRANSPARENCY = 85; // 0-100
export const DEFAULT_BANNER_DURATION = 5; // seconds

export const DEFAULT_WARNING_ACTION: WarningAction = 'warn';

export const DEFAULT_DISPLAY_SETTINGS = {
  position: 'top-right' as const,
  fontSize: DEFAULT_FONT_SIZE,
  backgroundColor: '#000000',
  transparency: DEFAULT_TRANSPARENCY,
  duration: DEFAULT_BANNER_DURATION,
  spoilerFreeMode: false,
};

export const DEFAULT_PROFILE: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Default Profile',
  isDefault: true,
  enabledCategories: [],
  categoryActions: Object.fromEntries(
    CATEGORY_KEYS.map((key) => [key, DEFAULT_WARNING_ACTION])
  ) as Record<string, WarningAction>,
  display: DEFAULT_DISPLAY_SETTINGS,
  leadTime: DEFAULT_LEAD_TIME,
  soundEnabled: true,
  autoHideTime: DEFAULT_AUTO_HIDE_TIME,
  theme: 'system',
  defaultProtection: 'none', // 'none' means just show warning banner, no video/audio protection
  categoryProtections: {},
};

// Cache expiration time (5 minutes)
export const CACHE_EXPIRATION_MS = 5 * 60 * 1000;

// Supabase configuration
export const SUPABASE_URL = 'https://rzkynplgzcxlaecxlylm.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6a3lucGxnemN4bGFlY3hseWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjE2OTAsImV4cCI6MjA3ODI5NzY5MH0.24lj8QXRK-FS8uQQRtA4H--laEDosdGBCGXnmmnWg_8';

// Auto-approval thresholds
export const AUTO_APPROVE_THRESHOLD = 3;
export const AUTO_REJECT_THRESHOLD = -5;

// Video monitoring interval
export const VIDEO_CHECK_INTERVAL_MS = 250;

// Extension metadata
export const EXTENSION_NAME = 'Trigger Warnings';
export const EXTENSION_VERSION = '2.0.0';
export const GITHUB_URL = 'https://github.com/lightmyfireadmin/triggerwarnings';
export const SUPPORT_EMAIL = 'support@triggerwarnings.app';
