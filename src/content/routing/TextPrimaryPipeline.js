/**
 * TEXT-PRIMARY PIPELINE - Algorithm 3.0 Innovation #13
 *
 * Specialized detection pipeline for TEXT-heavy triggers:
 * - LGBTQ+ phobia (80% text)
 * - Racial violence (60% text)
 * - Eating disorders (60% text)
 * - Religious trauma (70% text)
 *
 * Pipeline stages:
 * 1. Advanced NLP Analyzer (PRIMARY) - Pattern matching, context analysis
 * 2. Context Analyzer (PRIMARY) - Negation detection, sentiment analysis
 * 3. Sentiment Analyzer (VALIDATION) - Emotional tone
 * 4. Audio/Visual (CONTEXT ONLY) - Background context
 *
 * Created by: Claude Code (Algorithm 3.0 Revolutionary Session)
 * Date: 2025-11-11
 */
import { Logger } from '@shared/utils/logger';
const logger = new Logger('TextPrimaryPipeline');
export class TextPrimaryPipeline {
    stats = {
        totalProcessed: 0,
        textPrimary: 0,
        negationHandled: 0,
        contextValidated: 0,
        multiModalConfirmed: 0
    };
    /**
     * Process detection through text-primary pipeline
     */
    process(category, input, config) {
        this.stats.totalProcessed++;
        this.stats.textPrimary++;
        // Stage 1 & 2: Text Analysis (PRIMARY)
        const textConfidence = this.analyzeText(input, category);
        // Stage 3: Audio Context (SECONDARY)
        const audioConfidence = input.audio ? this.validateAudio(input, category) : 0;
        // Stage 4: Visual Context (SECONDARY)
        const visualConfidence = input.visual ? this.validateVisual(input, category) : 0;
        if (visualConfidence > 50 || audioConfidence > 50) {
            this.stats.contextValidated++;
        }
        // Apply category-specific weights
        const weightedConfidence = this.calculateWeightedConfidence(textConfidence, visualConfidence, audioConfidence, config.modalityWeights);
        // Check for multi-modal confirmation
        const modalitiesPresent = [
            textConfidence > 50,
            audioConfidence > 50,
            visualConfidence > 50
        ].filter(Boolean).length;
        if (modalitiesPresent >= 2) {
            this.stats.multiModalConfirmed++;
        }
        const detection = {
            category,
            timestamp: input.timestamp,
            confidence: weightedConfidence,
            route: 'text-primary',
            modalityContributions: {
                visual: visualConfidence * config.modalityWeights.visual,
                audio: audioConfidence * config.modalityWeights.audio,
                text: textConfidence * config.modalityWeights.text
            },
            validationPassed: this.validateDetection(weightedConfidence, modalitiesPresent, input),
            temporalContext: {
                pattern: config.temporalPattern,
                duration: 0
            }
        };
        logger.debug(`[TextPrimaryPipeline] Processed ${category} | ` +
            `Text: ${textConfidence.toFixed(1)}% | ` +
            `Audio: ${audioConfidence.toFixed(1)}% | ` +
            `Visual: ${visualConfidence.toFixed(1)}% | ` +
            `Weighted: ${weightedConfidence.toFixed(1)}% | ` +
            `Modalities: ${modalitiesPresent}`);
        return detection;
    }
    /**
     * Primary text analysis
     */
    analyzeText(input, category) {
        if (!input.text) {
            return 0;
        }
        const features = input.text.features;
        if (!features) {
            return input.text.confidence;
        }
        // Handle negation FIRST - reduces false positives
        if (features.nlpAnalysis.negationDetected) {
            this.stats.negationHandled++;
            // Reduce confidence significantly if negation detected
            return input.text.confidence * 0.3; // "no blood" → 70% confidence reduction
        }
        // Category-specific text analysis
        switch (category) {
            case 'lgbtq_phobia':
                return this.analyzeLGBTQPhobia(features);
            case 'racial_violence':
                return this.analyzeRacialViolence(features);
            case 'eating_disorders':
                return this.analyzeEatingDisorder(features);
            case 'religious_trauma':
                return this.analyzeReligiousTrauma(features);
            default:
                return input.text.confidence;
        }
    }
    /**
     * LGBTQ+ phobia text analysis
     */
    analyzeLGBTQPhobia(features) {
        let confidence = 0;
        // Slur detection is PRIMARY indicator
        if (features.linguisticPatterns.slurDetected) {
            confidence += 80; // Very high confidence for slurs
        }
        // Hate speech markers
        confidence += features.linguisticPatterns.hateSpeechMarkers * 0.2;
        return Math.min(confidence, 100);
    }
    /**
     * Racial violence text analysis
     */
    analyzeRacialViolence(features) {
        let confidence = 0;
        // Racial slurs
        if (features.linguisticPatterns.slurDetected) {
            confidence += 60;
        }
        // Hate speech + violence context
        confidence += features.linguisticPatterns.hateSpeechMarkers * 0.3;
        // Negative sentiment indicates hostility
        if (features.nlpAnalysis.sentimentScore < -50) {
            confidence += 10;
        }
        return Math.min(confidence, 100);
    }
    /**
     * Eating disorder text analysis
     */
    analyzeEatingDisorder(features) {
        let confidence = 0;
        // Pro-ana language is KEY indicator
        confidence += features.linguisticPatterns.proAnaLanguage * 0.5;
        // Body measurements discussion
        if (features.linguisticPatterns.bodyMeasurements) {
            confidence += 30;
        }
        // Context score (thinspo, purge, restrict language)
        confidence += features.nlpAnalysis.contextScore * 0.2;
        return Math.min(confidence, 100);
    }
    /**
     * Religious trauma text analysis
     */
    analyzeReligiousTrauma(features) {
        let confidence = 0;
        // Religious trauma markers (hell, damnation, sin-shaming)
        confidence += features.linguisticPatterns.religiousTraumaMarkers * 0.7;
        // Negative sentiment in religious context
        if (features.nlpAnalysis.sentimentScore < -30) {
            confidence += 20;
        }
        // Context score
        confidence += features.nlpAnalysis.contextScore * 0.1;
        return Math.min(confidence, 100);
    }
    /**
     * Validate with audio (context only)
     */
    validateAudio(input, category) {
        if (!input.audio) {
            return 0;
        }
        // Audio provides emotional context for text triggers
        // Angry/distressed audio + hate speech text = higher confidence
        return input.audio.confidence * 0.3; // Limited weight for audio in text-primary
    }
    /**
     * Validate with visual (context only)
     */
    validateVisual(input, category) {
        if (!input.visual) {
            return 0;
        }
        // For eating disorders, visual matters more (body-related behavior)
        if (category === 'eating_disorders') {
            return input.visual.confidence * 0.5;
        }
        // For other text triggers, visual is minimal context
        return input.visual.confidence * 0.2;
    }
    /**
     * Calculate weighted confidence
     */
    calculateWeightedConfidence(text, visual, audio, weights) {
        const weightedSum = (text * weights.text) +
            (visual * weights.visual) +
            (audio * weights.audio);
        return weightedSum;
    }
    /**
     * Validate detection quality
     */
    validateDetection(confidence, modalitiesPresent, input) {
        // For single-modality-sufficient categories (slurs), text alone is enough
        if (confidence >= 70) {
            return true;
        }
        // For other text-primary, prefer multi-modal confirmation
        if (confidence >= 60 && modalitiesPresent >= 2) {
            return true;
        }
        // Check negation - if negated, require very high confidence
        const features = input.text?.features;
        if (features?.nlpAnalysis.negationDetected && confidence < 80) {
            return false; // Negated content needs extra high confidence
        }
        return false;
    }
    /**
     * Get pipeline statistics
     */
    getStats() {
        return { ...this.stats };
    }
}
/**
 * Export singleton instance
 */
export const textPrimaryPipeline = new TextPrimaryPipeline();
/**
 * EQUAL TREATMENT FOR TEXT TRIGGERS
 *
 * This pipeline ensures:
 * ✅ Slurs get single-modality-sufficient detection (high priority)
 * ✅ Eating disorders get pro-ana language + body measurement detection
 * ✅ LGBTQ+ phobia gets slur + hate speech marker detection
 * ✅ Racial violence gets context-aware hate speech detection
 * ✅ Religious trauma gets trauma marker + sentiment analysis
 * ✅ Negation detection prevents false positives ("no blood")
 *
 * Research-backed: Bi-LSTM achieves 95.67% accuracy with negation marking
 */
//# sourceMappingURL=TextPrimaryPipeline.js.map