// Worker state
let offscreenCanvas = null;
let ctx = null;
let previousFrameData = null;
let sceneChangeCount = 0;
const detectedEvents = new Map();
// Stats
const stats = {
    totalFramesAnalyzed: 0,
    bloodDetections: 0,
    goreDetections: 0,
    fireDetections: 0,
    vomitDetections: 0,
    medicalDetections: 0,
    underwaterDetections: 0,
    sceneChangeDetections: 0
};
self.onmessage = (e) => {
    const { type, payload } = e.data;
    if (type === 'analyze_frame') {
        const p = payload;
        analyzeFrame(p.bitmap, p.timestamp);
    }
    else if (type === 'reset') {
        resetState();
    }
};
function resetState() {
    previousFrameData = null;
    sceneChangeCount = 0;
    detectedEvents.clear();
    // Reset stats if needed, but maybe keep them for session
}
function analyzeFrame(bitmap, timestamp) {
    if (!offscreenCanvas) {
        offscreenCanvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        ctx = offscreenCanvas.getContext('2d', {
            willReadFrequently: true
        });
    }
    // Resize canvas if bitmap size changes
    if (offscreenCanvas.width !== bitmap.width || offscreenCanvas.height !== bitmap.height) {
        offscreenCanvas.width = bitmap.width;
        offscreenCanvas.height = bitmap.height;
    }
    if (!ctx)
        return;
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    // Close bitmap to release memory
    bitmap.close();
    stats.totalFramesAnalyzed++;
    const analysis = analyzeColors(imageData);
    // Run detections
    detectBlood(timestamp, analysis);
    detectGore(timestamp, analysis);
    detectFire(timestamp, analysis);
    detectVomit(timestamp, analysis);
    detectMedical(timestamp, analysis);
    detectUnderwater(timestamp, analysis);
    // Scene change detection
    if (previousFrameData) {
        detectSceneChange(timestamp, imageData, previousFrameData);
    }
    previousFrameData = imageData;
}
function analyzeColors(imageData) {
    const data = imageData.data;
    const totalPixels = data.length / 4;
    let brightRedCount = 0;
    let orangeYellowCount = 0;
    let yellowBrownCount = 0;
    let greenishYellowCount = 0;
    let sterileWhiteCount = 0;
    let medicalBlueGreenCount = 0;
    let blueGreenCount = 0;
    let darkPixelCount = 0;
    let totalBrightness = 0;
    let totalSaturation = 0;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        // 1. BLOOD
        if (r > 200 && r > g + 50 && r > b + 50)
            brightRedCount++;
        // 2. FIRE
        if (r > 200 && g > 150 && b < 100)
            orangeYellowCount++;
        // 2b. VOMIT: Yellow-Brown
        if (r > 150 && g > 130 && r > b + 50 && g > b + 40 && b < 100)
            yellowBrownCount++;
        // 2c. VOMIT: Greenish-Yellow
        if (g > 150 && r > 120 && r < 200 && g > r && g > b + 30 && b < 120)
            greenishYellowCount++;
        // 3. STERILE WHITE
        if (luminance > 220 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20)
            sterileWhiteCount++;
        // 4. MEDICAL BLUE-GREEN
        if (b > 150 && g > 150 && r < 120)
            medicalBlueGreenCount++;
        // 5. BLUE-GREEN TINT
        if (b > g && g > r && b > 100)
            blueGreenCount++;
        // 6. DARK PIXELS
        if (luminance < 50)
            darkPixelCount++;
        totalBrightness += luminance;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        totalSaturation += saturation;
    }
    const irregularity = calculateIrregularity(imageData);
    const chunkiness = calculateChunkiness(imageData);
    return {
        brightRed: brightRedCount / totalPixels,
        orangeYellow: orangeYellowCount / totalPixels,
        yellowBrown: yellowBrownCount / totalPixels,
        greenishYellow: greenishYellowCount / totalPixels,
        sterileWhite: sterileWhiteCount / totalPixels,
        medicalBlueGreen: medicalBlueGreenCount / totalPixels,
        blueGreen: blueGreenCount / totalPixels,
        darkPixels: darkPixelCount / totalPixels,
        brightness: totalBrightness / totalPixels / 255,
        saturation: totalSaturation / totalPixels,
        irregularity,
        chunkiness
    };
}
function calculateIrregularity(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    let edgeCount = 0;
    const sampleRate = 4;
    for (let y = 1; y < height - 1; y += sampleRate) {
        for (let x = 1; x < width - 1; x += sampleRate) {
            const idx = (y * width + x) * 4;
            const center = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            const right = 0.299 * data[idx + 4] + 0.587 * data[idx + 5] + 0.114 * data[idx + 6];
            const bottom = 0.299 * data[idx + width * 4] + 0.587 * data[idx + width * 4 + 1] + 0.114 * data[idx + width * 4 + 2];
            const gradientX = Math.abs(center - right);
            const gradientY = Math.abs(center - bottom);
            if (gradientX > 30 || gradientY > 30) {
                edgeCount++;
            }
        }
    }
    const sampledPixels = ((width / sampleRate) * (height / sampleRate));
    return edgeCount / sampledPixels;
}
function calculateChunkiness(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    let inconsistentPatches = 0;
    const sampleRate = 8;
    const patchSize = 4;
    for (let y = 0; y < height - patchSize; y += sampleRate) {
        for (let x = 0; x < width - patchSize; x += sampleRate) {
            const idx = (y * width + x) * 4;
            let avgR = 0, avgG = 0, avgB = 0;
            let maxVariance = 0;
            for (let py = 0; py < patchSize; py++) {
                for (let px = 0; px < patchSize; px++) {
                    const pIdx = ((y + py) * width + (x + px)) * 4;
                    avgR += data[pIdx];
                    avgG += data[pIdx + 1];
                    avgB += data[pIdx + 2];
                }
            }
            const patchPixels = patchSize * patchSize;
            avgR /= patchPixels;
            avgG /= patchPixels;
            avgB /= patchPixels;
            for (let py = 0; py < patchSize; py++) {
                for (let px = 0; px < patchSize; px++) {
                    const pIdx = ((y + py) * width + (x + px)) * 4;
                    const variance = Math.abs(data[pIdx] - avgR) +
                        Math.abs(data[pIdx + 1] - avgG) +
                        Math.abs(data[pIdx + 2] - avgB);
                    maxVariance = Math.max(maxVariance, variance);
                }
            }
            if (maxVariance > 100) {
                inconsistentPatches++;
            }
        }
    }
    const sampledPatches = ((width / sampleRate) * (height / sampleRate));
    return inconsistentPatches / sampledPatches;
}
function detectBlood(timestamp, analysis) {
    if (analysis.brightRed > 0.15) {
        const eventKey = `blood-${Math.floor(timestamp)}`;
        if (!detectedEvents.has(eventKey)) {
            stats.bloodDetections++;
            const confidence = Math.min(Math.round(analysis.brightRed * 400), 95);
            createWarning(eventKey, timestamp, 'blood', confidence, `Blood detected via color analysis (${(analysis.brightRed * 100).toFixed(1)}% red pixels)`, analysis);
        }
    }
}
function detectGore(timestamp, analysis) {
    if (analysis.brightRed > 0.10 && analysis.darkPixels > 0.25 && analysis.irregularity > 0.20) {
        const eventKey = `gore-${Math.floor(timestamp)}`;
        if (!detectedEvents.has(eventKey)) {
            stats.goreDetections++;
            const confidence = Math.min(Math.round((analysis.brightRed * 300 + analysis.irregularity * 200)), 92);
            createWarning(eventKey, timestamp, 'gore', confidence, 'Gore detected via color analysis (red + shadows + irregular patterns)', analysis);
        }
    }
}
function detectFire(timestamp, analysis) {
    if (analysis.orangeYellow > 0.20 && analysis.brightness > 0.6) {
        const eventKey = `fire-${Math.floor(timestamp)}`;
        if (!detectedEvents.has(eventKey)) {
            stats.fireDetections++;
            const confidence = Math.min(Math.round(analysis.orangeYellow * 350), 90);
            createWarning(eventKey, timestamp, 'violence', confidence, `Fire detected via color analysis (${(analysis.orangeYellow * 100).toFixed(1)}% orange/yellow)`, analysis);
        }
    }
}
function detectVomit(timestamp, analysis) {
    // Yellow-brown
    if (analysis.yellowBrown > 0.12 && analysis.chunkiness > 0.15) {
        const eventKey = `vomit-yellowbrown-${Math.floor(timestamp)}`;
        if (!detectedEvents.has(eventKey)) {
            stats.vomitDetections++;
            const confidence = Math.min(Math.round((analysis.yellowBrown * 400) + (analysis.chunkiness * 200)), 92);
            createWarning(eventKey, timestamp, 'vomit', confidence, `Vomit detected via color analysis (${(analysis.yellowBrown * 100).toFixed(1)}% yellow-brown, chunky texture)`, analysis);
        }
    }
    // Greenish-yellow
    if (analysis.greenishYellow > 0.12 && analysis.chunkiness > 0.15) {
        const eventKey = `vomit-green-${Math.floor(timestamp)}`;
        if (!detectedEvents.has(eventKey)) {
            stats.vomitDetections++;
            const confidence = Math.min(Math.round((analysis.greenishYellow * 400) + (analysis.chunkiness * 200)), 90);
            createWarning(eventKey, timestamp, 'vomit', confidence, `Vomit detected via color analysis (${(analysis.greenishYellow * 100).toFixed(1)}% greenish-bile, chunky texture)`, analysis);
        }
    }
    // Mixed
    if (analysis.yellowBrown > 0.08 && analysis.greenishYellow > 0.08 && analysis.chunkiness > 0.12) {
        const eventKey = `vomit-mixed-${Math.floor(timestamp)}`;
        if (!detectedEvents.has(eventKey)) {
            stats.vomitDetections++;
            const confidence = Math.min(Math.round((analysis.yellowBrown + analysis.greenishYellow) * 400 + (analysis.chunkiness * 200)), 95);
            createWarning(eventKey, timestamp, 'vomit', confidence, 'Vomit detected via color analysis (mixed yellow-brown and greenish colors, chunky texture)', analysis);
        }
    }
}
function detectMedical(timestamp, analysis) {
    if (analysis.sterileWhite > 0.30 && analysis.medicalBlueGreen > 0.15) {
        const eventKey = `medical-${Math.floor(timestamp / 3) * 3}`;
        if (!detectedEvents.has(eventKey)) {
            stats.medicalDetections++;
            const confidence = Math.min(Math.round((analysis.sterileWhite + analysis.medicalBlueGreen) * 150), 78);
            createWarning(eventKey, timestamp, 'medical_procedures', confidence, 'Medical scene detected via color analysis (sterile environment)', analysis);
        }
    }
}
function detectUnderwater(timestamp, analysis) {
    if (analysis.blueGreen > 0.40 && analysis.saturation < 0.4) {
        const eventKey = `underwater-${Math.floor(timestamp / 5) * 5}`;
        if (!detectedEvents.has(eventKey)) {
            stats.underwaterDetections++;
            createWarning(eventKey, timestamp, 'violence', 65, 'Underwater scene detected (potential drowning/suffocation trigger)', analysis);
        }
    }
}
function detectSceneChange(timestamp, currentFrame, previousFrame) {
    const difference = calculateFrameDifference(currentFrame, previousFrame);
    if (difference > 0.7) {
        sceneChangeCount++;
        if (sceneChangeCount > 10) {
            const eventKey = `rapid-cuts-${Math.floor(timestamp / 5) * 5}`;
            if (!detectedEvents.has(eventKey)) {
                stats.sceneChangeDetections++;
                createWarning(eventKey, timestamp, 'violence', 70, `Rapid scene changes detected (${sceneChangeCount} cuts in 5s) - may trigger anxiety`, null);
                sceneChangeCount = 0;
            }
        }
    }
    if (timestamp % 5 < 0.2) {
        sceneChangeCount = 0;
    }
}
function calculateFrameDifference(frame1, frame2) {
    const data1 = frame1.data;
    const data2 = frame2.data;
    let changedPixels = 0;
    const threshold = 50;
    for (let i = 0; i < data1.length; i += 4) {
        const lum1 = 0.299 * data1[i] + 0.587 * data1[i + 1] + 0.114 * data1[i + 2];
        const lum2 = 0.299 * data2[i] + 0.587 * data2[i + 1] + 0.114 * data2[i + 2];
        if (Math.abs(lum1 - lum2) > threshold) {
            changedPixels++;
        }
    }
    return changedPixels / (data1.length / 4);
}
function createWarning(eventKey, timestamp, category, confidence, description, analysis) {
    const event = {
        type: category,
        timestamp,
        confidence,
        colorAnalysis: analysis || {}
    };
    detectedEvents.set(eventKey, event);
    // Send warning back to main thread
    const payload = {
        id: eventKey,
        videoId: 'visual-color-detected', // This will be updated by main thread if needed
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
        updatedAt: new Date().toISOString()
    };
    self.postMessage({
        type: 'detection',
        payload
    });
}
export {};
//# sourceMappingURL=VisualAnalyzer.worker.js.map