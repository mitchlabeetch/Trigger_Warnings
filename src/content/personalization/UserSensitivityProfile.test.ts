import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserSensitivityProfileManager } from './UserSensitivityProfile';
import { StorageAdapter } from '@core/storage/StorageAdapter';

// Mock StorageAdapter
vi.mock('@core/storage/StorageAdapter', () => ({
  StorageAdapter: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

describe('UserSensitivityProfileManager', () => {
  let manager: UserSensitivityProfileManager;

  beforeEach(() => {
    manager = new UserSensitivityProfileManager();
    vi.clearAllMocks();
  });

  it('should load profile from storage', async () => {
    const mockProfile = {
      userId: 'test-user',
      categorySettings: { blood: 'low' },
      advancedSettings: { nighttimeMode: false },
      lastUpdated: Date.now(),
      version: 1,
    };

    (StorageAdapter.get as any).mockResolvedValue(mockProfile);

    const profile = await manager.loadProfile('test-user');
    expect(profile).toBe(mockProfile);
    expect(StorageAdapter.get).toHaveBeenCalledWith('sensitivity_profile_test-user');
  });

  it('should return default profile if not found in storage', async () => {
    (StorageAdapter.get as any).mockResolvedValue(null);

    const profile = await manager.loadProfile('test-user');
    expect(profile.userId).toBe('test-user');
    expect(profile.categorySettings['blood']).toBe('high'); // Default
    expect(StorageAdapter.get).toHaveBeenCalledWith('sensitivity_profile_test-user');
  });

  it('should save profile to storage', async () => {
    const mockProfile: any = {
      userId: 'test-user',
      categorySettings: {},
      advancedSettings: {},
      lastUpdated: 0,
      version: 1,
    };

    await manager.saveProfile(mockProfile);

    expect(StorageAdapter.set).toHaveBeenCalledWith(
      'sensitivity_profile_test-user',
      expect.objectContaining({ userId: 'test-user' })
    );
  });
});
