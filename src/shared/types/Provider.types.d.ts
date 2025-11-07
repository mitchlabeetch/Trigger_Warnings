/**
 * Streaming provider types and interfaces
 */
export type MediaType = 'movie' | 'episode';
export interface MediaInfo {
    id: string;
    title: string;
    type: MediaType;
    season?: number;
    episode?: number;
    year?: number;
    thumbnailUrl?: string;
}
export interface IStreamingProvider {
    /**
     * Provider metadata
     */
    readonly name: string;
    readonly domains: string[];
    /**
     * Initialize the provider
     * Called when the provider is loaded on a matching domain
     */
    initialize(): Promise<void>;
    /**
     * Get information about the currently playing media
     * Returns null if no media is detected
     */
    getCurrentMedia(): Promise<MediaInfo | null>;
    /**
     * Get the main video element on the page
     * Returns null if no video is found
     */
    getVideoElement(): HTMLVideoElement | null;
    /**
     * Get the element where the warning banner should be injected
     * Should be relative to the video player container
     */
    getInjectionPoint(): HTMLElement | null;
    /**
     * Register callback for play events
     */
    onPlay(callback: () => void): void;
    /**
     * Register callback for pause events
     */
    onPause(callback: () => void): void;
    /**
     * Register callback for seek events
     */
    onSeek(callback: (time: number) => void): void;
    /**
     * Register callback for media change events
     * Called when the user navigates to a different video
     */
    onMediaChange(callback: (media: MediaInfo) => void): void;
    /**
     * Clean up event listeners and resources
     */
    dispose(): void;
}
export interface ProviderRegistry {
    [domain: string]: IStreamingProvider;
}
//# sourceMappingURL=Provider.types.d.ts.map