import type { ColorAnalysis, VisualEvent, AnalyzeFramePayload, DetectionPayload } from '@shared/types/analysis.types';

// Worker state
let offscreenCanvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let previousFrameData: ImageData | null = null;
let sceneChangeCount: number = 0;
const detectedEvents: Map<string, VisualEvent> = new Map();

// Stats
const stats = {
  totalFramesAnalyzed: 0,
  bloodDetections: 0,
  goreDetections: 0,
  fireDetections: 0,
  vomitDetections: 0,
  medicalDetections: 0,
  underwaterDetections: 0,
  sceneChangeDetections: 0,
};

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'analyze_frame') {
    // The payload now includes the hash
    const p = payload as AnalyzeFramePayload & { hash: string };
    analyzeFrame(p.bitmap, p.timestamp, p.hash);
  } else if (type === 'reset') {
    resetState();
  }
};

function resetState() {
  previousFrameData = null;
  sceneChangeCount = 0;
  detectedEvents.clear();
}

function analyzeFrame(bitmap: ImageBitmap, timestamp: number, hash: string) {
  if (!offscreenCanvas) {
    offscreenCanvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D;
  }

  if (offscreenCanvas.width !== bitmap.width || offscreenCanvas.height !== bitmap.height) {
    offscreenCanvas.width = bitmap.width;
    offscreenCanvas.height = bitmap.height;
  }

  if (!ctx) return;

  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
  bitmap.close();

  stats.totalFramesAnalyzed++;

  const analysis = analyzeColors(imageData);

  self.postMessage({ type: 'analysis_result', payload: analysis });

  // Run detections, passing the hash through
  detectBlood(timestamp, analysis, hash);
  // ... other detections would also need to pass the hash

  if (previousFrameData) {
    detectSceneChange(timestamp, imageData, previousFrameData);
  }
  previousFrameData = imageData;
}

// Stubs for other functions to keep it clean
function analyzeColors(imageData: ImageData): ColorAnalysis {
    // Dummy implementation for brevity
    return {
        brightRed: Math.random() * 0.3,
        darkPixels: Math.random() * 0.5,
        irregularity: Math.random() * 0.4
    } as ColorAnalysis;
}
function detectSceneChange(timestamp: number, currentFrame: ImageData, previousFrame: ImageData) {}

function detectBlood(timestamp: number, analysis: ColorAnalysis, hash: string) {
  if (analysis.brightRed > 0.15) {
    const eventKey = `blood-${Math.floor(timestamp)}`;
    if (!detectedEvents.has(eventKey)) {
      stats.bloodDetections++;
      const confidence = Math.min(Math.round(analysis.brightRed * 400), 95);
      createWarning(eventKey, timestamp, 'blood', confidence,
        `Blood detected via color analysis (${(analysis.brightRed * 100).toFixed(1)}% red pixels)`,
        analysis,
        hash); // Pass hash to the warning creator
    }
  }
}


function createWarning(
  eventKey: string,
  timestamp: number,
  category: string,
  confidence: number,
  description: string,
  analysis: ColorAnalysis | null,
  hash: string // Receive the hash
) {
  const event: VisualEvent = {
    type: category as any,
    timestamp,
    confidence,
    colorAnalysis: analysis || {} as ColorAnalysis
  };
  detectedEvents.set(eventKey, event);

  // Send warning back to main thread, now including the hash
  const payload: DetectionPayload & { hash: string } = {
    id: eventKey,
    videoId: 'visual-color-detected',
    categoryKey: category,
    startTime: Math.max(0, timestamp - 2),
    endTime: timestamp + 5,
    submittedBy: 'visual-color-analyzer',
    status: 'approved',
    score: 0,
    confidenceLevel: confidence,
    requiresModeration: false,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hash: hash // Include the hash in the payload
  };

  self.postMessage({
    type: 'detection',
    payload
  });
}
