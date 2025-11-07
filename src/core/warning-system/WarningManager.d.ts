/**
 * Warning manager - core logic for warning system
 */
import type { ActiveWarning } from '@shared/types/Warning.types';
import type { IStreamingProvider } from '@shared/types/Provider.types';
export declare class WarningManager {
    private provider;
    private profile;
    private warnings;
    private activeWarnings;
    private ignoredTriggersThisSession;
    private ignoredCategoriesForVideo;
    private checkInterval;
    private currentVideoId;
    private onWarningCallback;
    private onWarningEndCallback;
    constructor(provider: IStreamingProvider);
    /**
     * Initialize the warning manager
     */
    initialize(): Promise<void>;
    /**
     * Fetch warnings for a video
     */
    private fetchWarnings;
    /**
     * Filter warnings based on active profile
     */
    private filterWarningsByProfile;
    /**
     * Re-filter warnings when profile changes
     */
    private refilterWarnings;
    /**
     * Start monitoring video playback
     */
    private startMonitoring;
    /**
     * Check for active warnings at current playback time
     */
    private checkWarnings;
    /**
     * Trigger warning callback
     */
    private triggerWarning;
    /**
     * Trigger warning end callback
     */
    private triggerWarningEnd;
    /**
     * Apply warning action (mute/hide video)
     */
    private applyWarningAction;
    /**
     * Handle media change
     */
    private handleMediaChange;
    /**
     * Ignore a trigger for this session
     */
    ignoreThisTime(warningId: string): void;
    /**
     * Ignore a category for this video
     */
    ignoreForVideo(categoryKey: string): void;
    /**
     * Register callback for warnings
     */
    onWarning(callback: (warning: ActiveWarning) => void): void;
    /**
     * Register callback for warning end
     */
    onWarningEnd(callback: (warningId: string) => void): void;
    /**
     * Clean up
     */
    dispose(): void;
}
//# sourceMappingURL=WarningManager.d.ts.map