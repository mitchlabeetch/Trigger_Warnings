import type { FrequencyBands, FrequencyEvent, AnalyzeAudioPayload, DetectionPayload } from '@shared/types/analysis.types';

// Worker State
let frequencyHistory: FrequencyBands[] = [];
const HISTORY_SIZE = 10; // Keep last 1 second (100ms intervals)
const detectedEvents: Map<string, FrequencyEvent> = new Map();

const stats = {
  screamDetections: 0,
  gunshotDetections: 0,
  explosionDetections: 0,
  sirenDetections: 0,
  medicalBeepDetections: 0,
  cryingDetections: 0,
  powerToolDetections: 0
};

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'analyze_audio') {
    const p = payload as AnalyzeAudioPayload;
    // Ensure frequencyData is treated as Uint8Array
    const frequencyData = new Uint8Array(p.frequencyData as ArrayBuffer);
    analyzeAudio(frequencyData, p.timestamp, p.sampleRate, p.binCount);
  } else if (type === 'reset') {
    resetState();
  }
};

function resetState() {
  frequencyHistory = [];
  detectedEvents.clear();
}

function analyzeAudio(frequencyData: Uint8Array, timestamp: number, sampleRate: number, binCount: number) {
  const bands = calculateFrequencyBands(frequencyData, sampleRate, binCount);

  frequencyHistory.push(bands);
  if (frequencyHistory.length > HISTORY_SIZE) {
    frequencyHistory.shift();
  }

  detectScream(timestamp, bands);
  detectGunshot(timestamp, bands);
  detectExplosion(timestamp, bands);
  detectSiren(timestamp, bands);
  detectMedicalBeep(timestamp, bands);
  detectCrying(timestamp, bands);
  detectPowerTool(timestamp, bands);
}

function calculateFrequencyBands(frequencyData: Uint8Array, sampleRate: number, binCount: number): FrequencyBands {
  return {
    subBass: getAverageFrequency(frequencyData, 20, 60, sampleRate, binCount),
    bass: getAverageFrequency(frequencyData, 60, 250, sampleRate, binCount),
    lowMid: getAverageFrequency(frequencyData, 250, 500, sampleRate, binCount),
    mid: getAverageFrequency(frequencyData, 500, 2000, sampleRate, binCount),
    highMid: getAverageFrequency(frequencyData, 2000, 4000, sampleRate, binCount),
    presence: getAverageFrequency(frequencyData, 4000, 6000, sampleRate, binCount),
    brilliance: getAverageFrequency(frequencyData, 6000, 20000, sampleRate, binCount)
  };
}

function getAverageFrequency(frequencyData: Uint8Array, minHz: number, maxHz: number, sampleRate: number, binCount: number): number {
  const nyquist = sampleRate / 2;
  const minBin = Math.floor((minHz / nyquist) * binCount);
  const maxBin = Math.floor((maxHz / nyquist) * binCount);

  // Bounds check
  const start = Math.max(0, minBin);
  const end = Math.min(frequencyData.length - 1, maxBin);

  if (start > end) return 0;

  let sum = 0;
  for (let i = start; i <= end; i++) {
    sum += frequencyData[i];
  }

  return sum / (end - start + 1);
}

// --- Detection Logic ---

function detectScream(timestamp: number, bands: FrequencyBands) {
  if (bands.highMid > 200 && bands.presence > 200 && bands.bass < 150) {
    if (isSustained('highMid', 180, 5)) {
      const eventKey = `scream-${Math.floor(timestamp)}`;
      if (!detectedEvents.has(eventKey)) {
        stats.screamDetections++;
        const confidence = Math.min(Math.round(((bands.highMid + bands.presence) / 400) * 100), 95);
        createWarning(eventKey, timestamp, 'children_screaming', confidence,
          'Screaming detected via frequency analysis (3-5kHz sustained)', bands);
      }
    }
  }
}

function detectGunshot(timestamp: number, bands: FrequencyBands) {
  if (frequencyHistory.length >= 2) {
    const previous = frequencyHistory[frequencyHistory.length - 2];
    const midIncrease = bands.mid - previous.mid;
    const highMidIncrease = bands.highMid - previous.highMid;

    if (midIncrease > 100 && highMidIncrease > 100 && bands.mid > 180 && bands.highMid > 180) {
      const eventKey = `gunshot-freq-${Math.floor(timestamp)}`;
      if (!detectedEvents.has(eventKey)) {
        stats.gunshotDetections++;
        const confidence = Math.min(Math.round(((midIncrease + highMidIncrease) / 200) * 100), 90);
        createWarning(eventKey, timestamp, 'violence', confidence,
          'Gunshot detected via frequency analysis (1-5kHz transient)', bands);
      }
    }
  }
}

