/**
 * Active Indicator Manager
 * Manages the "TW Active" indicator overlay and quick-add functionality
 */
import type { IStreamingProvider } from '@shared/types/Provider.types';
export declare class ActiveIndicatorManager {
    private provider;
    private container;
    private indicatorComponent;
    private onQuickAddCallback;
    constructor(provider: IStreamingProvider);
    initialize(): Promise<void>;
    private handleQuickAdd;
    /**
     * Set callback for quick add button
     */
    onQuickAdd(callback: () => void): void;
    /**
     * Show the indicator
     */
    show(): void;
    /**
     * Hide the indicator
     */
    hide(): void;
    dispose(): void;
}
//# sourceMappingURL=ActiveIndicatorManager.d.ts.map