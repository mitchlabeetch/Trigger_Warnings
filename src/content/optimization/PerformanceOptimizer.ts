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

import { Logger } from '@shared/utils/logger';

const logger = new Logger('PerformanceOptimizer');

export type PerformanceMode = 'ULTRA' | 'HIGH' | 'MEDIUM' | 'LOW' | 'BATTERY_SAVER';

export interface PerformanceConfig {
  mode: PerformanceMode;
  enableSubtitleAnalysis: boolean;
  enableAudioWaveform: boolean;
  enableAudioFrequency: boolean;
  enableVisualAnalysis: boolean;
  enablePhotosensitivity: boolean;
  enableFusion: boolean;

  // Quality settings
  canvasResolution: { width: number; height: number };
  audioCheckInterval: number;
  visualCheckInterval: number;
  fusionThreshold: number;
}

interface DeviceCapabilities {
  cpuCores: number;
  memory: number;  // GB
  isMobile: boolean;
  isLowEnd: boolean;
  batteryLevel: number | null;
  isCharging: boolean;
}

export class PerformanceOptimizer {
  private deviceCapabilities: DeviceCapabilities;
  private currentMode: PerformanceMode;
  private cpuUsageHistory: number[] = [];
  private monitoringInterval: number | null = null;

  // Performance thresholds
  private readonly CPU_HIGH_THRESHOLD = 80;  // % CPU usage
  private readonly CPU_LOW_THRESHOLD = 40;
  private readonly MEMORY_HIGH_THRESHOLD = 80;  // % memory usage
  private readonly BATTERY_LOW_THRESHOLD = 20;  // % battery

  constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.currentMode = this.determineOptimalMode();

    logger.info(
      `[TW PerformanceOptimizer] ✅ Initialized | ` +
      `Device: ${this.deviceCapabilities.isMobile ? 'Mobile' : 'Desktop'} | ` +
      `Mode: ${this.currentMode} | ` +
      `CPU Cores: ${this.deviceCapabilities.cpuCores} | ` +
      `Memory: ${this.deviceCapabilities.memory.toFixed(1)}GB`
    );

