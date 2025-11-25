import { IStreamingProvider } from "@shared/types/Provider.types";
import { createLogger } from "@shared/utils/logger";

const logger = createLogger('ThemeExtractor');

export class ThemeExtractor {
    private provider: IStreamingProvider;
    private intervalId: number | null = null;

    constructor(provider: IStreamingProvider) {
        this.provider = provider;
    }

    public initialize(): void {
        logger.info(`Initializing for ${this.provider.name}...`);
        this.intervalId = window.setInterval(() => this.extractColor(), 5000);
    }

    private async extractColor(): Promise<void> {
        const video = this.provider.getVideoElement();
        if (!video || video.paused || video.videoWidth === 0 || video.videoHeight === 0) {
            return;
        }

        try {
            const canvas = new OffscreenCanvas(video.videoWidth, video.videoHeight);
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const pixelData = ctx.getImageData(video.videoWidth / 2, video.videoHeight / 2, 1, 1).data;
            const hexColor = `#${('000000' + this.rgbToHex(pixelData[0], pixelData[1], pixelData[2])).slice(-6)}`;

            document.documentElement.style.setProperty('--tw-accent-color', hexColor);
        } catch (error) {
            // Ignore CORS errors, as they are expected with this approach
        }
    }

    private rgbToHex(r: number, g: number, b: number): string {
        return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    public dispose(): void {
        if (this.intervalId) {
            window.clearInterval(this.intervalId);
        }
    }
}
