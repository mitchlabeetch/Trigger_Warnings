
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { VisualCNN } from './VisualCNN';

// Mock classes for Canvas API
class MockCanvasRenderingContext2D {
  canvas: any;
  constructor(canvas: any) {
    this.canvas = canvas;
  }
  putImageData(imageData: ImageData, dx: number, dy: number) {
    // Mock implementation
  }
  drawImage(image: any, dx: number, dy: number, dw: number, dh: number) {
    // Mock implementation
  }
  getImageData(sx: number, sy: number, sw: number, sh: number) {
    // Return a mock ImageData with the requested size
    // We can't use new ImageData() if it's not available, so return a simple object
    // compatible with ImageData
    return {
      width: sw,
      height: sh,
      data: new Uint8ClampedArray(sw * sh * 4),
      colorSpace: 'srgb'
    } as unknown as ImageData;
  }
}

class MockOffscreenCanvas {
  width: number;
  height: number;
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
  getContext(type: string) {
    if (type === '2d') {
      return new MockCanvasRenderingContext2D(this);
    }
    return null;
  }
}

// Global setup for mocks
beforeAll(() => {
  // Mock ImageData if not present (Node environment)
  if (typeof ImageData === 'undefined') {
    global.ImageData = class ImageData {
      width: number;
      height: number;
      data: Uint8ClampedArray;
      colorSpace: PredefinedColorSpace = 'srgb';
      constructor(sw: number, sh: number) {
        this.width = sw;
        this.height = sh;
        this.data = new Uint8ClampedArray(sw * sh * 4);
      }
    } as any;
  }

  // Mock OffscreenCanvas
  global.OffscreenCanvas = MockOffscreenCanvas as any;

  // Mock document if needed (for fallback path testing, though we prefer OffscreenCanvas if available)
  if (typeof document === 'undefined') {
      // Minimal document mock
      (global as any).document = {
          createElement: (tag: string) => {
              if (tag === 'canvas') {
                  return new MockOffscreenCanvas(0, 0); // Reuse logic
              }
              return {};
          }
      };
  }
});

afterAll(() => {
    // Cleanup if necessary
});

describe('VisualCNN', () => {
  it('should be defined', () => {
    const visualCNN = new VisualCNN();
    expect(visualCNN).toBeDefined();
  });

  it('should resize image correctly using mock canvas', async () => {
    const visualCNN = new VisualCNN();
    await visualCNN.loadModel();

    const width = 100;
    const height = 100;
    const imageData = new ImageData(width, height);

    // Bypass private access
    const preprocessed = (visualCNN as any).preprocessFrame(imageData);

    // 224 * 224 * 3 float values
    expect(preprocessed.length).toBe(224 * 224 * 3);
  });
});