function detectExplosion(timestamp: number, bands: FrequencyBands) {
  if (bands.bass > 180 && bands.subBass > 150 && bands.mid > 120) {
    const eventKey = `explosion-freq-${Math.floor(timestamp)}`;
    if (!detectedEvents.has(eventKey)) {
      stats.explosionDetections++;
      const confidence = Math.min(Math.round(((bands.bass + bands.subBass) / 330) * 100), 88);
      createWarning(eventKey, timestamp, 'detonations_bombs', confidence,
        'Explosion detected via frequency analysis (20-200Hz surge)', bands);
    }
  }
}

function detectSiren(timestamp: number, bands: FrequencyBands) {
  if (detectOscillation('mid', 2)) {
    const eventKey = `siren-${Math.floor(timestamp / 3) * 3}`;
    if (!detectedEvents.has(eventKey)) {
      stats.sirenDetections++;
      createWarning(eventKey, timestamp, 'violence', 75,
        'Emergency siren detected via frequency analysis (oscillating 1-3kHz)', bands);
    }
  }
}

function detectMedicalBeep(timestamp: number, bands: FrequencyBands) {
  if (detectPeriodicBeep('mid', 140, 5)) {
    const eventKey = `medical-beep-${Math.floor(timestamp / 5) * 5}`;
    if (!detectedEvents.has(eventKey)) {
      stats.medicalBeepDetections++;
      createWarning(eventKey, timestamp, 'medical_procedures', 70,
        'Medical equipment detected via frequency analysis (periodic 1-2kHz)', bands);
    }
  }
}

function detectCrying(timestamp: number, bands: FrequencyBands) {
  if (bands.mid > 120 && bands.mid < 180 && isFluctuating('mid', 30, 5)) {
    const eventKey = `crying-${Math.floor(timestamp / 3) * 3}`;
    if (!detectedEvents.has(eventKey)) {
      stats.cryingDetections++;
      createWarning(eventKey, timestamp, 'children_screaming', 65,
        'Crying detected via frequency analysis (rhythmic 500-2kHz)', bands);
    }
  }
}

function detectPowerTool(timestamp: number, bands: FrequencyBands) {
  if (bands.lowMid > 150 && isSustained('lowMid', 140, 8)) {
    const eventKey = `power-tool-${Math.floor(timestamp / 5) * 5}`;
    if (!detectedEvents.has(eventKey)) {
      stats.powerToolDetections++;
      createWarning(eventKey, timestamp, 'violence', 60,
        'Power tool detected via frequency analysis (sustained 100-500Hz)', bands);
    }
  }
}

// --- Helper Functions ---

function isSustained(band: keyof FrequencyBands, threshold: number, checkCount: number): boolean {
  if (frequencyHistory.length < checkCount) return false;
  const recent = frequencyHistory.slice(-checkCount);
  return recent.every(h => h[band] > threshold);
}

function isFluctuating(band: keyof FrequencyBands, variance: number, checkCount: number): boolean {
  if (frequencyHistory.length < checkCount) return false;
  const recent = frequencyHistory.slice(-checkCount);
  const values = recent.map(h => h[band]);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
  return Math.sqrt(avgSquaredDiff) > variance;
}

function detectOscillation(band: keyof FrequencyBands, minCycles: number): boolean {
  if (frequencyHistory.length < 8) return false;
  const recent = frequencyHistory.slice(-8);
  const values = recent.map(h => h[band]);
  let directionChanges = 0;
  for (let i = 1; i < values.length - 1; i++) {
    const prev = values[i - 1];
    const curr = values[i];
    const next = values[i + 1];
    if ((curr > prev && curr > next) || (curr < prev && curr < next)) {
      directionChanges++;
    }
  }
  return directionChanges >= minCycles * 2;
}

function detectPeriodicBeep(band: keyof FrequencyBands, threshold: number, checkCount: number): boolean {
  if (frequencyHistory.length < checkCount) return false;
  const recent = frequencyHistory.slice(-checkCount);
  const values = recent.map(h => h[band]);
  const spikes = values.filter(v => v > threshold).length;
  const spikeRatio = spikes / values.length;
  return spikeRatio > 0.4 && spikeRatio < 0.6;
}

function createWarning(
  eventKey: string,
  timestamp: number,
  category: string,
  confidence: number,
  description: string,
  frequencyProfile: FrequencyBands
) {
  const event: FrequencyEvent = {
    type: category as any,
    timestamp,
    confidence,
    frequencyProfile
  };

  detectedEvents.set(eventKey, event);

  const payload: DetectionPayload = {
    id: eventKey,
    videoId: 'audio-frequency-detected',
    categoryKey: category,
    startTime: Math.max(0, timestamp - 2),
    endTime: timestamp + 3,
    submittedBy: 'audio-frequency-analyzer',
    status: 'approved',
    score: 0,
    confidenceLevel: confidence,
    requiresModeration: false,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  self.postMessage({
    type: 'detection',
    payload
  });
}
