/**
 * Trigger warning types and interfaces
 */
export type TriggerCategory = 'detonations_bombs' | 'vomit' | 'sexual_assault' | 'sex' | 'self_harm' | 'suicide' | 'spiders_snakes' | 'blood' | 'swear_words' | 'drugs' | 'violence' | 'eating_disorders' | 'dead_body_body_horror' | 'gore' | 'torture' | 'children_screaming' | 'racial_violence' | 'domestic_violence' | 'animal_cruelty' | 'child_abuse' | 'flashing_lights' | 'medical_procedures' | 'natural_disasters' | 'religious_trauma' | 'jumpscares' | 'murder' | 'lgbtq_phobia' | 'cannibalism' | 'gunshots' | 'explosions' | 'screams' | 'slurs' | 'hate_speech' | 'threats' | 'photosensitivity' | 'loud_noises' | 'insects_spiders' | 'needles_injections' | 'pregnancy_childbirth' | 'death_dying' | 'claustrophobia_triggers' | 'physical_violence' | 'car_crashes' | 'snakes_reptiles';
export type WarningAction = 'warn' | 'mute' | 'hide' | 'mute-and-hide';
export type WarningStatus = 'pending' | 'approved' | 'rejected';
export interface Warning {
    id: string;
    videoId: string;
    videoTitle?: string;
    categoryKey: TriggerCategory;
    startTime: number;
    endTime: number;
    submittedBy?: string;
    status: WarningStatus;
    score: number;
    confidenceLevel: number;
    requiresModeration: boolean;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    moderatedAt?: Date;
    moderatedBy?: string;
}
export type StreamingPlatform = 'netflix' | 'prime_video' | 'youtube' | 'hulu' | 'disney_plus' | 'max' | 'peacock';
export interface WarningSubmission {
    videoId: string;
    platform: StreamingPlatform;
    categoryKey: TriggerCategory;
    startTime: number;
    endTime: number;
    description?: string;
    confidence?: number;
}
export interface WarningVote {
    id: string;
    triggerId: string;
    userId: string;
    voteType: 'up' | 'down';
    createdAt: Date;
}
export interface ActiveWarning extends Warning {
    timeUntilStart: number;
    isActive: boolean;
    action: WarningAction;
}
//# sourceMappingURL=triggers.d.ts.map