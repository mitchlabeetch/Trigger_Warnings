/**
 * Banner Manager
 * Manages the warning banner lifecycle and Svelte component mounting
 */
import type { IStreamingProvider } from '@shared/types/Provider.types';
import type { ActiveWarning } from '@shared/types/Warning.types';
export declare class BannerManager {
    private provider;
    private container;
    private bannerComponent;
    private activeWarnings;
    private onIgnoreThisTimeCallback;
    private onIgnoreForVideoCallback;
    private onVoteCallback;
    constructor(provider: IStreamingProvider);
    initialize(): Promise<void>;
    showWarning(warning: ActiveWarning): void;
    hideWarning(warningId: string): void;
    private updateBanner;
    private handleIgnoreThisTime;
    private handleIgnoreForVideo;
    private handleVote;
    onIgnoreThisTime(callback: (warningId: string) => void): void;
    onIgnoreForVideo(callback: (categoryKey: string) => void): void;
    onVote(callback: (warningId: string, voteType: 'up' | 'down') => void): void;
    dispose(): void;
}
//# sourceMappingURL=BannerManager.d.ts.map