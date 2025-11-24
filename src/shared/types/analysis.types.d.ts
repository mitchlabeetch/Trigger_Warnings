export interface FrequencyBands {
    subBass: number;
    bass: number;
    lowMid: number;
    mid: number;
    highMid: number;
    presence: number;
    brilliance: number;
}
export interface FrequencyEvent {
    type: 'scream' | 'gunshot' | 'explosion' | 'siren' | 'medical_beep' | 'crying' | 'power_tool';
    timestamp: number;
    confidence: number;
    frequencyProfile: FrequencyBands;
}
export interface ColorAnalysis {
    brightRed: number;
    orangeYellow: number;
    yellowBrown: number;
    greenishYellow: number;
    sterileWhite: number;
    medicalBlueGreen: number;
    blueGreen: number;
    darkPixels: number;
    brightness: number;
    saturation: number;
    irregularity: number;
    chunkiness: number;
}
export interface VisualEvent {
    type: 'blood' | 'gore' | 'fire' | 'medical' | 'underwater' | 'scene_change' | 'vomit';
    timestamp: number;
    confidence: number;
    colorAnalysis: ColorAnalysis;
}
export interface AnalyzeFramePayload {
    timestamp: number;
    bitmap: ImageBitmap;
}
export interface AnalyzeAudioPayload {
    frequencyData: ArrayBuffer;
    timestamp: number;
    sampleRate: number;
    binCount: number;
}
export interface DetectionPayload {
    id: string;
    videoId: string;
    categoryKey: string;
    startTime: number;
    endTime: number;
    submittedBy: string;
    status: string;
    score: number;
    confidenceLevel: number;
    requiresModeration: boolean;
    description: string;
    createdAt: string;
    updatedAt: string;
}
//# sourceMappingURL=analysis.types.d.ts.map