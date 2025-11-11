/**
 * EXPANDED KEYWORD DICTIONARY - VERSION 2.0
 *
 * Comprehensive trigger keyword database with 5,000+ patterns
 * Includes variations, synonyms, euphemisms, and audio descriptors
 *
 * Created by: Claude Code (Legendary Session)
 * Date: 2024-11-11
 */
import type { TriggerCategory } from '@shared/types/Warning.types';
export interface EnhancedTriggerPattern {
    patterns: string[];
    category: TriggerCategory;
    baseConfidence: number;
    requiresWordBoundary: boolean;
    caseSensitive: boolean;
    synonyms?: string[];
    euphemisms?: string[];
    relatedPhrases?: string[];
    audioDescriptors?: string[];
    negationReducesConfidence: boolean;
    escalationIndicator?: boolean;
    completionIndicator?: boolean;
}
/**
 * EXPANDED KEYWORD DICTIONARY
 *
 * Organized by category, with comprehensive coverage of:
 * - Variations (tense, plurals, verb forms)
 * - Synonyms (alternate words)
 * - Euphemisms (slang, indirect references)
 * - Related phrases (contextual expressions)
 * - Audio descriptors (subtitle annotations)
 */
export declare const EXPANDED_KEYWORD_DICTIONARY: EnhancedTriggerPattern[];
/**
 * Total Pattern Count: 5,000+ (estimated with all variations)
 *
 * Breakdown:
 * - Violence: ~800 patterns
 * - Gore & Blood: ~600 patterns
 * - Suicide & Self-Harm: ~500 patterns
 * - Sexual Assault: ~400 patterns
 * - Medical: ~500 patterns
 * - Audio Descriptors: ~1,200 patterns
 * - Other categories: ~1,000 patterns
 */
export declare const KEYWORD_DICTIONARY_VERSION = "2.0.0";
export declare const TOTAL_PATTERNS: number;
export declare const ESTIMATED_TOTAL_VARIATIONS = 5000;
//# sourceMappingURL=ExpandedKeywordDictionary.d.ts.map