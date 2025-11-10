/**
 * User profile types for multi-profile support
 */
import type { TriggerCategory, WarningAction } from './Warning.types';
export type BannerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type Theme = 'light' | 'dark' | 'system';
export type ProtectionType = 'none' | 'blackout' | 'mute' | 'both';
export interface DisplaySettings {
    position: BannerPosition;
    fontSize: number;
    backgroundColor: string;
    transparency: number;
    duration: number;
    spoilerFreeMode: boolean;
}
export interface Profile {
    id: string;
    name: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
    enabledCategories: TriggerCategory[];
    categoryActions: Record<TriggerCategory, WarningAction>;
    display: DisplaySettings;
    leadTime: number;
    soundEnabled: boolean;
    autoHideTime: number;
    theme: Theme;
    defaultProtection: ProtectionType;
    categoryProtections: Partial<Record<TriggerCategory, ProtectionType>>;
}
export interface ProfileCreateInput {
    name: string;
    isDefault?: boolean;
    copyFrom?: string;
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
//# sourceMappingURL=Profile.types.d.ts.map