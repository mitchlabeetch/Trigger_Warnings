/**
 * User Sensitivity Profile Types
 */

import type { TriggerCategory } from './Warning.types';

/**
 * Sensitivity levels with associated confidence thresholds
 */
export type SensitivityLevel = 'very-high' | 'high' | 'medium' | 'low' | 'off';

/**
 * Content context types for context-aware sensitivity
 */
export type ContentContext = 'educational' | 'fictional' | 'news-documentary' | 'unknown';

/**
 * Threshold mappings for each sensitivity level
 *
 * Lower threshold = more sensitive (warns at lower confidence)
 * Higher threshold = less sensitive (requires higher confidence to warn)
 */
export const SENSITIVITY_THRESHOLDS: Record<SensitivityLevel, number> = {
  'very-high': 40,  // Extremely sensitive - warn for any indication
  'high': 60,       // Standard protection (default for most users)
  'medium': 75,     // Only warn for clear/sustained content
  'low': 85,        // Only warn for extreme/graphic content
  'off': 100        // Will never trigger (impossible threshold)
};

/**
 * Advanced user settings
 */
export interface AdvancedSettings {
  // Time-based sensitivity
  nighttimeMode: boolean;              // Auto-enable 10pm-7am
  nighttimeBoost: number;              // Percentage boost (e.g., 0.10 = +10%)
  nighttimeStartHour: number;          // Default: 22 (10pm)
  nighttimeEndHour: number;            // Default: 7 (7am)

  // Stress-based sensitivity
  stressMode: boolean;                 // Manually triggered by user
  stressModeBoost: number;             // Percentage boost (e.g., 0.20 = +20%)

  // Adaptive learning
  adaptiveLearning: boolean;           // Learn from user feedback
  learningRate: number;                // How quickly to adapt (0.1 = 10% per feedback)

  // Progressive desensitization
  desensitizationEnabled: boolean;     // Therapeutic gradual reduction
  desensitizationRate: number;         // Percentage per week (e.g., 0.05 = 5% per week)
}

/**
 * Context-specific sensitivity settings
 *
 * Allows different sensitivity levels based on content type
 */
export interface ContextualSettings {
  educational: SensitivityLevel;       // Educational/medical content
  fictional: SensitivityLevel;         // Movies, TV shows, fiction
  newsDocumentary: SensitivityLevel;   // Real-world news, documentaries
  unknown: SensitivityLevel;           // Default when context unclear
}

/**
 * User sensitivity profile
 *
 * Stores all personalization settings for a user
 */
export interface UserSensitivityProfile {
  userId: string;

  // Per-category base sensitivity (ALL 28 categories)
  categorySettings: Record<TriggerCategory, SensitivityLevel>;

  // Context-aware settings (optional, per-category)
  contextualSettings?: Partial<Record<TriggerCategory, ContextualSettings>>;

  // Advanced settings
  advancedSettings: AdvancedSettings;

  // Metadata
  lastUpdated: number;
  version: number;  // Schema version for migrations
}

/**
 * Default sensitivity profile for new users
 */
export const DEFAULT_SENSITIVITY_PROFILE: Omit<UserSensitivityProfile, 'userId'> = {
  // All categories default to "high" sensitivity
  categorySettings: {
    // Visual triggers
    'blood': 'high',
    'gore': 'high',
    'vomit': 'high',
    'dead_body_body_horror': 'high',
    'medical_procedures': 'high',
    'flashing_lights': 'high',
    'insects_spiders': 'high',
    'needles_injections': 'high',
    'claustrophobia_triggers': 'high',
    'snakes_reptiles': 'high',
    'photosensitivity': 'high',

    // Audio triggers
    'gunshots': 'high',
    'detonations_bombs': 'high',
    'jumpscares': 'high',
    'children_screaming': 'high',
    'explosions': 'high',
    'screams': 'high',
    'loud_noises': 'high',

    // Text triggers
    'lgbtq_phobia': 'high',
    'racial_violence': 'high',
    'eating_disorders': 'high',
    'religious_trauma': 'high',
    'slurs': 'high',
    'hate_speech': 'high',
    'threats': 'high',
    'swear_words': 'high',

    // Temporal triggers
    'animal_cruelty': 'high',
    'violence': 'high',
    'torture': 'high',
    'murder': 'high',
    'physical_violence': 'high',
    'car_crashes': 'high',

    // Multi-modal balanced triggers
    'self_harm': 'high',
    'suicide': 'high',
    'sexual_assault': 'high',
    'domestic_violence': 'high',
    'child_abuse': 'high',
    'sex': 'medium',
    'drugs': 'medium',
    'pregnancy_childbirth': 'medium',
    'natural_disasters': 'medium',
    'cannibalism': 'high',
    'photosensitivity': 'high',
    'death_dying': 'high'
  },

  advancedSettings: {
    nighttimeMode: false,
    nighttimeBoost: 0.10,  // +10% sensitivity at night
    nighttimeStartHour: 22,
    nighttimeEndHour: 7,

    stressMode: false,
    stressModeBoost: 0.20,  // +20% sensitivity when stressed

    adaptiveLearning: true,  // Enabled by default
    learningRate: 0.10,

    desensitizationEnabled: false,
    desensitizationRate: 0.05  // 5% per week
  },

  lastUpdated: Date.now(),
  version: 1
};
