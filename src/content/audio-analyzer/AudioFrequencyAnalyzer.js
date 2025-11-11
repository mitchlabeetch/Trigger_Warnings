/**
 * AUDIO FREQUENCY ANALYZER
 *
 * Detects trigger warnings from audio frequency analysis
 * Uses Web Audio API's AnalyserNode for FFT-based frequency analysis
 *
 * Detects:
 * - Screaming (3-5kHz sustained high energy)
 * - Gunshots (1-5kHz sharp transient with specific frequency profile)
 * - Explosions (20-200Hz low frequency surge)
 * - Sirens (1-3kHz oscillating frequency)
 * - Medical equipment beeping (1-2kHz periodic steady tone)
 * - Crying/sobbing (500-2kHz rhythmic pattern)
 * - Power tools/chainsaws (100-500Hz sustained buzz)
 *
 * Browser Support: Chrome 14+, Firefox 25+, Safari 6+, Edge 12+
 *
 * Created by: Claude Code (Legendary Session)
 * Date: 2024-11-11
 */
import { Logger } from '@shared/utils/logger';
const logger = new Logger('AudioFrequencyAnalyzer');
export class AudioFrequencyAnalyzer {
    audioContext = null;
    analyser = null;
    source = null;
    frequencyData = null;
    monitoringInterval = null;
    video = null;
    // Frequency history for pattern detection
    frequencyHistory = [];
    HISTORY_SIZE = 10; // Keep last 1 second (100ms intervals)
    // Detection state
    detectedEvents = new Map();
    onWarningDetected = null;
    // Statistics
    stats = {
        totalChecks: 0,
        screamDetections: 0,
        gunshotDetections: 0,
        explosionDetections: 0,
        sirenDetections: 0,
        medicalBeepDetections: 0,
        cryingDetections: 0,
        powerToolDetections: 0
    };
    /**
     * Initialize frequency analyzer
     * Can share AudioContext with AudioWaveformAnalyzer
     */
    initialize(videoElement, sharedAudioContext, sharedAnalyser) {
        try {
            this.video = videoElement;
            if (sharedAudioContext && sharedAnalyser) {
                // Reuse existing audio context and analyser
                this.audioContext = sharedAudioContext;
                this.analyser = sharedAnalyser;
                logger.info('[TW AudioFrequencyAnalyzer] ✅ Using shared AudioContext');
            }
            else {
                // Create new audio context
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 2048;
                this.analyser.smoothingTimeConstant = 0.8; // Smoother for frequency analysis
                this.source = this.audioContext.createMediaElementSource(videoElement);
                this.source.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
            }
            // Allocate frequency data array
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
            logger.info(`[TW AudioFrequencyAnalyzer] ✅ Initialized | ` +
                `FFT Size: ${this.analyser.fftSize}, ` +
                `Frequency Bins: ${this.analyser.frequencyBinCount}, ` +
                `Sample Rate: ${this.audioContext.sampleRate}Hz`);
            this.startMonitoring();
        }
        catch (error) {
            logger.error('[TW AudioFrequencyAnalyzer] ❌ Failed to initialize:', error);
        }
    }
    /**
     * Start monitoring frequency spectrum
     */
    startMonitoring() {
        const checkInterval = 100; // Check every 100ms
        this.monitoringInterval = window.setInterval(() => {
            this.analyzeFrequencies();
        }, checkInterval);
        logger.info('[TW AudioFrequencyAnalyzer] 🎵 Frequency monitoring started (100ms intervals)');
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
     * Analyze current frequency spectrum
     */
    analyzeFrequencies() {
        if (!this.analyser || !this.frequencyData || !this.audioContext || !this.video) {
            return;
        }
        if (this.video.paused || this.video.ended) {
            return;
        }
        this.stats.totalChecks++;
        // Get frequency data (FFT output)
        this.analyser.getByteFrequencyData(this.frequencyData);
        // Calculate frequency bands
        const bands = this.calculateFrequencyBands();
        // Add to history
        this.frequencyHistory.push(bands);
        if (this.frequencyHistory.length > this.HISTORY_SIZE) {
            this.frequencyHistory.shift();
        }
        const currentTime = this.video.currentTime;
        // Detect patterns
        this.detectScream(currentTime, bands);
        this.detectGunshot(currentTime, bands);
        this.detectExplosion(currentTime, bands);
        this.detectSiren(currentTime, bands);
        this.detectMedicalBeep(currentTime, bands);
        this.detectCrying(currentTime, bands);
        this.detectPowerTool(currentTime, bands);
    }
    /**
     * Calculate frequency bands from FFT data
     */
    calculateFrequencyBands() {
        if (!this.analyser || !this.frequencyData) {
            return {
                subBass: 0,
                bass: 0,
                lowMid: 0,
                mid: 0,
                highMid: 0,
                presence: 0,
                brilliance: 0
            };
        }
        const sampleRate = this.analyser.context.sampleRate;
        return {
            subBass: this.getAverageFrequency(20, 60, sampleRate),
            bass: this.getAverageFrequency(60, 250, sampleRate),
            lowMid: this.getAverageFrequency(250, 500, sampleRate),
            mid: this.getAverageFrequency(500, 2000, sampleRate),
            highMid: this.getAverageFrequency(2000, 4000, sampleRate),
            presence: this.getAverageFrequency(4000, 6000, sampleRate),
            brilliance: this.getAverageFrequency(6000, 20000, sampleRate)
        };
    }
    /**
     * Get average frequency magnitude in Hz range
     */
    getAverageFrequency(minHz, maxHz, sampleRate) {
        if (!this.frequencyData || !this.analyser)
            return 0;
        const binCount = this.analyser.frequencyBinCount;
        const nyquist = sampleRate / 2;
        const minBin = Math.floor((minHz / nyquist) * binCount);
        const maxBin = Math.floor((maxHz / nyquist) * binCount);
        let sum = 0;
        for (let i = minBin; i <= maxBin && i < this.frequencyData.length; i++) {
            sum += this.frequencyData[i];
        }
        return sum / (maxBin - minBin + 1);
    }
    /**
     * Detect screaming (3-5kHz sustained high energy)
     */
    detectScream(timestamp, bands) {
        // Scream characteristics:
        // - High energy in highMid (2-4kHz) and presence (4-6kHz)
        // - Sustained for > 500ms
        // - Relatively low bass
        if (bands.highMid > 200 && bands.presence > 200 && bands.bass < 150) {
            // Check if sustained
            if (this.isSustained('highMid', 180, 5)) { // 5 checks = 500ms
                const eventKey = `scream-${Math.floor(timestamp)}`;
                if (!this.detectedEvents.has(eventKey)) {
                    this.stats.screamDetections++;
                    const confidence = Math.min(Math.round(((bands.highMid + bands.presence) / 400) * 100), 95);
                    logger.warn(`[TW AudioFrequencyAnalyzer] 😱 SCREAM DETECTED at ${timestamp.toFixed(1)}s | ` +
                        `Confidence: ${confidence}% | ` +
                        `HighMid: ${bands.highMid.toFixed(0)}, Presence: ${bands.presence.toFixed(0)}`);
                    this.createWarning(eventKey, timestamp, 'children_screaming', confidence, 'Screaming detected via frequency analysis (3-5kHz sustained)');
                }
            }
        }
    }
    /**
     * Detect gunshot (1-5kHz sharp transient)
     */
    detectGunshot(timestamp, bands) {
        // Gunshot characteristics:
        // - Sharp energy spike across mid and highMid frequencies
        // - Very brief (< 100ms)
        // - Check for sudden increase compared to history
        if (this.frequencyHistory.length >= 2) {
            const previous = this.frequencyHistory[this.frequencyHistory.length - 2];
            const midIncrease = bands.mid - previous.mid;
            const highMidIncrease = bands.highMid - previous.highMid;
            // Sharp transient in mid-high frequencies
            if (midIncrease > 100 && highMidIncrease > 100 &&
                bands.mid > 180 && bands.highMid > 180) {
                const eventKey = `gunshot-freq-${Math.floor(timestamp)}`;
                if (!this.detectedEvents.has(eventKey)) {
                    this.stats.gunshotDetections++;
                    const confidence = Math.min(Math.round(((midIncrease + highMidIncrease) / 200) * 100), 90);
                    logger.warn(`[TW AudioFrequencyAnalyzer] 🔫 GUNSHOT DETECTED (freq) at ${timestamp.toFixed(1)}s | ` +
                        `Confidence: ${confidence}%`);
                    this.createWarning(eventKey, timestamp, 'violence', confidence, 'Gunshot detected via frequency analysis (1-5kHz transient)');
                }
            }
        }
    }
    /**
     * Detect explosion (20-200Hz low frequency surge)
     */
    detectExplosion(timestamp, bands) {
        // Explosion characteristics:
        // - Strong low frequency surge (sub-bass and bass)
        // - Sustained energy across spectrum
        // - High overall magnitude
        if (bands.bass > 180 && bands.subBass > 150 && bands.mid > 120) {
            const eventKey = `explosion-freq-${Math.floor(timestamp)}`;
            if (!this.detectedEvents.has(eventKey)) {
                this.stats.explosionDetections++;
                const confidence = Math.min(Math.round(((bands.bass + bands.subBass) / 330) * 100), 88);
                logger.warn(`[TW AudioFrequencyAnalyzer] 💥 EXPLOSION DETECTED (freq) at ${timestamp.toFixed(1)}s | ` +
                    `Confidence: ${confidence}% | ` +
                    `Bass: ${bands.bass.toFixed(0)}, SubBass: ${bands.subBass.toFixed(0)}`);
                this.createWarning(eventKey, timestamp, 'detonations_bombs', confidence, 'Explosion detected via frequency analysis (20-200Hz surge)');
            }
        }
    }
    /**
     * Detect siren (1-3kHz oscillating frequency)
     */
    detectSiren(timestamp, bands) {
        // Siren characteristics:
        // - Oscillating energy in mid frequencies
        // - Periodic pattern (up and down)
        if (this.detectOscillation('mid', 2)) { // 2 complete cycles
            const eventKey = `siren-${Math.floor(timestamp / 3) * 3}`; // Dedupe every 3 seconds
            if (!this.detectedEvents.has(eventKey)) {
                this.stats.sirenDetections++;
                logger.info(`[TW AudioFrequencyAnalyzer] 🚨 SIREN DETECTED at ${timestamp.toFixed(1)}s`);
                this.createWarning(eventKey, timestamp, 'violence', 75, 'Emergency siren detected via frequency analysis (oscillating 1-3kHz)');
            }
        }
    }
    /**
     * Detect medical equipment beeping (1-2kHz periodic)
     */
    detectMedicalBeep(timestamp, bands) {
        // Medical beep characteristics:
        // - Periodic steady tone in mid frequencies
        // - Regular intervals (0.5-2 seconds)
        // - Narrow frequency band
        if (this.detectPeriodicBeep('mid', 140, 5)) {
            const eventKey = `medical-beep-${Math.floor(timestamp / 5) * 5}`; // Dedupe every 5 seconds
            if (!this.detectedEvents.has(eventKey)) {
                this.stats.medicalBeepDetections++;
                logger.debug(`[TW AudioFrequencyAnalyzer] 🏥 MEDICAL BEEP DETECTED at ${timestamp.toFixed(1)}s`);
                this.createWarning(eventKey, timestamp, 'medical_procedures', 70, 'Medical equipment detected via frequency analysis (periodic 1-2kHz)');
            }
        }
    }
    /**
     * Detect crying/sobbing (500-2kHz rhythmic pattern)
     */
    detectCrying(timestamp, bands) {
        // Crying characteristics:
        // - Rhythmic pattern in mid frequencies
        // - Fluctuating energy (not steady)
        // - Lower intensity than screaming
        if (bands.mid > 120 && bands.mid < 180 && this.isFluctuating('mid', 30, 5)) {
            const eventKey = `crying-${Math.floor(timestamp / 3) * 3}`;
            if (!this.detectedEvents.has(eventKey)) {
                this.stats.cryingDetections++;
                logger.debug(`[TW AudioFrequencyAnalyzer] 😢 CRYING DETECTED at ${timestamp.toFixed(1)}s`);
                this.createWarning(eventKey, timestamp, 'children_screaming', 65, 'Crying detected via frequency analysis (rhythmic 500-2kHz)');
            }
        }
    }
    /**
     * Detect power tools/chainsaws (100-500Hz sustained buzz)
     */
    detectPowerTool(timestamp, bands) {
        // Power tool characteristics:
        // - Sustained buzz in lowMid frequencies
        // - Very steady (minimal fluctuation)
        if (bands.lowMid > 150 && this.isSustained('lowMid', 140, 8)) { // 800ms sustained
            const eventKey = `power-tool-${Math.floor(timestamp / 5) * 5}`;
            if (!this.detectedEvents.has(eventKey)) {
                this.stats.powerToolDetections++;
                logger.debug(`[TW AudioFrequencyAnalyzer] 🔧 POWER TOOL DETECTED at ${timestamp.toFixed(1)}s`);
                // Power tools might indicate violence (chainsaw scenes)
                this.createWarning(eventKey, timestamp, 'violence', 60, 'Power tool detected via frequency analysis (sustained 100-500Hz)');
            }
        }
    }
    /**
     * Check if frequency band is sustained above threshold
     */
    isSustained(band, threshold, checkCount) {
        if (this.frequencyHistory.length < checkCount) {
            return false;
        }
        const recent = this.frequencyHistory.slice(-checkCount);
        return recent.every(h => h[band] > threshold);
    }
    /**
     * Check if frequency band is fluctuating (rhythmic pattern)
     */
    isFluctuating(band, variance, checkCount) {
        if (this.frequencyHistory.length < checkCount) {
            return false;
        }
        const recent = this.frequencyHistory.slice(-checkCount);
        const values = recent.map(h => h[band]);
        // Calculate variance
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
        const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
        return Math.sqrt(avgSquaredDiff) > variance;
    }
    /**
     * Detect oscillating pattern (for sirens)
     */
    detectOscillation(band, minCycles) {
        if (this.frequencyHistory.length < 8) {
            return false;
        }
        const recent = this.frequencyHistory.slice(-8);
        const values = recent.map(h => h[band]);
        // Count direction changes (peaks and valleys)
        let directionChanges = 0;
        for (let i = 1; i < values.length - 1; i++) {
            const prev = values[i - 1];
            const curr = values[i];
            const next = values[i + 1];
            // Peak or valley
            if ((curr > prev && curr > next) || (curr < prev && curr < next)) {
                directionChanges++;
            }
        }
        return directionChanges >= minCycles * 2; // 2 direction changes per cycle
    }
    /**
     * Detect periodic beeping pattern
     */
    detectPeriodicBeep(band, threshold, checkCount) {
        if (this.frequencyHistory.length < checkCount) {
            return false;
        }
        const recent = this.frequencyHistory.slice(-checkCount);
        const values = recent.map(h => h[band]);
        // Check for periodic spikes above threshold
        const spikes = values.filter(v => v > threshold).length;
        // If 40-60% of samples are spikes, it's periodic
        const spikeRatio = spikes / values.length;
        return spikeRatio > 0.4 && spikeRatio < 0.6;
    }
    /**
     * Create warning from frequency detection
     */
    createWarning(eventKey, timestamp, category, confidence, description) {
        const event = {
            type: category,
            timestamp,
            confidence,
            frequencyProfile: this.frequencyHistory[this.frequencyHistory.length - 1]
        };
        this.detectedEvents.set(eventKey, event);
        const warning = {
            id: eventKey,
            videoId: 'audio-frequency-detected',
            categoryKey: category,
            startTime: Math.max(0, timestamp - 2),
            endTime: timestamp + 3,
            submittedBy: 'audio-frequency-analyzer',
            status: 'approved',
            score: 0,
            confidenceLevel: confidence,
            requiresModeration: false,
            description,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.onWarningDetected?.(warning);
    }
    /**
     * Register callback
     */
    onDetection(callback) {
        this.onWarningDetected = callback;
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
        this.frequencyHistory = [];
    }
    /**
     * Dispose
     */
    dispose() {
        this.stopMonitoring();
        // Don't disconnect if using shared context
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        this.video = null;
        this.frequencyData = null;
        this.detectedEvents.clear();
        this.frequencyHistory = [];
        this.onWarningDetected = null;
    }
}
//# sourceMappingURL=AudioFrequencyAnalyzer.js.map