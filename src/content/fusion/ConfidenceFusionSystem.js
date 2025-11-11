/**
 * CONFIDENCE FUSION SYSTEM
 *
 * Combines multiple detection signals using Bayesian probability and correlation analysis
 * This is the "brain" that makes intelligent decisions based on all available evidence
 *
 * Features:
 * - Bayesian probability combination
 * - Multi-signal correlation bonuses
 * - Temporal consistency checking
 * - False positive filtering
 * - Confidence boosting for correlated detections
 *
 * Example:
 * - Subtitle says "[gunshot]" (85% confidence)
 * - Audio detects gunshot sound (90% confidence)
 * - Visual shows muzzle flash (red spike) (75% confidence)
 * → Fused confidence: 98% (all three signals agree!)
 *
 * Created by: Claude Code (Legendary Session)
 * Date: 2024-11-11
 */
import { Logger } from '@shared/utils/logger';
const logger = new Logger('ConfidenceFusionSystem');
export class ConfidenceFusionSystem {
    recentDetections = [];
    fusedWarnings = new Map();
    DETECTION_WINDOW = 10; // 10 seconds
    MIN_CONFIDENCE_THRESHOLD = 50; // Don't fuse detections below 50%
    OUTPUT_THRESHOLD = 70; // Only output warnings >= 70% fused confidence
    // Statistics
    stats = {
        totalDetections: 0,
        fusedWarnings: 0,
        falsePositivesFiltered: 0,
        confidenceBoosted: 0,
        correlationDetected: 0
    };
    /**
     * Add a detection from any source
     */
    addDetection(detection) {
        // Filter out low-confidence detections
        if (detection.confidence < this.MIN_CONFIDENCE_THRESHOLD) {
            return;
        }
        this.stats.totalDetections++;
        this.recentDetections.push(detection);
        // Clean old detections
        this.cleanOldDetections(detection.timestamp);
        // Try to fuse with recent detections
        this.attemptFusion(detection);
    }
    /**
     * Remove detections older than window
     */
    cleanOldDetections(currentTime) {
        this.recentDetections = this.recentDetections.filter(d => currentTime - d.timestamp <= this.DETECTION_WINDOW);
    }
    /**
     * Attempt to fuse new detection with recent ones
     */
    attemptFusion(newDetection) {
        // Find related detections (same category, similar timestamp)
        const related = this.findRelatedDetections(newDetection);
        if (related.length === 0) {
            // No related detections - apply multi-modal validation
            // For VISUAL triggers, require visual confirmation or reduce confidence significantly
            const adjustedConfidence = this.applyMultiModalValidation(newDetection);
            if (adjustedConfidence >= this.OUTPUT_THRESHOLD) {
                this.outputFusedWarning(newDetection.category, newDetection.timestamp, [newDetection], adjustedConfidence);
            }
            else {
                this.stats.falsePositivesFiltered++;
                logger.debug(`[TW ConfidenceFusion] ❌ SINGLE DETECTION REJECTED | ` +
                    `Category: ${newDetection.category} | ` +
                    `Source: ${newDetection.source} | ` +
                    `Original: ${newDetection.confidence}% → Adjusted: ${adjustedConfidence}% < threshold`);
            }
            return;
        }
        // Fuse all related detections
        const allDetections = [newDetection, ...related];
        const fusedConfidence = this.calculateFusedConfidence(allDetections);
        // Check if fused confidence passes output threshold
        if (fusedConfidence >= this.OUTPUT_THRESHOLD) {
            this.stats.fusedWarnings++;
            if (allDetections.length > 1) {
                this.stats.confidenceBoosted++;
                this.stats.correlationDetected++;
            }
            logger.info(`[TW ConfidenceFusion] 🧠 FUSION SUCCESS | ` +
                `Category: ${newDetection.category} | ` +
                `Sources: ${allDetections.length} | ` +
                `Individual: ${allDetections.map(d => d.confidence).join('%, ')}% | ` +
                `Fused: ${fusedConfidence}%`);
            this.outputFusedWarning(newDetection.category, newDetection.timestamp, allDetections, fusedConfidence);
        }
        else {
            // Fused confidence too low
            this.stats.falsePositivesFiltered++;
            logger.debug(`[TW ConfidenceFusion] ❌ FUSION REJECTED | ` +
                `Category: ${newDetection.category} | ` +
                `Fused confidence ${fusedConfidence}% < threshold ${this.OUTPUT_THRESHOLD}%`);
        }
    }
    /**
     * Apply multi-modal validation for single detections
     *
     * ADDRESSES CONCERN: "How does it make sure it's SHOWN and not just TALKING about it??"
     *
     * Visual triggers (blood, gore, vomit, etc.) should require BOTH:
     * - Subtitle/audio detection AND visual confirmation
     * OR have significantly reduced confidence if only one modality detects
     */
    applyMultiModalValidation(detection) {
        // Define VISUAL trigger categories that require seeing the content
        const visualTriggers = [
            'blood',
            'gore',
            'vomit',
            'dead_body_body_horror',
            'medical_procedures',
            'self_harm',
            'violence' // Physical violence is visual
        ];
        // If this is a visual trigger category
        if (visualTriggers.includes(detection.category)) {
            // If detection is from subtitle/audio only (not from visual analyzer)
            if (detection.source === 'subtitle' ||
                detection.source === 'audio-waveform' ||
                detection.source === 'audio-frequency' ||
                detection.source === 'temporal-pattern') {
                // Check if we have ANY visual confirmation in recent detections
                const hasVisualConfirmation = this.recentDetections.some(d => d.category === detection.category &&
                    d.source === 'visual' &&
                    Math.abs(d.timestamp - detection.timestamp) <= 3 // Within 3 seconds
                );
                if (hasVisualConfirmation) {
                    // Visual confirmation exists - keep confidence as is
                    logger.debug(`[TW ConfidenceFusion] ✅ MULTI-MODAL VALIDATED | ` +
                        `${detection.category} from ${detection.source} has visual confirmation`);
                    return detection.confidence;
                }
                else {
                    // NO visual confirmation - significantly reduce confidence
                    // For discussion vs shown: "there was blood" but no red pixels on screen
                    const reductionFactor = 0.4; // Reduce to 40% of original
                    const adjustedConfidence = Math.round(detection.confidence * reductionFactor);
                    logger.info(`[TW ConfidenceFusion] ⚠️  VISUAL TRIGGER WITHOUT VISUAL CONFIRMATION | ` +
                        `${detection.category} from ${detection.source} | ` +
                        `${detection.confidence}% → ${adjustedConfidence}% (60% reduction) | ` +
                        `Likely DISCUSSED not SHOWN`);
                    return adjustedConfidence;
                }
            }
        }
        // Non-visual triggers or visual-source detections pass through unchanged
        return detection.confidence;
    }
    /**
     * Find detections related to the new one
     */
    findRelatedDetections(detection) {
        return this.recentDetections.filter(d => d !== detection && // Not the same detection
            d.category === detection.category && // Same category
            Math.abs(d.timestamp - detection.timestamp) <= 5 && // Within 5 seconds
            d.source !== detection.source // Different source (avoid double-counting)
        );
    }
    /**
     * Calculate fused confidence using Bayesian probability
     */
    calculateFusedConfidence(detections) {
        // Start with prior probability (base rate for this category)
        let probability = this.getPriorProbability(detections[0].category);
        // Apply Bayesian updates for each detection
        for (const detection of detections) {
            const likelihood = detection.confidence / 100;
            // Bayesian update: P(H|E) = P(E|H) * P(H) / P(E)
            // Simplified: P(H|E) = (likelihood * prior) / ((likelihood * prior) + ((1 - likelihood) * (1 - prior)))
            probability = (likelihood * probability) / ((likelihood * probability) + ((1 - likelihood) * (1 - probability)));
        }
        // Apply correlation bonuses
        const correlationBonus = this.calculateCorrelationBonus(detections);
        probability = Math.min(probability * correlationBonus, 1.0);
        // Apply temporal consistency
        const temporalBonus = this.calculateTemporalConsistency(detections);
        probability = Math.min(probability * temporalBonus, 1.0);
        return Math.round(probability * 100);
    }
    /**
     * Get prior probability for category (base rate)
     */
    getPriorProbability(category) {
        // Base rates vary by category
        const priors = {
            // High severity - higher prior (more likely to be true positive)
            'violence': 0.15,
            'murder': 0.15,
            'gore': 0.15,
            'suicide': 0.20, // Higher prior due to severity
            'sexual_assault': 0.20,
            // Medium severity
            'blood': 0.12,
            'torture': 0.15,
            'self_harm': 0.15,
            'child_abuse': 0.18,
            // Lower severity or more common
            'medical_procedures': 0.10,
            'vomit': 0.08,
            'sex': 0.08,
            'drugs': 0.10,
            // Specific triggers
            'flashing_lights': 0.12,
            'jumpscares': 0.10,
            'detonations_bombs': 0.12,
            // Social issues
            'lgbtq_phobia': 0.12,
            'racial_violence': 0.12,
            'domestic_violence': 0.15,
            // Other
            'eating_disorders': 0.10,
            'animal_cruelty': 0.10,
            'children_screaming': 0.08,
            'natural_disasters': 0.08,
            'religious_trauma': 0.10,
            'dead_body_body_horror': 0.12,
            'cannibalism': 0.15
        };
        return priors[category] || 0.10; // Default 10%
    }
    /**
     * Calculate correlation bonus for multiple sources
     */
    calculateCorrelationBonus(detections) {
        let bonus = 1.0;
        const sources = new Set(detections.map(d => d.source));
        // Subtitle + Audio correlation (very strong)
        if (sources.has('subtitle') && (sources.has('audio-waveform') || sources.has('audio-frequency'))) {
            bonus *= 1.30; // +30% bonus
            logger.debug('[TW ConfidenceFusion] 🎯 Subtitle + Audio correlation bonus: +30%');
        }
        // Audio + Visual correlation (strong)
        if ((sources.has('audio-waveform') || sources.has('audio-frequency')) && sources.has('visual')) {
            bonus *= 1.25; // +25% bonus
            logger.debug('[TW ConfidenceFusion] 🎯 Audio + Visual correlation bonus: +25%');
        }
        // Triple correlation: Subtitle + Audio + Visual (very strong)
        if (sources.has('subtitle') &&
            (sources.has('audio-waveform') || sources.has('audio-frequency')) &&
            sources.has('visual')) {
            bonus *= 1.20; // Additional +20% bonus
            logger.debug('[TW ConfidenceFusion] 🎯 Triple correlation bonus (S+A+V): +20%');
        }
        // Temporal pattern + any other source (strong)
        if (sources.has('temporal-pattern') && sources.size > 1) {
            bonus *= 1.25; // +25% bonus
            logger.debug('[TW ConfidenceFusion] 🎯 Temporal pattern correlation bonus: +25%');
        }
        // Database + any detector (strong validation)
        if (sources.has('database') && sources.size > 1) {
            bonus *= 1.15; // +15% bonus
            logger.debug('[TW ConfidenceFusion] 🎯 Database validation bonus: +15%');
        }
        // Multiple audio sources
        if (sources.has('audio-waveform') && sources.has('audio-frequency')) {
            bonus *= 1.15; // +15% bonus
            logger.debug('[TW ConfidenceFusion] 🎯 Dual audio detection bonus: +15%');
        }
        return bonus;
    }
    /**
     * Calculate temporal consistency (are detections happening in logical sequence?)
     */
    calculateTemporalConsistency(detections) {
        if (detections.length < 2) {
            return 1.0; // Single detection, no temporal analysis needed
        }
        // Sort by timestamp
        const sorted = [...detections].sort((a, b) => a.timestamp - b.timestamp);
        // Calculate time span
        const timeSpan = sorted[sorted.length - 1].timestamp - sorted[0].timestamp;
        // Tight clustering (all within 2 seconds) = high consistency
        if (timeSpan <= 2) {
            return 1.15; // +15% bonus for tight temporal clustering
        }
        // Moderate clustering (within 5 seconds) = moderate consistency
        if (timeSpan <= 5) {
            return 1.08; // +8% bonus
        }
        // Wide spread (> 5 seconds) = may be unrelated
        if (timeSpan > 8) {
            return 0.95; // -5% penalty (might be separate events)
        }
        return 1.0; // Neutral
    }
    /**
     * Check if detection is likely a false positive
     */
    isFalsePositive(detection) {
        // Single low-confidence detection with no corroboration
        if (detection.confidence < 60 && this.findRelatedDetections(detection).length === 0) {
            return true;
        }
        // Check for known false positive patterns
        if (detection.source === 'subtitle') {
            // Subtitle-only detection of common false positive categories
            const fpCategories = ['sex', 'violence'];
            if (fpCategories.includes(detection.category) && detection.confidence < 70) {
                return true;
            }
        }
        return false;
    }
    /**
     * Output fused warning
     */
    outputFusedWarning(category, timestamp, detections, fusedConfidence) {
        const confidence = fusedConfidence || detections[0].confidence;
        // Create unique key
        const key = `${category}-${Math.floor(timestamp)}`;
        // Check if we've already output this warning
        if (this.fusedWarnings.has(key)) {
            return;
        }
        // Create fused warning
        const sources = detections.map(d => d.source).join(', ');
        const individualConfidences = detections.map(d => `${d.source}:${d.confidence}%`).join(', ');
        const warning = {
            id: `fused-${key}`,
            videoId: 'confidence-fusion',
            categoryKey: category,
            startTime: Math.max(0, timestamp - 3),
            endTime: timestamp + 5,
            submittedBy: 'confidence-fusion-system',
            status: 'approved',
            score: 0,
            confidenceLevel: confidence,
            requiresModeration: false,
            description: `Multi-signal detection (${sources}) | Individual: [${individualConfidences}] → Fused: ${confidence}%`,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.fusedWarnings.set(key, warning);
        logger.info(`[TW ConfidenceFusion] ✅ FUSED WARNING OUTPUT | ` +
            `${category} at ${timestamp.toFixed(1)}s | ` +
            `Confidence: ${confidence}% | ` +
            `Sources: ${detections.length}`);
        // Emit warning to listeners (will be implemented by integration layer)
    }
    /**
     * Get fused warnings
     */
    getFusedWarnings() {
        return Array.from(this.fusedWarnings.values());
    }
    /**
     * Get statistics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Clear state
     */
    clear() {
        this.recentDetections = [];
        this.fusedWarnings.clear();
    }
    /**
     * Register callback for fused warnings
     */
    onFusedWarning(callback) {
        // Store callback for emission
        // Implementation depends on integration architecture
    }
}
//# sourceMappingURL=ConfidenceFusionSystem.js.map