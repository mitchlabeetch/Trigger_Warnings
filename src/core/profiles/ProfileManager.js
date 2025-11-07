/**
 * Profile manager for multi-profile support
 */
import { StorageAdapter } from '../storage/StorageAdapter';
import { DEFAULT_PROFILE } from '@shared/constants/defaults';
export class ProfileManager {
    static cache = new Map();
    /**
     * Generate a unique profile ID
     */
    static generateId() {
        return `profile_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * Get all profiles
     */
    static async getAll() {
        const profiles = await StorageAdapter.get('profiles');
        if (!profiles || profiles.length === 0) {
            // Create default profile
            const defaultProfile = await this.createDefaultProfile();
            return [defaultProfile];
        }
        // Update cache
        profiles.forEach((profile) => {
            this.cache.set(profile.id, profile);
        });
        return profiles;
    }
    /**
     * Get a specific profile by ID
     */
    static async get(profileId) {
        // Check cache first
        if (this.cache.has(profileId)) {
            return this.cache.get(profileId);
        }
        // Load from storage
        const profiles = await this.getAll();
        return profiles.find((p) => p.id === profileId) || null;
    }
    /**
     * Get the active profile
     */
    static async getActive() {
        const activeProfileId = await StorageAdapter.get('activeProfileId');
        if (activeProfileId) {
            const profile = await this.get(activeProfileId);
            if (profile)
                return profile;
        }
        // No active profile, get default or create one
        const profiles = await this.getAll();
        const defaultProfile = profiles.find((p) => p.isDefault);
        if (defaultProfile) {
            await this.setActive(defaultProfile.id);
            return defaultProfile;
        }
        // No default profile, create one
        return await this.createDefaultProfile();
    }
    /**
     * Set the active profile
     */
    static async setActive(profileId) {
        const profile = await this.get(profileId);
        if (!profile)
            return false;
        return await StorageAdapter.set('activeProfileId', profileId);
    }
    /**
     * Create a new profile
     */
    static async create(input) {
        const profiles = await this.getAll();
        // If copying from another profile
        let baseSettings = { ...DEFAULT_PROFILE };
        if (input.copyFrom) {
            const sourceProfile = await this.get(input.copyFrom);
            if (sourceProfile) {
                baseSettings = {
                    name: input.name,
                    isDefault: input.isDefault ?? false,
                    enabledCategories: [...sourceProfile.enabledCategories],
                    categoryActions: { ...sourceProfile.categoryActions },
                    display: { ...sourceProfile.display },
                    leadTime: sourceProfile.leadTime,
                    soundEnabled: sourceProfile.soundEnabled,
                    autoHideTime: sourceProfile.autoHideTime,
                    theme: sourceProfile.theme,
                };
            }
        }
        const now = new Date();
        const newProfile = {
            ...baseSettings,
            id: this.generateId(),
            name: input.name,
            isDefault: input.isDefault ?? false,
            createdAt: now,
            updatedAt: now,
        };
        // If this is default, unset other defaults
        if (newProfile.isDefault) {
            profiles.forEach((p) => {
                p.isDefault = false;
            });
        }
        profiles.push(newProfile);
        await StorageAdapter.set('profiles', profiles);
        // Update cache
        this.cache.set(newProfile.id, newProfile);
        // Set as active if it's the first profile
        if (profiles.length === 1) {
            await this.setActive(newProfile.id);
        }
        return newProfile;
    }
    /**
     * Update a profile
     */
    static async update(profileId, updates) {
        const profiles = await this.getAll();
        const profile = profiles.find((p) => p.id === profileId);
        if (!profile)
            return null;
        // Apply updates
        if (updates.name !== undefined)
            profile.name = updates.name;
        if (updates.enabledCategories !== undefined)
            profile.enabledCategories = updates.enabledCategories;
        if (updates.categoryActions !== undefined) {
            profile.categoryActions = { ...profile.categoryActions, ...updates.categoryActions };
        }
        if (updates.display !== undefined) {
            profile.display = { ...profile.display, ...updates.display };
        }
        if (updates.leadTime !== undefined)
            profile.leadTime = updates.leadTime;
        if (updates.soundEnabled !== undefined)
            profile.soundEnabled = updates.soundEnabled;
        if (updates.autoHideTime !== undefined)
            profile.autoHideTime = updates.autoHideTime;
        if (updates.theme !== undefined)
            profile.theme = updates.theme;
        profile.updatedAt = new Date();
        await StorageAdapter.set('profiles', profiles);
        // Update cache
        this.cache.set(profile.id, profile);
        return profile;
    }
    /**
     * Delete a profile
     */
    static async delete(profileId) {
        const profiles = await this.getAll();
        const index = profiles.findIndex((p) => p.id === profileId);
        if (index === -1)
            return false;
        // Can't delete the last profile
        if (profiles.length === 1) {
            console.warn('[TW ProfileManager] Cannot delete the last profile');
            return false;
        }
        profiles.splice(index, 1);
        await StorageAdapter.set('profiles', profiles);
        // Remove from cache
        this.cache.delete(profileId);
        // If this was the active profile, set another as active
        const activeProfileId = await StorageAdapter.get('activeProfileId');
        if (activeProfileId === profileId) {
            await this.setActive(profiles[0].id);
        }
        return true;
    }
    /**
     * Create the default profile
     */
    static async createDefaultProfile() {
        const profile = await this.create({
            name: 'Default Profile',
            isDefault: true,
        });
        await this.setActive(profile.id);
        return profile;
    }
    /**
     * Export a profile to JSON
     */
    static async export(profileId) {
        const profile = await this.get(profileId);
        if (!profile)
            return null;
        return JSON.stringify(profile, null, 2);
    }
    /**
     * Import a profile from JSON
     */
    static async import(json) {
        try {
            const data = JSON.parse(json);
            // Validate the profile data
            if (!data.name || !data.enabledCategories || !data.categoryActions || !data.display) {
                console.error('[TW ProfileManager] Invalid profile data');
                return null;
            }
            // Create new profile with imported data
            const profile = await this.create({
                name: `${data.name} (Imported)`,
            });
            // Update with imported settings
            await this.update(profile.id, {
                enabledCategories: data.enabledCategories,
                categoryActions: data.categoryActions,
                display: data.display,
                leadTime: data.leadTime,
                soundEnabled: data.soundEnabled,
                autoHideTime: data.autoHideTime,
                theme: data.theme,
            });
            return await this.get(profile.id);
        }
        catch (error) {
            console.error('[TW ProfileManager] Error importing profile:', error);
            return null;
        }
    }
}
//# sourceMappingURL=ProfileManager.js.map