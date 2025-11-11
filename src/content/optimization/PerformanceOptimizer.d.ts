/**
 * PERFORMANCE OPTIMIZER
 *
 * Ensures smooth operation on ALL devices (including 5-year-old phones)
 *
 * Features:
 * - Device capability detection (CPU, GPU, memory)
 * - Adaptive quality adjustment
 * - CPU usage monitoring
 * - Battery-saving mode
 * - Automatic performance tuning
 *
 * Performance Modes:
 * - ULTRA: All systems, high quality (high-end devices)
 * - HIGH: All systems, medium quality (mid-range devices)
 * - MEDIUM: Essential systems only (low-end devices)
 * - LOW: Subtitle + database only (very low-end devices)
 * - BATTERY_SAVER: Minimal systems (battery critical)
 *
 * Created by: Claude Code (Legendary Session - FINAL PASS)
 * Date: 2024-11-11
 */
export type PerformanceMode = 'ULTRA' | 'HIGH' | 'MEDIUM' | 'LOW' | 'BATTERY_SAVER';
export interface PerformanceConfig {
    mode: PerformanceMode;
    enableSubtitleAnalysis: boolean;
    enableAudioWaveform: boolean;
    enableAudioFrequency: boolean;
    enableVisualAnalysis: boolean;
    enablePhotosensitivity: boolean;
    enableFusion: boolean;
    canvasResolution: {
        width: number;
        height: number;
    };
    audioCheckInterval: number;
    visualCheckInterval: number;
    fusionThreshold: number;
}
interface DeviceCapabilities {
    cpuCores: number;
    memory: number;
    isMobile: boolean;
    isLowEnd: boolean;
    batteryLevel: number | null;
    isCharging: boolean;
}
export declare class PerformanceOptimizer {
    private deviceCapabilities;
    private currentMode;
    private cpuUsageHistory;
    private monitoringInterval;
    private readonly CPU_HIGH_THRESHOLD;
    private readonly CPU_LOW_THRESHOLD;
    private readonly MEMORY_HIGH_THRESHOLD;
    private readonly BATTERY_LOW_THRESHOLD;
    constructor();
    /**
     * Detect device capabilities
     */
    private detectDeviceCapabilities;
    /**
     * Estimate memory if deviceMemory API not available
     */
    private estimateMemory;
    /**
     * Determine optimal performance mode
     */
    private determineOptimalMode;
    /**
     * Get performance configuration for current mode
     */
    getConfiguration(): PerformanceConfig;
    /**
     * Start performance monitoring
     */
    private startMonitoring;
    /**
     * Check current performance and adjust if needed
     */
    private checkPerformance;
    /**
     * Estimate CPU usage (heuristic)
     */
    private estimateCPUUsage;
    /**
     * Auto-adjust performance mode based on metrics
     */
    private autoAdjustMode;
    /**
     * Downgrade performance mode
     */
    private downgradeMode;
    /**
     * Upgrade performance mode
     */
    private upgradeMode;
    /**
     * Manually set performance mode
     */
    setMode(mode: PerformanceMode): void;
    /**
     * Get current mode
     */
    getCurrentMode(): PerformanceMode;
    /**
     * Get device capabilities
     */
    getDeviceCapabilities(): DeviceCapabilities;
    /**
     * Get performance statistics
     */
    getStats(): {
        currentMode: PerformanceMode;
        avgCPU: number;
        deviceCapabilities: DeviceCapabilities;
        config: PerformanceConfig;
    };
    /**
     * Stop monitoring
     */
    dispose(): void;
}
export {};
//# sourceMappingURL=PerformanceOptimizer.d.ts.map