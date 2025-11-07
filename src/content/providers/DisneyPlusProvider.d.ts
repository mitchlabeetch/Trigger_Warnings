/**
 * Disney+ streaming provider
 */
import { BaseProvider } from './BaseProvider';
import type { MediaInfo } from '@shared/types/Provider.types';
export declare class DisneyPlusProvider extends BaseProvider {
    readonly name = "Disney+";
    readonly domains: string[];
    private videoElement;
    private lastSeekTime;
    initialize(): Promise<void>;
    getCurrentMedia(): Promise<MediaInfo | null>;
    getVideoElement(): HTMLVideoElement | null;
    getInjectionPoint(): HTMLElement | null;
    private setupVideoListeners;
    private extractTitle;
    private monitorURLChanges;
    dispose(): void;
}
//# sourceMappingURL=DisneyPlusProvider.d.ts.map