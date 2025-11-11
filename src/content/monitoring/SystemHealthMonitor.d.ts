/**
 * SYSTEM HEALTH MONITOR
 *
 * Comprehensive health monitoring and auto-recovery system
 *
 * Problem: Detection systems can fail silently, leaving users unprotected
 * - System crashes without notification
 * - Memory leaks cause performance degradation
 * - Errors cascade and break entire system
 * - No automatic recovery
 *
 * Solution: Continuous health monitoring with intelligent auto-recovery
 *
 * Features:
 * - Health checks every 5 seconds for all systems
 * - Auto-restart failed systems
 * - Error rate tracking and alerting
 * - Memory leak detection
 * - Performance degradation monitoring
 * - Cascade failure prevention
 * - Detailed health reporting
 * - Graceful degradation (fallback modes)
 *
 * Created by: Claude Code (Legendary Session - Phase 6A)
 * Date: 2024-11-11
 */
export type SystemStatus = 'healthy' | 'degraded' | 'failing' | 'failed' | 'recovering';
export interface SystemHealth {
    name: string;
    status: SystemStatus;
    uptime: number;
    errorCount: number;
    errorRate: number;
    lastError: Error | null;
    lastErrorTime: number | null;
    memoryUsage: number | null;
    lastCheckTime: number;
    consecutiveFailures: number;
    restartCount: number;
}
export interface HealthCheckResult {
    passed: boolean;
    error?: Error;
    memoryUsage?: number;
}
export interface SystemHealthReport {
    overallStatus: SystemStatus;
    systems: SystemHealth[];
    totalErrors: number;
    totalRestarts: number;
    uptimeSeconds: number;
    memoryUsage: number | null;
    recommendations: string[];
}
export interface HealthMonitorConfig {
    checkInterval: number;
    errorThreshold: number;
    failureThreshold: number;
    autoRestart: boolean;
    memoryThreshold: number;
    enableMemoryMonitoring: boolean;
}
export type HealthCheckFunction = () => Promise<HealthCheckResult> | HealthCheckResult;
export type RestartFunction = () => Promise<void> | void;
export declare class SystemHealthMonitor {
    private config;
    private systems;
    private monitoringInterval;
    private startTime;
    private onHealthChangeCallback;
    private stats;
    constructor(config?: Partial<HealthMonitorConfig>);
    /**
     * Register a system for monitoring
     */
    registerSystem(name: string, healthCheck: HealthCheckFunction, restart?: RestartFunction): void;
    /**
     * Unregister a system
     */
    unregisterSystem(name: string): void;
    /**
     * Start health monitoring
     */
    startMonitoring(): void;
    /**
     * Stop health monitoring
     */
    stopMonitoring(): void;
    /**
     * Perform health checks on all systems
     */
    private performHealthChecks;
    /**
     * Handle successful health check
     */
    private handleHealthCheckPass;
    /**
     * Handle failed health check
     */
    private handleHealthCheckFail;
    /**
     * Mark system as failed and attempt recovery
     */
    private markSystemFailed;
    /**
     * Degrade system status
     */
    private degradeSystem;
    /**
     * Attempt to restart a failed system
     */
    private attemptRestart;
    /**
     * Update error rate for system
     */
    private updateErrorRate;
    /**
     * Check overall system health
     */
    private checkOverallHealth;
    /**
     * Get health report for all systems
     */
    getHealthReport(): SystemHealthReport;
    /**
     * Generate health recommendations
     */
    private generateRecommendations;
    /**
     * Register callback for health changes
     */
    onHealthChange(callback: (report: SystemHealthReport) => void): void;
    /**
     * Notify listeners of health change
     */
    private notifyHealthChange;
    /**
     * Get statistics
     */
    getStats(): typeof this.stats & {
        monitoredSystems: number;
        healthySystems: number;
        degradedSystems: number;
        failedSystems: number;
    };
    /**
     * Log health report
     */
    logHealthReport(): void;
    /**
     * Dispose
     */
    dispose(): void;
}
//# sourceMappingURL=SystemHealthMonitor.d.ts.map