    this.startMonitoring();
  }

  /**
   * Detect device capabilities
   */
  private detectDeviceCapabilities(): DeviceCapabilities {
    // CPU cores
    const cpuCores = navigator.hardwareConcurrency || 4;

    // Memory (estimate if not available)
    const memory = (navigator as any).deviceMemory || this.estimateMemory();

    // Mobile detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    // Low-end detection
    const isLowEnd = cpuCores <= 2 || memory <= 2;

    // Battery
    let batteryLevel: number | null = null;
    let isCharging = false;

    // Try to get battery info (if available)
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        batteryLevel = battery.level * 100;
        isCharging = battery.charging;
      }).catch(() => {
        // Battery API not available
      });
    }

    return {
      cpuCores,
      memory,
      isMobile,
      isLowEnd,
      batteryLevel,
      isCharging
    };
  }

  /**
   * Estimate memory if deviceMemory API not available
   */
  private estimateMemory(): number {
    // Heuristic based on user agent and performance
    const ua = navigator.userAgent.toLowerCase();

    if (ua.includes('mobile')) {
      return 2;  // Assume 2GB for mobile
    }

    // Desktop - assume 8GB
    return 8;
  }

  /**
   * Determine optimal performance mode
   */
  private determineOptimalMode(): PerformanceMode {
    const { cpuCores, memory, isLowEnd, isMobile, batteryLevel, isCharging } = this.deviceCapabilities;

    // Battery saver if battery low and not charging
    if (batteryLevel !== null && batteryLevel < this.BATTERY_LOW_THRESHOLD && !isCharging) {
      logger.info('[TW PerformanceOptimizer] 🔋 Battery low - switching to BATTERY_SAVER mode');
      return 'BATTERY_SAVER';
    }

    // Low-end devices
    if (isLowEnd) {
      logger.info('[TW PerformanceOptimizer] 📱 Low-end device detected - using MEDIUM mode');
      return 'MEDIUM';
    }

    // Mobile devices (mid-range)
    if (isMobile) {
      logger.info('[TW PerformanceOptimizer] 📱 Mobile device - using HIGH mode');
      return 'HIGH';
    }

    // High-end desktop
    if (cpuCores >= 8 && memory >= 8) {
      logger.info('[TW PerformanceOptimizer] 💻 High-end device - using ULTRA mode');
      return 'ULTRA';
    }

    // Default: HIGH mode
    logger.info('[TW PerformanceOptimizer] 💻 Standard device - using HIGH mode');
    return 'HIGH';
  }

  /**
   * Get performance configuration for current mode
   */
  getConfiguration(): PerformanceConfig {
    switch (this.currentMode) {
      case 'ULTRA':
        return {
          mode: 'ULTRA',
          enableSubtitleAnalysis: true,
          enableAudioWaveform: true,
          enableAudioFrequency: true,
          enableVisualAnalysis: true,
          enablePhotosensitivity: true,
          enableFusion: true,
          canvasResolution: { width: 640, height: 360 },  // High quality
          audioCheckInterval: 50,   // 20 Hz
          visualCheckInterval: 100, // 10 Hz
          fusionThreshold: 70
        };

      case 'HIGH':
        return {
          mode: 'HIGH',
          enableSubtitleAnalysis: true,
          enableAudioWaveform: true,
          enableAudioFrequency: true,
          enableVisualAnalysis: true,
          enablePhotosensitivity: true,
          enableFusion: true,
          canvasResolution: { width: 320, height: 180 },  // Standard quality
          audioCheckInterval: 50,
          visualCheckInterval: 200,  // 5 Hz
          fusionThreshold: 70
        };

      case 'MEDIUM':
        return {
          mode: 'MEDIUM',
          enableSubtitleAnalysis: true,
          enableAudioWaveform: true,
          enableAudioFrequency: false,  // Disable frequency analysis
          enableVisualAnalysis: false,  // Disable visual analysis
          enablePhotosensitivity: true,  // Keep photosensitivity (critical)
          enableFusion: true,
          canvasResolution: { width: 160, height: 90 },  // Low quality
          audioCheckInterval: 100,  // 10 Hz
          visualCheckInterval: 400,
          fusionThreshold: 75
        };

      case 'LOW':
        return {
          mode: 'LOW',
          enableSubtitleAnalysis: true,
          enableAudioWaveform: false,   // Disable audio
          enableAudioFrequency: false,
          enableVisualAnalysis: false,
          enablePhotosensitivity: true,  // Keep photosensitivity (critical)
          enableFusion: false,  // No fusion needed
          canvasResolution: { width: 160, height: 90 },
          audioCheckInterval: 200,
          visualCheckInterval: 500,
          fusionThreshold: 80
        };

      case 'BATTERY_SAVER':
        return {
          mode: 'BATTERY_SAVER',
          enableSubtitleAnalysis: true,
          enableAudioWaveform: false,
          enableAudioFrequency: false,
          enableVisualAnalysis: false,
          enablePhotosensitivity: false,  // Disable even photosensitivity
          enableFusion: false,
          canvasResolution: { width: 160, height: 90 },
          audioCheckInterval: 500,
          visualCheckInterval: 1000,
          fusionThreshold: 85
        };
    }
  }

  /**
   * Start performance monitoring
   */
  private startMonitoring(): void {
    // Monitor every 5 seconds
    this.monitoringInterval = window.setInterval(() => {
      this.checkPerformance();
    }, 5000);

    logger.info('[TW PerformanceOptimizer] 📊 Performance monitoring started');
  }

  /**
   * Check current performance and adjust if needed
   */
  private checkPerformance(): void {
    // Estimate CPU usage (heuristic)
    const cpuUsage = this.estimateCPUUsage();
    this.cpuUsageHistory.push(cpuUsage);

    // Keep last 12 samples (1 minute)
    if (this.cpuUsageHistory.length > 12) {
      this.cpuUsageHistory.shift();
    }

    // Average CPU usage
    const avgCPU = this.cpuUsageHistory.reduce((a, b) => a + b, 0) / this.cpuUsageHistory.length;

    // Check battery
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.deviceCapabilities.batteryLevel = battery.level * 100;
        this.deviceCapabilities.isCharging = battery.charging;
      }).catch(() => {});
    }

    // Auto-adjust mode if needed
    this.autoAdjustMode(avgCPU);
  }

  /**
   * Estimate CPU usage (heuristic)
   */
  private estimateCPUUsage(): number {
    // Use performance.now() to estimate CPU usage
    const start = performance.now();

    // Do some work to measure CPU
    let sum = 0;
    for (let i = 0; i < 100000; i++) {
      sum += Math.sqrt(i);
    }

    const elapsed = performance.now() - start;

    // Normalize to 0-100 scale
    // Faster = less CPU available
    const cpuUsage = Math.min(100, elapsed * 10);

    return cpuUsage;
  }

  /**
   * Auto-adjust performance mode based on metrics
   */
  private autoAdjustMode(avgCPU: number): void {
    const { batteryLevel, isCharging } = this.deviceCapabilities;

    // Battery saver mode if battery critical
    if (batteryLevel !== null && batteryLevel < this.BATTERY_LOW_THRESHOLD && !isCharging) {
      if (this.currentMode !== 'BATTERY_SAVER') {
        logger.warn('[TW PerformanceOptimizer] 🔋 Battery critical - switching to BATTERY_SAVER mode');
        this.setMode('BATTERY_SAVER');
      }
      return;
    }

    // If battery recovered and charging, upgrade mode
    if (this.currentMode === 'BATTERY_SAVER' && (isCharging || (batteryLevel && batteryLevel > 40))) {
      logger.info('[TW PerformanceOptimizer] 🔌 Battery recovered - upgrading to MEDIUM mode');
      this.setMode('MEDIUM');
      return;
    }

    // CPU-based adjustment
    if (avgCPU > this.CPU_HIGH_THRESHOLD) {
      // CPU overloaded - downgrade mode
      this.downgradeMode();
    } else if (avgCPU < this.CPU_LOW_THRESHOLD) {
      // CPU underutilized - upgrade mode (if possible)
      this.upgradeMode();
    }
  }

  /**
   * Downgrade performance mode
   */
  private downgradeMode(): void {
    const modes: PerformanceMode[] = ['ULTRA', 'HIGH', 'MEDIUM', 'LOW', 'BATTERY_SAVER'];
    const currentIndex = modes.indexOf(this.currentMode);

    if (currentIndex < modes.length - 1) {
      const newMode = modes[currentIndex + 1];
      logger.warn(
        `[TW PerformanceOptimizer] ⚠️ CPU overloaded - downgrading from ${this.currentMode} to ${newMode}`
      );
      this.setMode(newMode);
    }
  }

  /**
   * Upgrade performance mode
   */
  private upgradeMode(): void {
    const modes: PerformanceMode[] = ['ULTRA', 'HIGH', 'MEDIUM', 'LOW', 'BATTERY_SAVER'];
    const currentIndex = modes.indexOf(this.currentMode);

    // Don't upgrade if on battery saver
    if (this.currentMode === 'BATTERY_SAVER') {
      return;
    }

    if (currentIndex > 0) {
      const newMode = modes[currentIndex - 1];
      logger.info(
        `[TW PerformanceOptimizer] ✅ CPU available - upgrading from ${this.currentMode} to ${newMode}`
      );
      this.setMode(newMode);
    }
  }

  /**
   * Manually set performance mode
   */
  setMode(mode: PerformanceMode): void {
    if (this.currentMode === mode) {
      return;
    }

    logger.info(`[TW PerformanceOptimizer] 🔄 Mode changed: ${this.currentMode} → ${mode}`);
    this.currentMode = mode;

    // Emit mode change event (will be handled by orchestrator)
  }

  /**
   * Get current mode
   */
  getCurrentMode(): PerformanceMode {
    return this.currentMode;
  }

  /**
   * Get device capabilities
   */
  getDeviceCapabilities(): DeviceCapabilities {
    return { ...this.deviceCapabilities };
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    currentMode: PerformanceMode;
    avgCPU: number;
    deviceCapabilities: DeviceCapabilities;
    config: PerformanceConfig;
  } {
    const avgCPU = this.cpuUsageHistory.length > 0
      ? this.cpuUsageHistory.reduce((a, b) => a + b, 0) / this.cpuUsageHistory.length
      : 0;

    return {
      currentMode: this.currentMode,
      avgCPU,
      deviceCapabilities: this.deviceCapabilities,
      config: this.getConfiguration()
    };
  }

  /**
   * Stop monitoring
   */
  dispose(): void {
    if (this.monitoringInterval !== null) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    logger.info('[TW PerformanceOptimizer] 🛑 Disposed');
  }
}
