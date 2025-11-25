
import type { IStreamingProvider } from '../../shared/types/Provider.types';

export class ThemeExtractor {
    private provider: IStreamingProvider;
    private intervalId: number | null = null;
    private offscreenCanvas: OffscreenCanvas | null = null;
    private offscreenContext: OffscreenCanvasRenderingContext2D | null = null;

    constructor(provider: IStreamingProvider) {
        this.provider = provider;
        this.initializeOffscreenCanvas();
    }

    private initializeOffscreenCanvas(): void {
        if (typeof OffscreenCanvas !== 'undefined') {
            this.offscreenCanvas = new OffscreenCanvas(1, 1);
            const context = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
            if (context) {
                this.offscreenContext = context;
            }
        }
    }

    public start(): void {
        if (this.intervalId) {
            this.stop();
        }
        this.intervalId = window.setInterval(() => this.sampleVideoFrame(), 5000);
    }

    public stop(): void {
        if (this.intervalId) {
            window.clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    private sampleVideoFrame(): void {
        const videoElement = this.provider.getVideoElement();
        if (videoElement && this.offscreenContext && this.offscreenCanvas) {
            const centerX = videoElement.videoWidth / 2;
            const centerY = videoElement.videoHeight / 2;

            this.offscreenContext.drawImage(videoElement, centerX, centerY, 1, 1, 0, 0, 1, 1);
            const imageData = this.offscreenContext.getImageData(0, 0, 1, 1).data;
            const [r, g, b] = imageData;
            const accentColor = `rgb(${r}, ${g}, ${b})`;

            document.documentElement.style.setProperty('--tw-accent-color', accentColor);
        }
    }
}
