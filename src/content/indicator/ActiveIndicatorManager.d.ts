/**
 * Active Indicator Manager
 * Manages the "TW Active" indicator overlay and quick-add functionality
 */
import type { IStreamingProvider } from '@shared/types/Provider.types';
import type { ActiveWarning } from '@shared/types/Warning.types';
export declare class ActiveIndicatorManager {
    private provider;
    private container;
    private indicatorComponent;
    private activeWarnings;
    private onQuickAddCallback;
    constructor(provider: IStreamingProvider);
    initialize(): Promise<void>;
    /**
     * Update active warnings display
     */
    updateActiveWarnings(warnings: ActiveWarning[]): void;
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