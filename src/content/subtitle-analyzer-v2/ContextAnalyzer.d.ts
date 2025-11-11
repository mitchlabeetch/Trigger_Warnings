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
interface ContextAnalysis {
    isNegated: boolean;
    tense: 'past' | 'present' | 'future' | 'unknown';
    isEducational: boolean;
    isHypothetical: boolean;
    relatedKeywordCount: number;
    adjustedConfidence: number;
}
export declare class ContextAnalyzer {
    private static readonly NEGATION_WORDS;
    private static readonly NEGATION_REDUCERS;
    private static readonly PAST_INDICATORS;
    private static readonly PRESENT_INDICATORS;
    private static readonly FUTURE_INDICATORS;
    private static readonly EDUCATIONAL_INDICATORS;
    private static readonly HYPOTHETICAL_INDICATORS;
    /**
     * Analyze context and adjust confidence
     */
    analyze(text: string, keyword: string, baseConfidence: number, requiresWordBoundary?: boolean): ContextAnalysis;
    /**
     * Check if keyword appears in negated context
     * Example: "There was no blood" → true
     */
    private isNegated;
    /**
     * Detect tense from context
     */
    private detectTense;
    /**
     * Check if text is educational/informative
     */
    private isEducational;
    /**
     * Check if keyword appears in hypothetical context
     * Example: "What if someone got hurt?"
     */
    private isHypothetical;
    /**
     * Count related keywords in text (excluding the current keyword)
     * Used to boost confidence when multiple trigger words appear together
     */
    private countRelatedKeywords;
    /**
     * Check if keyword matches word boundaries
     * Example: "sex" should NOT match "Sussex", "Essex", "sextant"
     */
    private isWordBoundary;
    /**
     * Get words before keyword position
     */
    private getWordsBefore;
    /**
     * Get context window around keyword
     */
    private getContextWindow;
    /**
     * Escape regex special characters
     */
    private escapeRegex;
    /**
     * Get analysis summary for logging
     */
    getAnalysisSummary(analysis: ContextAnalysis): string;
}
export {};
//# sourceMappingURL=ContextAnalyzer.d.ts.map