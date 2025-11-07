/**
 * Trigger warning categories and their display names
 */
import type { TriggerCategory } from '../types/Warning.types';
export interface CategoryInfo {
    key: TriggerCategory;
    name: string;
    description: string;
    icon: string;
    severity: 'low' | 'medium' | 'high';
}
export declare const TRIGGER_CATEGORIES: Record<TriggerCategory, CategoryInfo>;
export declare const CATEGORY_KEYS: TriggerCategory[];
export declare const HIGH_SEVERITY_CATEGORIES: TriggerCategory[];
export declare const MEDIUM_SEVERITY_CATEGORIES: TriggerCategory[];
export declare const LOW_SEVERITY_CATEGORIES: TriggerCategory[];
//# sourceMappingURL=categories.d.ts.map