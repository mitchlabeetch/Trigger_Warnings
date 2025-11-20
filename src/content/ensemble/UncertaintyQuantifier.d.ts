/**
 * ALGORITHM 3.0 - PHASE 9: INNOVATION #33
 * Uncertainty Quantification
 *
 * Estimates confidence intervals and uncertainty bounds for predictions using
 * Bayesian deep learning and Monte Carlo dropout. Distinguishes between
 * aleatoric (data) and epistemic (model) uncertainty.
 *
 * Research: Gal & Ghahramani (2016) - Dropout as a Bayesian Approximation
 *           Better calibrated probabilities, reduced overconfidence
 *
 * Equal Treatment: All 28 categories benefit from same uncertainty quantification
 */
import type { TriggerCategory } from '../types/triggers';
/**
 * Prediction with uncertainty
 */
export interface UncertaintyPrediction {
    category: TriggerCategory;
    confidence: number;
    uncertainty: number;
    aleatoricUncertainty: number;
    epistemicUncertainty: number;
    confidenceInterval: {
        lower: number;
        upper: number;
        width: number;
    };
    isCalibrated: boolean;
    calibrationScore: number;
}
/**
 * Uncertainty statistics
 */
interface UncertaintyStats {
    totalPredictions: number;
    avgUncertainty: number;
    avgAleatoricUncertainty: number;
    avgEpistemicUncertainty: number;
    avgConfidenceInterval: number;
    calibrationAccuracy: number;
    overconfidentPredictions: number;
    underconfidentPredictions: number;
}
/**
 * Uncertainty Quantifier
 *
 * Estimates and calibrates prediction uncertainty
 */
export declare class UncertaintyQuantifier {
    private readonly MC_SAMPLES;
    private readonly DROPOUT_RATE;
    private readonly CONFIDENCE_LEVEL;
    private readonly CALIBRATION_BINS;
    private calibrationCounts;
    private calibrationCorrect;
    private stats;
    constructor();
    /**
     * Quantify uncertainty using Monte Carlo dropout
     */
    quantify(features: number[], category: TriggerCategory, baseConfidence: number): UncertaintyPrediction;
    /**
     * Monte Carlo dropout sampling
     */
    private monteCarloDropout;
    /**
     * Generate dropout mask (1 = keep, 0 = drop)
     */
    private generateDropoutMask;
    /**
     * Apply dropout to features
     */
    private applyDropout;
    /**
     * Predict with dropout (perturbed prediction)
     */
    private predictWithDropout;
    /**
     * Estimate aleatoric uncertainty (data noise - irreducible)
     */
    private estimateAleatoricUncertainty;
    /**
     * Estimate epistemic uncertainty (model uncertainty - reducible)
     */
    private estimateEpistemicUncertainty;
    /**
     * Compute confidence interval
     */
    private computeConfidenceInterval;
    /**
     * Get z-score for confidence level
     */
    private getZScore;
    /**
     * Compute calibration score
     */
    private computeCalibrationScore;
    /**
     * Update calibration with ground truth
     */
    updateCalibration(prediction: UncertaintyPrediction, actualLabel: boolean): void;
    /**
     * Get calibration curve
     */
    getCalibrationCurve(): Array<{
        binCenter: number;
        accuracy: number;
        count: number;
    }>;
    /**
     * Compute mean
     */
    private computeMean;
    /**
     * Compute variance
     */
    private computeVariance;
    /**
     * Gaussian noise
     */
    private gaussianNoise;
    /**
     * Update statistics
     */
    private updateStats;
    /**
     * Get statistics
     */
    getStats(): UncertaintyStats;
    /**
     * Clear state
     */
    clear(): void;
}
export declare const uncertaintyQuantifier: UncertaintyQuantifier;
export {};
//# sourceMappingURL=UncertaintyQuantifier.d.ts.map