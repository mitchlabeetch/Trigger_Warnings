/**
 * Profile manager for multi-profile support
 */
import type { Profile, ProfileCreateInput, ProfileUpdateInput } from '@shared/types/Profile.types';
export declare class ProfileManager {
    private static cache;
    /**
     * Generate a unique profile ID
     */
    private static generateId;
    /**
     * Get all profiles
     */
    static getAll(): Promise<Profile[]>;
    /**
     * Get a specific profile by ID
     */
    static get(profileId: string): Promise<Profile | null>;
    /**
     * Get the active profile
     */
    static getActive(): Promise<Profile>;
    /**
     * Set the active profile
     */
    static setActive(profileId: string): Promise<boolean>;
    /**
     * Create a new profile
     */
    static create(input: ProfileCreateInput): Promise<Profile>;
    /**
     * Update a profile
     */
    static update(profileId: string, updates: ProfileUpdateInput): Promise<Profile | null>;
    /**
     * Delete a profile
     */
    static delete(profileId: string): Promise<boolean>;
    /**
     * Create the default profile
     */
    private static createDefaultProfile;
    /**
     * Export a profile to JSON
     */
    static export(profileId: string): Promise<string | null>;
    /**
     * Import a profile from JSON
     */
    static import(json: string): Promise<Profile | null>;
}
//# sourceMappingURL=ProfileManager.d.ts.map