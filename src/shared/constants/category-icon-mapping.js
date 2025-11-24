/**
 * Category icon mapping configuration
 * Maps category keys to their respective icon files
 */
/**
 * Current icon mode - can be configured based on build environment
 */
export const ICON_MODE = 'png'; // Change to 'emoji' for fallback
/**
 * Category icon file names (without .png extension)
 * Maps category key to icon filename
 */
export const CATEGORY_ICON_FILES = {
    violence: 'violence',
    blood: 'blood',
    gore: 'gore',
    sexual_assault: 'sexual_assault',
    sex: 'sex_nudity',
    self_harm: 'self_harm',
    suicide: 'suicide',
    eating_disorders: 'eating_disorders',
    drugs: 'drugs_substance_use',
    swear_words: 'profanity',
    medical_procedures: 'medical_procedures',
    animal_cruelty: 'animal_cruelty',
    child_abuse: 'child_abuse',
    domestic_violence: 'domestic_violence',
    racial_violence: 'racial_violence',
    lgbtq_phobia: 'lgbtq_phobia',
    dead_body_body_horror: 'dead_body_body_horror',
    flashing_lights: 'flashing_lights',
    torture: 'torture',
    murder: 'murder',
    spiders_snakes: 'spiders_snakes',
    vomit: 'vomit',
    jumpscares: 'jump_scares',
    cannibalism: 'cannibalism',
    children_screaming: 'children_screaming',
    religious_trauma: 'religious_trauma',
    detonations_bombs: 'explosions_bombs',
    natural_disasters: 'natural_disasters',
    gunshots: 'gunshots',
    explosions: 'explosions',
    screams: 'screams',
    slurs: 'slurs',
    hate_speech: 'hate_speech',
    threats: 'threats',
    photosensitivity: 'photosensitivity',
    loud_noises: 'loud_noises',
    insects_spiders: 'insects_spiders',
    snakes_reptiles: 'snakes_reptiles',
    needles_injections: 'needles_injections',
    pregnancy_childbirth: 'pregnancy_childbirth',
    death_dying: 'death_dying',
    claustrophobia_triggers: 'claustrophobia_triggers',
    physical_violence: 'physical_violence',
    car_crashes: 'car_crashes'
};
/**
 * Get icon path for a category
 * @param category - The trigger category
 * @param mode - Icon mode (emoji or png)
 * @returns Icon path or emoji character
 */
export function getCategoryIcon(category, mode = ICON_MODE) {
    if (mode === 'png') {
        const filename = CATEGORY_ICON_FILES[category];
        return `/src/assets/category-icons/${filename}.png`;
    }
    // Fallback to emoji (defined in categories.ts)
    return ''; // Will use emoji from TRIGGER_CATEGORIES
}
/**
 * Preload all category icon images
 * Call this during app initialization to improve performance
 */
export function preloadCategoryIcons() {
    if (ICON_MODE !== 'png')
        return;
    Object.values(CATEGORY_ICON_FILES).forEach((filename) => {
        const img = new Image();
        img.src = `/src/assets/category-icons/${filename}.png`;
    });
}
/**
 * Get icon as IMG element (for React/Svelte components)
 * @param category - The trigger category
 * @param alt - Alt text for accessibility
 * @param className - Optional CSS class
 */
export function getCategoryIconElement(category, alt, className) {
    if (ICON_MODE === 'emoji') {
        return ''; // Use emoji directly in component
    }
    const filename = CATEGORY_ICON_FILES[category];
    const src = `/src/assets/category-icons/${filename}.png`;
    const altText = alt || `${category} icon`;
    const classAttr = className ? ` class="${className}"` : '';
    return `<img src="${src}" alt="${altText}"${classAttr} />`;
}
//# sourceMappingURL=category-icon-mapping.js.map