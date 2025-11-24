export declare enum PerformanceTier {
    OPTIMAL = "optimal",// Full capabilities (60fps analysis)
    BALANCED = "balanced",// Standard capabilities (30fps analysis)
    STRESSED = "stressed",// Reduced capabilities (15fps analysis)
    CRITICAL = "critical"
}
export declare class PerformanceGovernor {
    private static instance;
    private currentTier;
    private listeners;
    private frameCount;
    private lastCheckTime;
    private checkInterval;
    private rafId;
    private isMonitoring;
    private currentFPS;
    private readonly ALPHA;
    private readonly THRESHOLDS;
    private constructor();
    static getInstance(): PerformanceGovernor;
    /**
     * Start monitoring performance
     */
    startMonitoring(): void;
    /**
     * Stop monitoring performance
     */
    stopMonitoring(): void;
    /**
     * Get current performance tier
     */
    getTier(): PerformanceTier;
    /**
     * Subscribe to tier changes
     */
    subscribe(callback: (tier: PerformanceTier) => void): () => void;
    /**
     * Main monitoring loop
     */
    private monitorLoop;
    /**
     * Evaluate performance and update tier
     * Uses EMA smoothing and Hysteresis for stability
     */
    private evaluatePerformance;
    /**
     * Notify all listeners of tier change
     */
    private notifyListeners;
    /**
     * Get recommended sampling interval based on current tier
     * @returns interval in ms
     */
    getRecommendedInterval(baseInterval: number): number;
}
//# sourceMappingURL=PerformanceGovernor.d.ts.map