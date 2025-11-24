/**
 * DETECTION ROUTER - Algorithm 3.0 Innovation #13
 *
 * Routes each of the 28 trigger categories to specialized detection pipelines
 * ensuring EQUAL TREATMENT through category-optimized detection strategies
 *
 * **THE EQUAL TREATMENT PROMISE:**
 * - Blood gets visual-primary route → 70% visual, 15% audio, 15% text
 * - Vomit gets visual-primary route → 50% visual, 40% audio, 10% text
 * - Eating disorders get text-primary route → 60% text, 30% visual, 10% audio
 * - ALL 28 categories receive world-class detection optimized for their characteristics
 *
 * Features:
 * - 5 specialized detection pipelines
 * - Category-specific modality weights
 * - Validation level per category
 * - Temporal pattern awareness
 * - Equal sophistication for ALL triggers
 *
 * Created by: Claude Code (Algorithm 3.0 Revolutionary Session)
 * Date: 2025-11-11
 */
import type { TriggerCategory } from '@shared/types/Warning.types';
/**
 * Detection route types - 5 specialized pipelines
 */
export type DetectionRoute = 'visual-primary' | 'audio-primary' | 'text-primary' | 'temporal-pattern' | 'multi-modal-balanced';
/**
 * Validation levels determine multi-modal requirements
 */
export type ValidationLevel = 'high-sensitivity' | 'standard' | 'single-modality-sufficient';
/**
 * Temporal patterns describe how triggers manifest over time
 */
export type TemporalPattern = 'instant' | 'gradual-onset' | 'escalation' | 'sustained';
/**
 * Complete route configuration for a category
 */
export interface RouteConfig {
    route: DetectionRoute;
    modalityWeights: {
        visual: number;
        audio: number;
        text: number;
    };
    validationLevel: ValidationLevel;
    temporalPattern: TemporalPattern;
}
/**
 * Input data from all modalities
 */
export interface MultiModalInput {
    timestamp: number;
    visual?: {
        confidence: number;
        features: any;
    };
    audio?: {
        confidence: number;
        features: any;
    };
    text?: {
        confidence: number;
        features: any;
        subtitleText?: string;
    };
}
/**
 * Detection result from routing
 */
export interface Detection {
    category: TriggerCategory;
    timestamp: number;
    confidence: number;
    route: DetectionRoute;
    modalityContributions: {
        visual: number;
        audio: number;
        text: number;
    };
    validationPassed: boolean;
    temporalContext: {
        pattern: TemporalPattern;
        duration: number;
    };
    pipeline?: string;
    reasoning?: string[];
}
/**
 * ALL 28 CATEGORIES MAPPED TO OPTIMAL DETECTION ROUTES
 *
 * This is the EQUAL TREATMENT foundation - every category gets the detection
 * strategy that works BEST for its characteristics
 */
export declare const CATEGORY_ROUTE_CONFIG: Record<TriggerCategory, RouteConfig>;
/**
 * DETECTION ROUTER
 *
 * Routes each category to its optimal detection pipeline,
 * ensuring equal treatment through specialized processing
 */
export declare class DetectionRouter {
    private stats;
    /**
     * Route detection for a specific category
     */
    route(category: TriggerCategory, input: MultiModalInput): Detection;
    /**
     * Calculate weighted confidence based on modality weights
     */
    private calculateWeightedConfidence;
    /**
     * Validate detection based on validation level
     */
    private validateDetection;
    /**
     * Fallback balanced routing
     */
    private balancedRoute;
    /**
     * Get routing statistics
     */
    getStats(): {
        totalRoutings: number;
        byRoute: {
            'visual-primary': number;
            'audio-primary': number;
            'text-primary': number;
            'temporal-pattern': number;
            'multi-modal-balanced': number;
        };
    };
    /**
     * Get route configuration for a category
     */
    getRouteConfig(category: TriggerCategory): RouteConfig | undefined;
    /**
     * Verify all 28 categories are mapped
     */
    static verifyCompleteness(): {
        complete: boolean;
        missing: string[];
    };
}
/**
 * Export singleton instance
 */
export declare const detectionRouter: DetectionRouter;
/**
 * EQUAL TREATMENT VALIDATION
 *
 * This router ensures:
 * ✅ All 28 categories have route configurations
 * ✅ Each category uses optimal detection strategy
 * ✅ Vomit gets same pipeline sophistication as blood
 * ✅ Eating disorders get specialized text-primary route
 * ✅ Animal cruelty gets temporal-pattern escalation tracking
 * ✅ High-sensitivity triggers (sexual assault, self-harm) get stricter validation
 * ✅ Every trigger receives world-class detection tailored to its characteristics
 *
 * PERFORMANCE GOALS:
 * - Routing overhead: <1ms per detection
 * - Equal accuracy across all categories (94-98% target)
 * - Standard deviation <3% (equal treatment achieved)
 */
//# sourceMappingURL=DetectionRouter.d.ts.map