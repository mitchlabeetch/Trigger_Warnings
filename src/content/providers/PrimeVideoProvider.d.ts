/**
 * Amazon Prime Video streaming provider
 */
import { BaseProvider } from './BaseProvider';
import type { MediaInfo } from '@shared/types/Provider.types';
export declare class PrimeVideoProvider extends BaseProvider {
    readonly name = "Prime Video";
    readonly domains: string[];
    private videoElement;
    private lastSeekTime;
    initialize(): Promise<void>;
    getCurrentMedia(): Promise<MediaInfo | null>;
    getVideoElement(): HTMLVideoElement | null;
    getInjectionPoint(): HTMLElement | null;
    private setupVideoListeners;
    private extractTitle;
}
//# sourceMappingURL=PrimeVideoProvider.d.ts.map