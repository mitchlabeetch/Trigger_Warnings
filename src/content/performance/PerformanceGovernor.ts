import { Logger } from '@shared/utils/logger';

const logger = new Logger('PerformanceGovernor');

export enum PerformanceTier {
  OPTIMAL = 'optimal',   // Full capabilities (60fps analysis)
  BALANCED = 'balanced', // Standard capabilities (30fps analysis)
  STRESSED = 'stressed', // Reduced capabilities (15fps analysis)
  CRITICAL = 'critical'  // Minimal capabilities (5fps or paused)
}

interface PerformanceMetrics {
  fps: number;
  frameTime: number; // ms
  longTasks: number;
  memoryUsage?: number; // MB (if available)
}

export class PerformanceGovernor {
  private static instance: PerformanceGovernor;
  private currentTier: PerformanceTier = PerformanceTier.OPTIMAL;
  private listeners: ((tier: PerformanceTier) => void)[] = [];

  // Monitoring state
  private frameCount: number = 0;
  private lastCheckTime: number = 0;
  private checkInterval: number = 1000; // Check every 1 second for smoother updates
  private rafId: number | null = null;
  private isMonitoring: boolean = false;

  // FPS Smoothing (Exponential Moving Average)
  private currentFPS: number = 60;
  private readonly ALPHA = 0.2; // Weight for new value (0.2 means 20% new, 80% history)

  // Performance thresholds with Hysteresis buffers
  // We use separate up/down thresholds to prevent flickering
  private readonly THRESHOLDS = {
    OPTIMAL: { UP: 58, DOWN: 55 },
    BALANCED: { UP: 48, DOWN: 45 },
    STRESSED: { UP: 35, DOWN: 30 }
  };

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): PerformanceGovernor {
    if (!PerformanceGovernor.instance) {
      PerformanceGovernor.instance = new PerformanceGovernor();
    }
    return PerformanceGovernor.instance;
  }

  /**
   * Start monitoring performance
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.lastCheckTime = performance.now();
    this.frameCount = 0;
    this.currentFPS = 60; // Reset FPS assumption

    logger.info('Performance monitoring started');
    this.monitorLoop();
  }

  /**
   * Stop monitoring performance
   */
  public stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    logger.info('Performance monitoring stopped');
  }

  /**
   * Get current performance tier
   */
  public getTier(): PerformanceTier {
    return this.currentTier;
  }

  /**
   * Subscribe to tier changes
   */
  public subscribe(callback: (tier: PerformanceTier) => void): () => void {
    this.listeners.push(callback);
    // Immediately callback with current tier
    callback(this.currentTier);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Main monitoring loop
   */
  private monitorLoop(): void {
    if (!this.isMonitoring) return;

    const now = performance.now();
    this.frameCount++;

    if (now - this.lastCheckTime >= this.checkInterval) {
      this.evaluatePerformance(now);
    }

    this.rafId = requestAnimationFrame(() => this.monitorLoop());
  }

  /**
   * Evaluate performance and update tier
   * Uses EMA smoothing and Hysteresis for stability
   */
  private evaluatePerformance(now: number): void {
    const elapsed = now - this.lastCheckTime;
    const instantFPS = (this.frameCount / elapsed) * 1000;

    // Apply Exponential Moving Average (EMA)
    this.currentFPS = (this.ALPHA * instantFPS) + ((1 - this.ALPHA) * this.currentFPS);

    const previousTier = this.currentTier;
    let newTier = previousTier;

    // Determine new tier with hysteresis
    // Logic: Only change if we cross the specific threshold for that direction

    switch (previousTier) {
      case PerformanceTier.OPTIMAL:
        if (this.currentFPS < this.THRESHOLDS.OPTIMAL.DOWN) {
          newTier = PerformanceTier.BALANCED;
        }
        break;

      case PerformanceTier.BALANCED:
        if (this.currentFPS > this.THRESHOLDS.OPTIMAL.UP) {
          newTier = PerformanceTier.OPTIMAL;
        } else if (this.currentFPS < this.THRESHOLDS.BALANCED.DOWN) {
          newTier = PerformanceTier.STRESSED;
        }
        break;

      case PerformanceTier.STRESSED:
        if (this.currentFPS > this.THRESHOLDS.BALANCED.UP) {
          newTier = PerformanceTier.BALANCED;
        } else if (this.currentFPS < this.THRESHOLDS.STRESSED.DOWN) {
          newTier = PerformanceTier.CRITICAL;
        }
        break;

      case PerformanceTier.CRITICAL:
        if (this.currentFPS > this.THRESHOLDS.STRESSED.UP) {
          newTier = PerformanceTier.STRESSED;
        }
        break;
    }

    // If tier dropped significantly (e.g. sudden lag spike), we might want to skip intermediate steps
    // But for now, let's stick to smooth transitions unless it's critical
    if (this.currentFPS < 20 && newTier !== PerformanceTier.CRITICAL) {
        newTier = PerformanceTier.CRITICAL;
    }

    if (newTier !== previousTier) {
      this.currentTier = newTier;
      logger.info(`Performance tier changed: ${previousTier} -> ${this.currentTier} (FPS: ${this.currentFPS.toFixed(1)})`);
      this.notifyListeners();
    }

    // Reset counters
    this.lastCheckTime = now;
    this.frameCount = 0;
  }

  /**
   * Notify all listeners of tier change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentTier);
      } catch (error) {
        logger.error('Error in performance listener:', error);
      }
    });
  }

  /**
   * Get recommended sampling interval based on current tier
   * @returns interval in ms
   */
  public getRecommendedInterval(baseInterval: number): number {
    switch (this.currentTier) {
      case PerformanceTier.OPTIMAL:
        return baseInterval;
      case PerformanceTier.BALANCED:
        return baseInterval * 1.5;
      case PerformanceTier.STRESSED:
        return baseInterval * 3;
      case PerformanceTier.CRITICAL:
        return baseInterval * 6;
      default:
        return baseInterval;
    }
  }
}
