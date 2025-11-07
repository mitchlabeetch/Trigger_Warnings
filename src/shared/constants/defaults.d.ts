/**
 * Default settings and configurations
 */
import type { Profile } from '../types/Profile.types';
import type { WarningAction } from '../types/Warning.types';
export declare const DEFAULT_LEAD_TIME = 10;
export declare const DEFAULT_AUTO_HIDE_TIME = 5;
export declare const DEFAULT_FONT_SIZE = 16;
export declare const DEFAULT_TRANSPARENCY = 85;
export declare const DEFAULT_BANNER_DURATION = 5;
export declare const DEFAULT_WARNING_ACTION: WarningAction;
export declare const DEFAULT_DISPLAY_SETTINGS: {
    position: "top-right";
    fontSize: number;
    backgroundColor: string;
    transparency: number;
    duration: number;
    spoilerFreeMode: boolean;
};
export declare const DEFAULT_PROFILE: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>;
export declare const CACHE_EXPIRATION_MS: number;
export declare const SUPABASE_URL = "https://qasvqvtoyrucrwshojzd.supabase.co";
export declare const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhc3ZxdnRveXJ1Y3J3c2hvanpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0NTExOTUsImV4cCI6MjA1MjAyNzE5NX0.VRbNtqkWYcBIUeJVlXDEwL90q06BFm5t0KVaXe6pB44";
export declare const AUTO_APPROVE_THRESHOLD = 3;
export declare const AUTO_REJECT_THRESHOLD = -5;
export declare const VIDEO_CHECK_INTERVAL_MS = 250;
export declare const EXTENSION_NAME = "Trigger Warnings";
export declare const EXTENSION_VERSION = "2.0.0";
export declare const GITHUB_URL = "https://github.com/lightmyfireadmin/triggerwarnings";
export declare const SUPPORT_EMAIL = "support@triggerwarnings.app";
//# sourceMappingURL=defaults.d.ts.map