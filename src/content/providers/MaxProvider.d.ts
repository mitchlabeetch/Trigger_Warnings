/**
 * Max (HBO Max) streaming provider
 */
import { BaseProvider } from './BaseProvider';
import type { MediaInfo } from '@shared/types/Provider.types';
export declare class MaxProvider extends BaseProvider {
    readonly name = "Max";
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
//# sourceMappingURL=MaxProvider.d.ts.map