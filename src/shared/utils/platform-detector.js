/**
 * Platform detection utilities
 */
/**
 * Detect streaming platform and video ID from URL
 */
export function detectPlatformFromUrl(url) {
    if (!url) {
        return { platform: null, videoId: null };
    }
    // Netflix: /watch/12345
    const netflixMatch = url.match(/netflix\.com\/watch\/(\d+)/);
    if (netflixMatch) {
        return { platform: 'netflix', videoId: netflixMatch[1] };
    }
    // Prime Video: /detail/<id> or /gp/video/detail/<id>
    const primeMatch = url.match(/\/detail\/([^/?]+)/);
    if (primeMatch && url.includes('primevideo')) {
        return { platform: 'prime_video', videoId: primeMatch[1] };
    }
    // YouTube: ?v=<id>
    const youtubeMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
    if (youtubeMatch) {
        return { platform: 'youtube', videoId: youtubeMatch[1] };
    }
    // Hulu: /watch/<id>
    const huluMatch = url.match(/hulu\.com\/watch\/([^/?]+)/);
    if (huluMatch) {
        return { platform: 'hulu', videoId: huluMatch[1] };
    }
    // Disney+: /video/<id>
    const disneyMatch = url.match(/disneyplus\.com\/video\/([^/?]+)/);
    if (disneyMatch) {
        return { platform: 'disney_plus', videoId: disneyMatch[1] };
    }
    // Max: /video/watch/<id>
    const maxMatch = url.match(/max\.com\/video\/watch\/([^/?]+)/);
    if (maxMatch) {
        return { platform: 'max', videoId: maxMatch[1] };
    }
    // Peacock: /watch/<id>
    const peacockMatch = url.match(/peacocktv\.com\/watch\/([^/?]+)/);
    if (peacockMatch) {
        return { platform: 'peacock', videoId: peacockMatch[1] };
    }
    return { platform: null, videoId: null };
}
/**
 * Get platform display name
 */
export function getPlatformName(platform) {
    const names = {
        netflix: 'Netflix',
        prime_video: 'Prime Video',
        youtube: 'YouTube',
        hulu: 'Hulu',
        disney_plus: 'Disney+',
        max: 'Max',
        peacock: 'Peacock',
    };
    return names[platform] || platform;
}
//# sourceMappingURL=platform-detector.js.map