/**
 * Subtitle Analyzer
 *
 * Analyzes video subtitles in real-time to detect trigger warnings
 * even for content not in the database.
 *
 * Works with:
 * - .vtt (WebVTT) - Most common on streaming platforms
 * - .srt (SubRip) - Standard subtitle format
 * - Native browser subtitle tracks
 */
import { Logger } from '@shared/utils/logger';
import { SubtitleTranslator } from './SubtitleTranslator';
const logger = new Logger('SubtitleAnalyzer');
export class SubtitleAnalyzer {
    textTrack = null;
    detectedTriggers = new Map();
    keywordDictionary = [];
    onTriggerDetected = null;
    translator;
    needsTranslation = false;
    sourceLanguage = 'en';
    video = null;
    prefetchInterval = null;
    constructor() {
        this.buildKeywordDictionary();
        this.translator = new SubtitleTranslator();
        logger.info('[TW SubtitleAnalyzer] 🎬 SubtitleAnalyzer initialized with', this.keywordDictionary.length, 'keyword patterns');
    }
    /**
     * Build comprehensive trigger keyword dictionary
     * Maps to actual TriggerCategory types from the system
     */
    buildKeywordDictionary() {
        this.keywordDictionary = [
            // Violence
            { keyword: 'gunshot', category: 'violence', confidence: 90 },
            { keyword: 'shooting', category: 'violence', confidence: 85 },
            { keyword: 'stabbing', category: 'violence', confidence: 90 },
            { keyword: 'stabbed', category: 'violence', confidence: 90 },
            { keyword: 'beating', category: 'violence', confidence: 80 },
            { keyword: 'punch', category: 'violence', confidence: 70 },
            { keyword: 'kick', category: 'violence', confidence: 60 },
            { keyword: 'fight', category: 'violence', confidence: 50 },
            { keyword: 'murder', category: 'murder', confidence: 90 },
            { keyword: 'murdered', category: 'murder', confidence: 90 },
            // Gore & Blood
            { keyword: 'blood', category: 'blood', confidence: 70 },
            { keyword: 'bleeding', category: 'blood', confidence: 75 },
            { keyword: 'gore', category: 'gore', confidence: 95 },
            { keyword: 'dismember', category: 'gore', confidence: 95 },
            { keyword: 'decapitate', category: 'gore', confidence: 95 },
            { keyword: 'mutilate', category: 'gore', confidence: 90 },
            { keyword: 'severed', category: 'gore', confidence: 85 },
            // Suicide & Self-Harm
            { keyword: 'suicide', category: 'suicide', confidence: 95 },
            { keyword: 'kill himself', category: 'suicide', confidence: 90 },
            { keyword: 'kill herself', category: 'suicide', confidence: 90 },
            { keyword: 'self harm', category: 'self_harm', confidence: 95 },
            { keyword: 'self-harm', category: 'self_harm', confidence: 95 },
            { keyword: 'cutting', category: 'self_harm', confidence: 85 },
            // Sexual Content
            { keyword: 'rape', category: 'sexual_assault', confidence: 100 },
            { keyword: 'raped', category: 'sexual_assault', confidence: 100 },
            { keyword: 'sexual assault', category: 'sexual_assault', confidence: 100 },
            { keyword: 'molest', category: 'sexual_assault', confidence: 95 },
            { keyword: 'sex', category: 'sex', confidence: 50 },
            // Torture & Abuse
            { keyword: 'torture', category: 'torture', confidence: 95 },
            { keyword: 'tortured', category: 'torture', confidence: 95 },
            { keyword: 'child abuse', category: 'child_abuse', confidence: 95 },
            // Substance Abuse
            { keyword: 'overdose', category: 'drugs', confidence: 90 },
            { keyword: 'overdosed', category: 'drugs', confidence: 90 },
            { keyword: 'heroin', category: 'drugs', confidence: 85 },
            { keyword: 'cocaine', category: 'drugs', confidence: 85 },
            { keyword: 'meth', category: 'drugs', confidence: 85 },
            // Mental Health
            { keyword: 'panic attack', category: 'medical_procedures', confidence: 75 },
            { keyword: 'anxiety attack', category: 'medical_procedures', confidence: 75 },
            { keyword: 'eating disorder', category: 'eating_disorders', confidence: 85 },
            { keyword: 'anorexia', category: 'eating_disorders', confidence: 90 },
            { keyword: 'bulimia', category: 'eating_disorders', confidence: 90 },
            // Medical
            { keyword: 'needle', category: 'medical_procedures', confidence: 75 },
            { keyword: 'syringe', category: 'medical_procedures', confidence: 80 },
            { keyword: 'injection', category: 'medical_procedures', confidence: 70 },
            { keyword: 'surgery', category: 'medical_procedures', confidence: 80 },
            { keyword: 'amputation', category: 'medical_procedures', confidence: 90 },
            // Vomit
            { keyword: 'vomit', category: 'vomit', confidence: 85 },
            { keyword: 'vomiting', category: 'vomit', confidence: 85 },
            { keyword: 'puke', category: 'vomit', confidence: 80 },
            // Animals
            { keyword: 'animal cruelty', category: 'animal_cruelty', confidence: 95 },
            // Discrimination
            { keyword: 'homophobic', category: 'lgbtq_phobia', confidence: 85 },
            { keyword: 'transphobic', category: 'lgbtq_phobia', confidence: 85 },
            // Racial Violence
            { keyword: 'hate crime', category: 'racial_violence', confidence: 95 },
            { keyword: 'racist', category: 'racial_violence', confidence: 70 },
            // Domestic Violence
            { keyword: 'domestic violence', category: 'domestic_violence', confidence: 90 },
            { keyword: 'domestic abuse', category: 'domestic_violence', confidence: 90 },
            // Subtitle descriptors (in brackets)
            { keyword: '[gunshot]', category: 'violence', confidence: 95 },
            { keyword: '[gunfire]', category: 'violence', confidence: 95 },
            { keyword: '[explosion]', category: 'detonations_bombs', confidence: 95 },
            { keyword: '[screaming]', category: 'children_screaming', confidence: 75 },
            { keyword: '[screams]', category: 'children_screaming', confidence: 75 },
            { keyword: '[vomiting]', category: 'vomit', confidence: 90 },
            { keyword: '[flashing lights]', category: 'flashing_lights', confidence: 95 },
        ];
    }
    /**
     * Initialize subtitle tracking for a video element
     *
     * CRITICAL: Analyzer runs INDEPENDENTLY from user's subtitle choice
     *
     * Track Selection Strategy:
     * 1. ALWAYS prefer English track for analyzer (runs in 'hidden' mode)
     * 2. If no English track → Use first available language + translation
     * 3. User can show/hide any subtitles they want without affecting analyzer
     *
     * Examples:
     * - User shows Spanish subtitles → Analyzer uses English track (hidden)
     * - User shows no subtitles → Analyzer uses English track (hidden)
     * - Only Spanish available → Analyzer uses Spanish + translates to English
     */
    initialize(video) {
        this.video = video;
        const tracks = video.textTracks;
        logger.info(`[SubtitleAnalyzer] Initializing with ${tracks.length} text tracks`);
        if (tracks.length === 0) {
            logger.info('[SubtitleAnalyzer] ❌ No subtitle tracks found - analysis disabled');
            return;
        }
        // Find English track for analyzer (independent of user choice)
        let englishTrack = null;
        let fallbackTrack = null;
        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            if (track.kind !== 'subtitles' && track.kind !== 'captions') {
                continue; // Skip non-subtitle tracks
            }
            const language = track.language.toLowerCase();
            const isEnglish = language.startsWith('en'); // Matches 'en', 'en-US', 'en-GB', etc.
            // Priority 1: English track for analyzer (always preferred)
            if (isEnglish && !englishTrack) {
                englishTrack = track;
            }
            // Priority 2: Any available track as fallback
            if (!fallbackTrack) {
                fallbackTrack = track;
            }
        }
        // Select track for analyzer
        const selectedTrack = englishTrack || fallbackTrack;
        if (!selectedTrack) {
            logger.info('[SubtitleAnalyzer] ❌ No usable subtitle tracks available');
            return;
        }
        logger.info(`[SubtitleAnalyzer] ✅ Subtitles found - Track: ${selectedTrack.label || 'Untitled'} (${selectedTrack.language || 'unknown'})`);
        // Determine if we need translation
        this.sourceLanguage = selectedTrack.language || 'en';
        this.needsTranslation = !this.sourceLanguage.toLowerCase().startsWith('en');
        this.textTrack = selectedTrack;
        this.attachListeners();
        const trackInfo = `${selectedTrack.label || 'Untitled'} (${this.sourceLanguage})`;
        if (this.needsTranslation) {
            logger.info(`Initialized with non-English track: ${trackInfo} - Translation enabled`);
            // Start prefetching translations
            this.startPrefetching();
        }
        else {
            logger.info(`Initialized with English track: ${trackInfo}`);
        }
    }
    /**
     * Attach listeners to subtitle cues
     */
    attachListeners() {
        if (!this.textTrack)
            return;
        this.textTrack.mode = 'hidden'; // Enable track without showing it
        this.textTrack.addEventListener('cuechange', () => {
            this.analyzeCues();
        });
        logger.debug('Listeners attached');
    }
    /**
     * Start prefetching translations ahead of playback
     */
    startPrefetching() {
        if (!this.needsTranslation || !this.video || !this.textTrack) {
            return;
        }
        // Prefetch every 5 seconds
        this.prefetchInterval = window.setInterval(() => {
            if (!this.video || !this.textTrack || !this.textTrack.cues) {
                return;
            }
            const cues = Array.from(this.textTrack.cues);
            const currentTime = this.video.currentTime;
            // Prefetch translations 30 seconds ahead
            this.translator.prefetchTranslations(cues, this.sourceLanguage, currentTime, 30);
        }, 5000);
    }
    /**
     * Analyze current subtitle cues for trigger keywords
     */
    async analyzeCues() {
        if (!this.textTrack || !this.textTrack.activeCues)
            return;
        const cues = Array.from(this.textTrack.activeCues);
        for (const cue of cues) {
            let textToAnalyze = cue.text;
            // Translate if needed
            if (this.needsTranslation) {
                textToAnalyze = await this.translator.translateText(cue.text, this.sourceLanguage);
            }
            this.analyzeText(textToAnalyze, cue.startTime, cue.endTime);
        }
    }
    /**
     * Analyze text for trigger keywords
     */
    analyzeText(text, startTime, endTime) {
        const lowerText = text.toLowerCase();
        for (const trigger of this.keywordDictionary) {
            const keyword = trigger.keyword.toLowerCase();
            if (lowerText.includes(keyword)) {
                // Check if we already detected this trigger at this time
                const triggerId = `${trigger.category}-${Math.floor(startTime)}`;
                if (this.detectedTriggers.has(triggerId)) {
                    continue; // Already detected
                }
                logger.info(`[SubtitleAnalyzer] 🎯 Trigger detected! Category: ${trigger.category}, Keyword: "${keyword}", Time: ${Math.floor(startTime)}s, Text: "${text.substring(0, 50)}..."`);
                // Create warning
                const warning = {
                    id: triggerId,
                    videoId: 'subtitle-detected',
                    categoryKey: trigger.category,
                    startTime: Math.max(0, startTime - 5), // 5 seconds warning
                    endTime: endTime,
                    submittedBy: 'subtitle-analyzer',
                    status: 'approved',
                    score: 0,
                    confidenceLevel: trigger.confidence,
                    requiresModeration: false,
                    description: `Detected in subtitles: "${text.substring(0, 100)}"`,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                this.detectedTriggers.set(triggerId, warning);
                logger.info(`Detected trigger: ${trigger.category} at ${startTime}s`);
                // Notify callback
                if (this.onTriggerDetected) {
                    this.onTriggerDetected(warning);
                }
            }
        }
    }
    /**
     * Register callback for when triggers are detected
     */
    onDetection(callback) {
        this.onTriggerDetected = callback;
    }
    /**
     * Get all detected triggers
     */
    getDetectedTriggers() {
        return Array.from(this.detectedTriggers.values());
    }
    /**
     * Clear detected triggers
     */
    clear() {
        this.detectedTriggers.clear();
    }
    /**
     * Dispose of analyzer
     */
    dispose() {
        // Clear prefetch interval
        if (this.prefetchInterval) {
            clearInterval(this.prefetchInterval);
            this.prefetchInterval = null;
        }
        this.textTrack = null;
        this.video = null;
        this.detectedTriggers.clear();
        this.onTriggerDetected = null;
    }
    /**
     * Get translation statistics
     */
    getTranslationStats() {
        return {
            enabled: this.needsTranslation,
            language: this.sourceLanguage,
            cacheStats: this.translator.getCacheStats(),
        };
    }
}
//# sourceMappingURL=SubtitleAnalyzer.js.map