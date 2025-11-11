/**
 * CONTEXT ANALYZER - LIGHTWEIGHT NLP
 *
 * Analyzes subtitle context to reduce false positives and adjust confidence scores
 * No heavy NLP libraries - uses regex and logic for maximum performance
 *
 * Features:
 * - Negation detection ("no blood" → reduce confidence)
 * - Tense detection (past/present/future)
 * - Educational context detection ("seek help", "if you or someone")
 * - Word boundary matching (avoid "sex" in "Sussex")
 * - Related keyword counting (multiple keywords → higher confidence)
 *
 * Created by: Claude Code (Legendary Session)
 * Date: 2024-11-11
 */
import { Logger } from '@shared/utils/logger';
const logger = new Logger('ContextAnalyzer');
export class ContextAnalyzer {
    // Negation words that reduce confidence
    static NEGATION_WORDS = [
        'no', 'not', 'never', 'none', 'nobody', 'nothing', 'nowhere',
        'neither', 'nor', 'without', 'won\'t', 'can\'t', 'don\'t', 'didn\'t',
        'doesn\'t', 'haven\'t', 'hasn\'t', 'isn\'t', 'aren\'t', 'wasn\'t', 'weren\'t',
        'couldn\'t', 'wouldn\'t', 'shouldn\'t'
    ];
    // Words that indicate prevention/avoidance (also reduce confidence)
    static NEGATION_REDUCERS = [
        'prevent', 'preventing', 'prevented',
        'avoid', 'avoiding', 'avoided',
        'stop', 'stopping', 'stopped',
        'refuse', 'refusing', 'refused',
        'reject', 'rejecting', 'rejected'
    ];
    // Tense indicators
    static PAST_INDICATORS = [
        'was', 'were', 'had', 'did', 'ago', 'yesterday', 'last',
        'history', 'historical', 'previously', 'earlier', 'before',
        'years ago', 'months ago', 'days ago', 'used to'
    ];
    static PRESENT_INDICATORS = [
        'is', 'are', 'am', 'now', 'currently', 'happening',
        'today', 'right now', 'at this moment', 'presently'
    ];
    static FUTURE_INDICATORS = [
        'will', 'gonna', 'going to', 'tomorrow', 'soon',
        'next', 'later', 'eventually', 'planning to'
    ];
    // Educational/informative context indicators
    static EDUCATIONAL_INDICATORS = [
        'according to',
        'research shows',
        'studies show',
        'statistics',
        'awareness',
        'prevention',
        'if you or someone',
        'seek help',
        'get help',
        'hotline',
        'call 1-800',
        'call 988', // Suicide prevention hotline
        'resources available',
        'warning signs',
        'how to help',
        'mental health',
        'support groups',
        'therapy',
        'counseling',
        'professional help',
        'talk to someone',
        'you\'re not alone',
        'help is available'
    ];
    // Hypothetical indicators (reduce confidence)
    static HYPOTHETICAL_INDICATORS = [
        'what if',
        'imagine',
        'suppose',
        'let\'s say',
        'hypothetically',
        'could have',
        'might have',
        'would have',
        'if only'
    ];
    /**
     * Analyze context and adjust confidence
     */
    analyze(text, keyword, baseConfidence, requiresWordBoundary = true) {
        const lowerText = text.toLowerCase();
        const lowerKeyword = keyword.toLowerCase();
        // Find keyword position
        const keywordPos = lowerText.indexOf(lowerKeyword);
        if (keywordPos === -1) {
            return {
                isNegated: false,
                tense: 'unknown',
                isEducational: false,
                isHypothetical: false,
                relatedKeywordCount: 0,
                adjustedConfidence: 0
            };
        }
        // Check word boundary if required
        if (requiresWordBoundary && !this.isWordBoundary(lowerText, lowerKeyword)) {
            // Not a word boundary match - return 0 confidence
            return {
                isNegated: false,
                tense: 'unknown',
                isEducational: false,
                isHypothetical: false,
                relatedKeywordCount: 0,
                adjustedConfidence: 0
            };
        }
        // Perform context analysis
        const isNegated = this.isNegated(lowerText, keywordPos);
        const tense = this.detectTense(lowerText, keywordPos);
        const isEducational = this.isEducational(lowerText);
        const isHypothetical = this.isHypothetical(lowerText, keywordPos);
        const relatedKeywordCount = this.countRelatedKeywords(lowerText, lowerKeyword);
        // Calculate adjusted confidence
        let adjustedConfidence = baseConfidence;
        // Negation reduces confidence by 75% (to 25%)
        if (isNegated) {
            adjustedConfidence *= 0.25;
            logger.debug(`Negation detected for "${keyword}" → confidence reduced to ${adjustedConfidence}%`);
        }
        // Past tense (historical discussion) reduces confidence by 20%
        if (tense === 'past') {
            adjustedConfidence *= 0.8;
            logger.debug(`Past tense detected for "${keyword}" → confidence reduced to ${adjustedConfidence}%`);
        }
        // Educational/informative context reduces confidence by 30%
        if (isEducational) {
            adjustedConfidence *= 0.7;
            logger.debug(`Educational context detected → confidence reduced to ${adjustedConfidence}%`);
        }
        // Hypothetical context reduces confidence by 40%
        if (isHypothetical) {
            adjustedConfidence *= 0.6;
            logger.debug(`Hypothetical context detected → confidence reduced to ${adjustedConfidence}%`);
        }
        // Multiple related keywords increase confidence by 15% each
        if (relatedKeywordCount > 1) {
            const bonus = 1 + ((relatedKeywordCount - 1) * 0.15);
            adjustedConfidence *= bonus;
            adjustedConfidence = Math.min(adjustedConfidence, 100); // Cap at 100%
            logger.debug(`${relatedKeywordCount} related keywords detected → confidence increased to ${adjustedConfidence}%`);
        }
        adjustedConfidence = Math.round(adjustedConfidence);
        return {
            isNegated,
            tense,
            isEducational,
            isHypothetical,
            relatedKeywordCount,
            adjustedConfidence
        };
    }
    /**
     * Check if keyword appears in negated context
     * Example: "There was no blood" → true
     */
    isNegated(text, keywordPosition) {
        // Look 5 words before keyword
        const beforeContext = this.getWordsBefore(text, keywordPosition, 5);
        // Check for negation words
        const hasNegation = ContextAnalyzer.NEGATION_WORDS.some(neg => beforeContext.includes(neg));
        const hasNegationReducer = ContextAnalyzer.NEGATION_REDUCERS.some(reducer => beforeContext.includes(reducer));
        return hasNegation || hasNegationReducer;
    }
    /**
     * Detect tense from context
     */
    detectTense(text, keywordPosition) {
        // Check context window (10 words before and after)
        const context = this.getContextWindow(text, keywordPosition, 10);
        // Count indicators
        const pastCount = ContextAnalyzer.PAST_INDICATORS.filter(indicator => context.includes(indicator)).length;
        const presentCount = ContextAnalyzer.PRESENT_INDICATORS.filter(indicator => context.includes(indicator)).length;
        const futureCount = ContextAnalyzer.FUTURE_INDICATORS.filter(indicator => context.includes(indicator)).length;
        // Return tense with most indicators
        if (pastCount > presentCount && pastCount > futureCount) {
            return 'past';
        }
        else if (presentCount > pastCount && presentCount > futureCount) {
            return 'present';
        }
        else if (futureCount > pastCount && futureCount > presentCount) {
            return 'future';
        }
        return 'unknown';
    }
    /**
     * Check if text is educational/informative
     */
    isEducational(text) {
        return ContextAnalyzer.EDUCATIONAL_INDICATORS.some(indicator => text.includes(indicator));
    }
    /**
     * Check if keyword appears in hypothetical context
     * Example: "What if someone got hurt?"
     */
    isHypothetical(text, keywordPosition) {
        const beforeContext = this.getWordsBefore(text, keywordPosition, 5);
        return ContextAnalyzer.HYPOTHETICAL_INDICATORS.some(indicator => beforeContext.includes(indicator));
    }
    /**
     * Count related keywords in text (excluding the current keyword)
     * Used to boost confidence when multiple trigger words appear together
     */
    countRelatedKeywords(text, currentKeyword) {
        const triggerKeywords = [
            'blood', 'violence', 'death', 'murder', 'kill', 'shoot', 'stab',
            'suicide', 'rape', 'assault', 'abuse', 'torture', 'gore',
            'scream', 'attack', 'fight', 'weapon', 'gun', 'knife'
        ];
        let count = 0;
        for (const keyword of triggerKeywords) {
            if (keyword === currentKeyword)
                continue; // Skip current keyword
            if (text.includes(keyword)) {
                count++;
            }
        }
        return count;
    }
    /**
     * Check if keyword matches word boundaries
     * Example: "sex" should NOT match "Sussex", "Essex", "sextant"
     */
    isWordBoundary(text, keyword) {
        // Word boundary regex: \b matches word boundaries
        const regex = new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, 'i');
        return regex.test(text);
    }
    /**
     * Get words before keyword position
     */
    getWordsBefore(text, position, wordCount) {
        const beforeText = text.substring(0, position);
        const words = beforeText.split(/\s+/);
        const relevantWords = words.slice(-wordCount);
        return relevantWords.join(' ').toLowerCase();
    }
    /**
     * Get context window around keyword
     */
    getContextWindow(text, position, wordCount) {
        // Get wordCount words before and after
        const words = text.split(/\s+/);
        // Find word index at position
        let charCount = 0;
        let wordIndex = 0;
        for (let i = 0; i < words.length; i++) {
            charCount += words[i].length + 1; // +1 for space
            if (charCount > position) {
                wordIndex = i;
                break;
            }
        }
        const startIndex = Math.max(0, wordIndex - wordCount);
        const endIndex = Math.min(words.length, wordIndex + wordCount + 1);
        return words.slice(startIndex, endIndex).join(' ').toLowerCase();
    }
    /**
     * Escape regex special characters
     */
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    /**
     * Get analysis summary for logging
     */
    getAnalysisSummary(analysis) {
        const parts = [];
        if (analysis.isNegated)
            parts.push('NEGATED');
        if (analysis.isEducational)
            parts.push('EDUCATIONAL');
        if (analysis.isHypothetical)
            parts.push('HYPOTHETICAL');
        if (analysis.tense !== 'unknown')
            parts.push(`TENSE:${analysis.tense.toUpperCase()}`);
        if (analysis.relatedKeywordCount > 1)
            parts.push(`RELATED:${analysis.relatedKeywordCount}`);
        return parts.length > 0 ? `[${parts.join(', ')}]` : '';
    }
}
//# sourceMappingURL=ContextAnalyzer.js.map