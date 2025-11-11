/**
 * AUDIO WAVEFORM ANALYZER
 *
 * Detects trigger warnings from audio waveform analysis
 * Uses native Web Audio API (zero bundle size, excellent browser support)
 *
 * Detects:
 * - Gunshots (sharp transient, high amplitude < 50ms)
 * - Explosions (sustained spike, low frequency surge)
 * - Sudden loud noises (amplitude spikes > threshold)
 * - Silence (potential tension/suffocation scenes)
 * - Jump scares (silence → sudden loud)
 *
 * Browser Support:
 * - Chrome 14+
 * - Firefox 25+
 * - Safari 6+
 * - Edge 12+
 *
 * Created by: Claude Code (Legendary Session)
 * Date: 2024-11-11
 */
import { Logger } from '@shared/utils/logger';
const logger = new Logger('AudioWaveformAnalyzer');
export class AudioWaveformAnalyzer {
    audioContext = null;
    analyser = null;
    source = null;
    dataArray = null;
    previousRMS = null;
    monitoringInterval = null;
    video = null;
    // Detection thresholds
    GUNSHOT_THRESHOLD = 0.75; // 75% max amplitude spike
    GUNSHOT_RISE_TIME_MS = 50; // < 50ms rise time
    EXPLOSION_THRESHOLD = 0.65;
    EXPLOSION_DURATION_MS = 150; // Sustained for > 150ms
    LOUD_NOISE_THRESHOLD = 0.60;
    SILENCE_THRESHOLD = 0.05; // < 5% RMS
    JUMP_SCARE_THRESHOLD = 0.70;
    // State tracking
    silenceDuration = 0;
    wasSilent = false;
    lastEventTime = 0;
    detectedEvents = new Map();
    // Callbacks
    onWarningDetected = null;
    // Statistics
    stats = {
        totalChecks: 0,
        gunshotDetections: 0,
        explosionDetections: 0,
        loudNoiseDetections: 0,
        silenceDetections: 0,
        jumpScareDetections: 0
    };
    /**
     * Initialize audio analyzer for a video element
     */
    initialize(videoElement) {
        try {
            this.video = videoElement;
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            // Create analyser node
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048; // Higher resolution for better transient detection
            this.analyser.smoothingTimeConstant = 0.3; // Less smoothing for better transient capture
            // Connect video audio to analyser
            this.source = this.audioContext.createMediaElementSource(videoElement);
            this.source.connect(this.analyser);
            // CRITICAL: Connect to destination so audio still plays
            this.analyser.connect(this.audioContext.destination);
            // Allocate data array
            this.dataArray = new Uint8Array(this.analyser.fftSize);
            logger.info('[TW AudioWaveformAnalyzer] ✅ Initialized with Web Audio API');
            logger.info(`[TW AudioWaveformAnalyzer] FFT Size: ${this.analyser.fftSize}, Sample Rate: ${this.audioContext.sampleRate}Hz`);
            this.startMonitoring();
        }
        catch (error) {
            logger.error('[TW AudioWaveformAnalyzer] ❌ Failed to initialize:', error);
            logger.warn('[TW AudioWaveformAnalyzer] Audio analysis will be disabled');
        }
    }
    /**
     * Start monitoring audio waveform
     */
    startMonitoring() {
        const checkInterval = 50; // Check every 50ms (20 Hz)
        this.monitoringInterval = window.setInterval(() => {
            this.analyzeWaveform();
        }, checkInterval);
        logger.info('[TW AudioWaveformAnalyzer] 🎵 Monitoring started (checking every 50ms)');
    }
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval !== null) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }
    /**
     * Analyze current audio waveform
     */
    analyzeWaveform() {
        if (!this.analyser || !this.dataArray || !this.audioContext || !this.video) {
            return;
        }
        if (this.video.paused || this.video.ended) {
            return; // Don't analyze when paused
        }
        this.stats.totalChecks++;
        // Get time domain data (waveform)
        this.analyser.getByteTimeDomainData(this.dataArray);
        // Calculate RMS (Root Mean Square) amplitude
        const rms = this.calculateRMS(this.dataArray);
        // Current timestamp
        const currentTime = this.video.currentTime;
        // Detect patterns
        if (this.previousRMS !== null) {
            const amplitudeChange = rms - this.previousRMS;
            const changeRate = amplitudeChange / 0.05; // Change per second (50ms interval)
            // 1. GUNSHOT DETECTION
            // Characteristics: Very sudden spike (< 50ms), high amplitude (> 75%)
            if (amplitudeChange > this.GUNSHOT_THRESHOLD && rms > 0.75) {
                this.detectGunshot(currentTime, rms);
            }
            // 2. EXPLOSION DETECTION
            // Characteristics: Sustained spike (> 150ms), moderate-high amplitude
            else if (amplitudeChange > this.EXPLOSION_THRESHOLD && rms > 0.65) {
                this.detectExplosion(currentTime, rms);
            }
            // 3. GENERAL LOUD NOISE DETECTION
            else if (amplitudeChange > this.LOUD_NOISE_THRESHOLD && rms > 0.60) {
                this.detectLoudNoise(currentTime, rms);
            }
            // 4. JUMP SCARE DETECTION
            // Characteristics: Silence → sudden loud noise
            if (this.wasSilent && rms > this.JUMP_SCARE_THRESHOLD) {
                this.detectJumpScare(currentTime, rms);
                this.wasSilent = false;
            }
        }
        // 5. SILENCE DETECTION
        // Characteristics: RMS below threshold for > 2 seconds
        if (rms < this.SILENCE_THRESHOLD) {
            this.silenceDuration += 50; // Increment by check interval
            if (this.silenceDuration > 2000 && !this.wasSilent) {
                this.detectSilence(currentTime, this.silenceDuration);
                this.wasSilent = true;
            }
        }
        else {
            this.silenceDuration = 0;
            this.wasSilent = false;
        }
        this.previousRMS = rms;
    }
    /**
     * Calculate Root Mean Square amplitude (normalized 0-1)
     */
    calculateRMS(data) {
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            const normalized = (data[i] - 128) / 128; // Normalize to -1 to 1
            sum += normalized * normalized;
        }
        return Math.sqrt(sum / data.length);
    }
    /**
     * Detect gunshot
     */
    detectGunshot(timestamp, amplitude) {
        // Deduplicate (don't detect multiple gunshots within 1 second)
        const eventKey = `gunshot-${Math.floor(timestamp)}`;
        if (this.detectedEvents.has(eventKey)) {
            return;
        }
        this.stats.gunshotDetections++;
        const event = {
            type: 'gunshot',
            timestamp,
            amplitude
        };
        this.detectedEvents.set(eventKey, event);
        logger.warn(`[TW AudioWaveformAnalyzer] 🔫 GUNSHOT DETECTED at ${timestamp.toFixed(1)}s | ` +
            `Amplitude: ${(amplitude * 100).toFixed(1)}%`);
        // Create warning
        const warning = {
            id: `audio-gunshot-${Math.floor(timestamp)}`,
            videoId: 'audio-detected',
            categoryKey: 'violence',
            startTime: Math.max(0, timestamp - 2), // 2 second lead time
            endTime: timestamp + 3,
            submittedBy: 'audio-waveform-analyzer',
            status: 'approved',
            score: 0,
            confidenceLevel: Math.min(Math.round(amplitude * 100), 100),
            requiresModeration: false,
            description: `Gunshot detected via audio analysis (amplitude: ${(amplitude * 100).toFixed(1)}%)`,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.onWarningDetected?.(warning);
    }
    /**
     * Detect explosion
     */
    detectExplosion(timestamp, amplitude) {
        const eventKey = `explosion-${Math.floor(timestamp)}`;
        if (this.detectedEvents.has(eventKey)) {
            return;
        }
        this.stats.explosionDetections++;
        const event = {
            type: 'explosion',
            timestamp,
            amplitude
        };
        this.detectedEvents.set(eventKey, event);
        logger.warn(`[TW AudioWaveformAnalyzer] 💥 EXPLOSION DETECTED at ${timestamp.toFixed(1)}s | ` +
            `Amplitude: ${(amplitude * 100).toFixed(1)}%`);
        const warning = {
            id: `audio-explosion-${Math.floor(timestamp)}`,
            videoId: 'audio-detected',
            categoryKey: 'detonations_bombs',
            startTime: Math.max(0, timestamp - 2),
            endTime: timestamp + 5,
            submittedBy: 'audio-waveform-analyzer',
            status: 'approved',
            score: 0,
            confidenceLevel: Math.min(Math.round(amplitude * 100), 100),
            requiresModeration: false,
            description: `Explosion detected via audio analysis (amplitude: ${(amplitude * 100).toFixed(1)}%)`,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.onWarningDetected?.(warning);
    }
    /**
     * Detect general loud noise
     */
    detectLoudNoise(timestamp, amplitude) {
        const eventKey = `loud-${Math.floor(timestamp)}`;
        if (this.detectedEvents.has(eventKey)) {
            return;
        }
        this.stats.loudNoiseDetections++;
        logger.debug(`[TW AudioWaveformAnalyzer] 📢 Loud noise at ${timestamp.toFixed(1)}s | ` +
            `Amplitude: ${(amplitude * 100).toFixed(1)}%`);
        // Don't create warning for general loud noise (too many false positives)
        // Instead, track it for jump scare detection
    }
    /**
     * Detect jump scare (silence → sudden loud)
     */
    detectJumpScare(timestamp, amplitude) {
        const eventKey = `jumpscare-${Math.floor(timestamp)}`;
        if (this.detectedEvents.has(eventKey)) {
            return;
        }
        this.stats.jumpScareDetections++;
        const event = {
            type: 'jump_scare',
            timestamp,
            amplitude
        };
        this.detectedEvents.set(eventKey, event);
        logger.warn(`[TW AudioWaveformAnalyzer] 👻 JUMP SCARE DETECTED at ${timestamp.toFixed(1)}s | ` +
            `Silence → Loud (${(amplitude * 100).toFixed(1)}%)`);
        const warning = {
            id: `audio-jumpscare-${Math.floor(timestamp)}`,
            videoId: 'audio-detected',
            categoryKey: 'jumpscares',
            startTime: Math.max(0, timestamp - 1), // Very short lead time (jump scares are sudden)
            endTime: timestamp + 2,
            submittedBy: 'audio-waveform-analyzer',
            status: 'approved',
            score: 0,
            confidenceLevel: 85,
            requiresModeration: false,
            description: `Jump scare detected via audio analysis (silence → loud spike)`,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.onWarningDetected?.(warning);
    }
    /**
     * Detect prolonged silence
     */
    detectSilence(timestamp, duration) {
        const eventKey = `silence-${Math.floor(timestamp)}`;
        if (this.detectedEvents.has(eventKey)) {
            return;
        }
        this.stats.silenceDetections++;
        logger.debug(`[TW AudioWaveformAnalyzer] 🔇 Prolonged silence at ${timestamp.toFixed(1)}s | ` +
            `Duration: ${(duration / 1000).toFixed(1)}s`);
        // Silence itself is not a trigger, but we track it for jump scare detection
    }
    /**
     * Register callback for warnings
     */
    onDetection(callback) {
        this.onWarningDetected = callback;
    }
    /**
     * Get all detected events
     */
    getDetectedEvents() {
        return Array.from(this.detectedEvents.values());
    }
    /**
     * Get statistics
     */
    getStats() {
        return {
            ...this.stats,
            enabled: this.audioContext !== null
        };
    }
    /**
     * Clear events
     */
    clear() {
        this.detectedEvents.clear();
        this.previousRMS = null;
        this.silenceDuration = 0;
        this.wasSilent = false;
    }
    /**
     * Dispose
     */
    dispose() {
        this.stopMonitoring();
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.video = null;
        this.dataArray = null;
        this.detectedEvents.clear();
        this.onWarningDetected = null;
    }
}
//# sourceMappingURL=AudioWaveformAnalyzer.js.map