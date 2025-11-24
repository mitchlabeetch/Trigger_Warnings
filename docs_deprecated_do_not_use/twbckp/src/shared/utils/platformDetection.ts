/**
 * Platform detection utilities
 * Can be used from both content scripts and background scripts
 */

export interface PlatformDomains {
  netflix: string[];
  primeVideo: string[];
  youtube: string[];
  hulu: string[];
  disneyPlus: string[];
  max: string[];
  peacock: string[];
}

/**
 * Centralized domain definitions for all supported platforms
 * Single source of truth for domain matching
 */
export const PLATFORM_DOMAINS: PlatformDomains = {
  netflix: ['netflix.com'],
  primeVideo: ['primevideo.com', 'amazon.com'],
  youtube: ['youtube.com'],
  hulu: ['hulu.com'],
  disneyPlus: ['disneyplus.com'],
  max: ['max.com'],
  peacock: ['peacocktv.com'],
};

/**
 * Get all supported domains as a flat array
 */
export function getAllSupportedDomains(): string[] {
  return Object.values(PLATFORM_DOMAINS).flat();
}

/**
 * Check if a URL is a supported streaming platform
 * @param url - Full URL or just hostname to check
 * @returns true if the URL matches any supported platform
 */
export function isSupportedPlatform(url: string): boolean {
  try {
    // Handle both full URLs and just hostnames
    const hostname = url.includes('://') ? new URL(url).hostname : url;

    return getAllSupportedDomains().some((domain) =>
      hostname.includes(domain)
    );
  } catch (error) {
    console.warn('[Platform Detection] Invalid URL:', url);
    return false;
  }
}

/**
 * Extract the platform type from a URL
 * @param url - Full URL or just hostname
 * @returns Platform name or null if not supported
 */
export function getPlatformFromUrl(
  url: string
): keyof PlatformDomains | null {
  try {
    const hostname = url.includes('://') ? new URL(url).hostname : url;

    for (const [platform, domains] of Object.entries(PLATFORM_DOMAINS)) {
      if (domains.some((domain: string) => hostname.includes(domain))) {
        return platform as keyof PlatformDomains;
      }
    }

    return null;
  } catch (error) {
    console.warn('[Platform Detection] Invalid URL:', url);
    return null;
  }
}

/**
 * Get user-friendly platform name
 */
export function getPlatformDisplayName(
  platform: keyof PlatformDomains | null
): string {
  const displayNames: Record<keyof PlatformDomains, string> = {
    netflix: 'Netflix',
    primeVideo: 'Prime Video',
    youtube: 'YouTube',
    hulu: 'Hulu',
    disneyPlus: 'Disney+',
    max: 'Max (HBO)',
    peacock: 'Peacock',
  };

  return platform ? displayNames[platform] : 'Unknown Platform';
}

/**
 * Map platform key to database enum value
 */
export function getPlatformDatabaseValue(
  platform: keyof PlatformDomains | null
): string | null {
  const dbMapping: Record<keyof PlatformDomains, string> = {
    netflix: 'netflix',
    primeVideo: 'prime_video',
    youtube: 'youtube',
    hulu: 'hulu',
    disneyPlus: 'disney_plus',
    max: 'max',
    peacock: 'peacock',
  };

  return platform ? dbMapping[platform] : null;
}
