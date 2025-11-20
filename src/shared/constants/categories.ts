/**
 * Trigger warning categories and their display names
 */

import type { TriggerCategory } from '../types/Warning.types';

export interface CategoryInfo {
  key: TriggerCategory;
  name: string;
  description: string;
  icon: string; // emoji or icon name
  severity: 'low' | 'medium' | 'high';
}

export const TRIGGER_CATEGORIES: Record<TriggerCategory, CategoryInfo> = {
  violence: {
    key: 'violence',
    name: 'Violence',
    description: 'Physical violence or fighting',
    icon: '⚔️',
    severity: 'high',
  },
  blood: {
    key: 'blood',
    name: 'Blood',
    description: 'Visible blood or bleeding',
    icon: '🩸',
    severity: 'medium',
  },
  gore: {
    key: 'gore',
    name: 'Gore',
    description: 'Graphic violence or gore',
    icon: '💀',
    severity: 'high',
  },
  sexual_assault: {
    key: 'sexual_assault',
    name: 'Sexual Assault',
    description: 'Sexual violence or assault',
    icon: '⚠️',
    severity: 'high',
  },
  sex: {
    key: 'sex',
    name: 'Sex / Nudity',
    description: 'Sexual content or nudity',
    icon: '🔞',
    severity: 'medium',
  },
  self_harm: {
    key: 'self_harm',
    name: 'Self-Harm',
    description: 'Self-injury or self-harm',
    icon: '🩹',
    severity: 'high',
  },
  suicide: {
    key: 'suicide',
    name: 'Suicide',
    description: 'Suicide or suicidal ideation',
    icon: '⚠️',
    severity: 'high',
  },
  eating_disorders: {
    key: 'eating_disorders',
    name: 'Eating Disorders',
    description: 'Disordered eating or body image issues',
    icon: '🍽️',
    severity: 'medium',
  },
  drugs: {
    key: 'drugs',
    name: 'Drugs / Substance Use',
    description: 'Drug use or substance abuse',
    icon: '💊',
    severity: 'medium',
  },
  swear_words: {
    key: 'swear_words',
    name: 'Profanity',
    description: 'Strong language or profanity',
    icon: '🤬',
    severity: 'low',
  },
  spiders_snakes: {
    key: 'spiders_snakes',
    name: 'Spiders / Snakes',
    description: 'Spiders, snakes, or similar creatures',
    icon: '🕷️',
    severity: 'low',
  },
  animal_cruelty: {
    key: 'animal_cruelty',
    name: 'Animal Cruelty',
    description: 'Harm or cruelty to animals',
    icon: '🐾',
    severity: 'high',
  },
  child_abuse: {
    key: 'child_abuse',
    name: 'Child Abuse',
    description: 'Abuse or harm to children',
    icon: '⚠️',
    severity: 'high',
  },
  children_screaming: {
    key: 'children_screaming',
    name: 'Children Screaming',
    description: 'Children crying or screaming',
    icon: '👶',
    severity: 'medium',
  },
  domestic_violence: {
    key: 'domestic_violence',
    name: 'Domestic Violence',
    description: 'Domestic or intimate partner violence',
    icon: '🏠',
    severity: 'high',
  },
  racial_violence: {
    key: 'racial_violence',
    name: 'Racial Violence',
    description: 'Racially motivated violence or hate crimes',
    icon: '✊',
    severity: 'high',
  },
  lgbtq_phobia: {
    key: 'lgbtq_phobia',
    name: 'LGBTQ+ Phobia',
    description: 'Homophobia, transphobia, or LGBTQ+ discrimination',
    icon: '🏳️‍🌈',
    severity: 'high',
  },
  religious_trauma: {
    key: 'religious_trauma',
    name: 'Religious Trauma',
    description: 'Religious abuse or trauma',
    icon: '⛪',
    severity: 'medium',
  },
  dead_body_body_horror: {
    key: 'dead_body_body_horror',
    name: 'Dead Bodies / Body Horror',
    description: 'Corpses or disturbing body horror',
    icon: '💀',
    severity: 'high',
  },
  torture: {
    key: 'torture',
    name: 'Torture',
    description: 'Torture or extreme pain',
    icon: '⛓️',
    severity: 'high',
  },
  murder: {
    key: 'murder',
    name: 'Murder',
    description: 'Killing or murder',
    icon: '🔪',
    severity: 'high',
  },
  detonations_bombs: {
    key: 'detonations_bombs',
    name: 'Explosions / Bombs',
    description: 'Explosions or detonations',
    icon: '💣',
    severity: 'medium',
  },
  medical_procedures: {
    key: 'medical_procedures',
    name: 'Medical Procedures',
    description: 'Medical procedures or surgery',
    icon: '💉',
    severity: 'medium',
  },
  vomit: {
    key: 'vomit',
    name: 'Vomit / Nausea',
    description: 'Vomiting or nausea-inducing content',
    icon: '🤢',
    severity: 'low',
  },
  flashing_lights: {
    key: 'flashing_lights',
    name: 'Flashing Lights',
    description: 'Rapid flashing or strobe effects (seizure risk)',
    icon: '💡',
    severity: 'high',
  },
  jumpscares: {
    key: 'jumpscares',
    name: 'Jump Scares',
    description: 'Sudden frightening moments',
    icon: '👻',
    severity: 'low',
  },
  natural_disasters: {
    key: 'natural_disasters',
    name: 'Natural Disasters',
    description: 'Earthquakes, floods, fires, etc.',
    icon: '🌊',
    severity: 'medium',
  },
  cannibalism: {
    key: 'cannibalism',
    name: 'Cannibalism',
    description: 'Cannibalism or eating human flesh',
    icon: '🦴',
    severity: 'high',
  },
  gunshots: {
    key: 'gunshots',
    name: 'Gunshots',
    description: 'Gunfire or shooting sounds',
    icon: '🔫',
    severity: 'high',
  },
  explosions: {
    key: 'explosions',
    name: 'Explosions',
    description: 'Loud explosions',
    icon: '💥',
    severity: 'high',
  },
  screams: {
    key: 'screams',
    name: 'Screaming',
    description: 'Loud screaming or yelling',
    icon: '🗣️',
    severity: 'medium',
  },
  slurs: {
    key: 'slurs',
    name: 'Slurs',
    description: 'Hateful or derogatory language',
    icon: '🤬',
    severity: 'high',
  },
  hate_speech: {
    key: 'hate_speech',
    name: 'Hate Speech',
    description: 'Discriminatory or hateful speech',
    icon: '🚫',
    severity: 'high',
  },
  threats: {
    key: 'threats',
    name: 'Threats',
    description: 'Threatening language or behavior',
    icon: '🔪',
    severity: 'high',
  },
  photosensitivity: {
    key: 'photosensitivity',
    name: 'Photosensitivity',
    description: 'Visual patterns that may trigger seizures',
    icon: '⚡',
    severity: 'high',
  },
  loud_noises: {
    key: 'loud_noises',
    name: 'Loud Noises',
    description: 'Sudden or sustained loud noises',
    icon: '🔊',
    severity: 'medium',
  },
  insects_spiders: {
    key: 'insects_spiders',
    name: 'Insects',
    description: 'Insects, bugs, or swarms',
    icon: '🪳',
    severity: 'low',
  },
  snakes_reptiles: {
    key: 'snakes_reptiles',
    name: 'Snakes / Reptiles',
    description: 'Snakes or reptiles',
    icon: '🐍',
    severity: 'low',
  },
  needles_injections: {
    key: 'needles_injections',
    name: 'Needles / Injections',
    description: 'Needles, syringes, or injections',
    icon: '💉',
    severity: 'medium',
  },
  pregnancy_childbirth: {
    key: 'pregnancy_childbirth',
    name: 'Pregnancy / Childbirth',
    description: 'Pregnancy complications or childbirth',
    icon: '🤰',
    severity: 'medium',
  },
  death_dying: {
    key: 'death_dying',
    name: 'Death / Dying',
    description: 'Depictions of death or dying',
    icon: '⚰️',
    severity: 'high',
  },
  claustrophobia_triggers: {
    key: 'claustrophobia_triggers',
    name: 'Claustrophobia',
    description: 'Confined spaces or entrapment',
    icon: '📦',
    severity: 'medium',
  },
  physical_violence: {
    key: 'physical_violence',
    name: 'Physical Violence',
    description: 'Physical altercations or beatings',
    icon: '👊',
    severity: 'high',
  },
  car_crashes: {
    key: 'car_crashes',
    name: 'Car Crashes',
    description: 'Vehicle accidents or collisions',
    icon: '🚗',
    severity: 'medium',
  }
};

export const CATEGORY_KEYS = Object.keys(TRIGGER_CATEGORIES) as TriggerCategory[];

export const HIGH_SEVERITY_CATEGORIES = CATEGORY_KEYS.filter(
  (key) => TRIGGER_CATEGORIES[key].severity === 'high'
);

export const MEDIUM_SEVERITY_CATEGORIES = CATEGORY_KEYS.filter(
  (key) => TRIGGER_CATEGORIES[key].severity === 'medium'
);

export const LOW_SEVERITY_CATEGORIES = CATEGORY_KEYS.filter(
  (key) => TRIGGER_CATEGORIES[key].severity === 'low'
);
