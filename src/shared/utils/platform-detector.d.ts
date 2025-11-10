/**
 * Platform detection utilities
 */
export type StreamingPlatform = 'netflix' | 'prime_video' | 'youtube' | 'hulu' | 'disney_plus' | 'max' | 'peacock';
export interface PlatformDetectionResult {
    platform: StreamingPlatform | null;
    videoId: string | null;
}
/**
 * Detect streaming platform and video ID from URL
 */
export declare function detectPlatformFromUrl(url: string): PlatformDetectionResult;
/**
 * Get platform display name
 */
export declare function getPlatformName(platform: StreamingPlatform): string;
//# sourceMappingURL=platform-detector.d.ts.map