export interface FrequencyBands {
  subBass: number;      // 20-60 Hz
  bass: number;         // 60-250 Hz (explosions)
  lowMid: number;       // 250-500 Hz
  mid: number;          // 500-2000 Hz (speech, crying)
  highMid: number;      // 2-4 kHz (screaming)
  presence: number;     // 4-6 kHz (screaming, gunshots)
  brilliance: number;   // 6-20 kHz
}

export interface FrequencyEvent {
  type: 'scream' | 'gunshot' | 'explosion' | 'siren' | 'medical_beep' | 'crying' | 'power_tool';
  timestamp: number;
  confidence: number;
  frequencyProfile: FrequencyBands;
}

export interface ColorAnalysis {
  brightRed: number;          // 0-1 (percentage of frame)
  orangeYellow: number;       // Fire detection
  yellowBrown: number;        // Vomit detection
  greenishYellow: number;     // Vomit detection (bile colors)
  sterileWhite: number;       // Medical scenes
  medicalBlueGreen: number;   // Medical equipment/scrubs
  blueGreen: number;          // Underwater
  darkPixels: number;         // Shadow/night
  brightness: number;         // Average luminance
  saturation: number;         // Color intensity
  irregularity: number;       // Edge complexity (gore indicator)
  chunkiness: number;         // Texture irregularity (vomit, gore)
}

export interface VisualEvent {
  type: 'blood' | 'gore' | 'fire' | 'medical' | 'underwater' | 'scene_change' | 'vomit';
  timestamp: number;
  confidence: number;
  colorAnalysis: ColorAnalysis;
}

// Worker Payload Types
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
  createdAt: string; // ISO string over wire
  updatedAt: string; // ISO string over wire
}
